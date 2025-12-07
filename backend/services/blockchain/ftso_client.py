"""
AeroShield FTSO Client
Flare Time Series Oracle integration for price feeds
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from web3 import AsyncWeb3
from web3.contract import AsyncContract

from core.config import settings
from core.exceptions import FTSOPriceError
from core.logging import get_logger

logger = get_logger(__name__)

# FTSO V2 Contract ABI (simplified)
FTSO_V2_ABI = [
    {
        "name": "getFeedById",
        "type": "function",
        "inputs": [{"name": "feedId", "type": "bytes21"}],
        "outputs": [
            {"name": "value", "type": "int256"},
            {"name": "decimals", "type": "uint8"},
            {"name": "timestamp", "type": "uint64"}
        ]
    },
    {
        "name": "getFeedsById",
        "type": "function",
        "inputs": [{"name": "feedIds", "type": "bytes21[]"}],
        "outputs": [
            {"name": "values", "type": "int256[]"},
            {"name": "decimals", "type": "uint8[]"},
            {"name": "timestamps", "type": "uint64[]"}
        ]
    },
    {
        "name": "getCurrentFeed",
        "type": "function",
        "inputs": [{"name": "symbol", "type": "string"}],
        "outputs": [
            {"name": "value", "type": "uint256"},
            {"name": "timestamp", "type": "uint256"},
            {"name": "decimals", "type": "uint8"}
        ]
    }
]

# Feed IDs for common pairs (Flare's feed ID format)
FEED_IDS = {
    "FLR/USD": bytes.fromhex("01464c522f555344000000000000000000000000"),
    "XRP/USD": bytes.fromhex("015852502f555344000000000000000000000000"),
    "BTC/USD": bytes.fromhex("014254432f555344000000000000000000000000"),
    "ETH/USD": bytes.fromhex("014554482f555344000000000000000000000000"),
    "USDT/USD": bytes.fromhex("01555344542f555344000000000000000000000000"),
    "SGB/USD": bytes.fromhex("015347422f555344000000000000000000000000"),
}


class FTSOClient:
    """Client for interacting with Flare Time Series Oracle."""
    
    def __init__(self):
        self.web3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.FLARE_RPC_URL))
        self._ftso_contract: Optional[AsyncContract] = None
        
        # Cache for price feeds
        self._price_cache: dict[str, dict] = {}
        self._cache_ttl = 30  # seconds
    
    async def get_ftso_contract(self) -> AsyncContract:
        """Get FTSO V2 contract instance."""
        if not self._ftso_contract:
            self._ftso_contract = self.web3.eth.contract(
                address=self.web3.to_checksum_address(settings.FLARE_FTSO_V2_ADDRESS),
                abi=FTSO_V2_ABI
            )
        return self._ftso_contract
    
    def _get_feed_id(self, symbol: str) -> bytes:
        """Get feed ID for a symbol pair."""
        symbol_upper = symbol.upper()
        if symbol_upper not in FEED_IDS:
            raise FTSOPriceError(f"Unknown feed symbol: {symbol}")
        return FEED_IDS[symbol_upper]
    
    def _is_cache_valid(self, symbol: str) -> bool:
        """Check if cached price is still valid."""
        if symbol not in self._price_cache:
            return False
        
        cached = self._price_cache[symbol]
        age = (datetime.now(timezone.utc) - cached["fetched_at"]).total_seconds()
        return age < self._cache_ttl
    
    async def get_price(self, symbol: str) -> dict:
        """
        Get current price for a symbol pair.
        Returns price, decimals, and timestamp.
        """
        # Check cache first
        if self._is_cache_valid(symbol):
            return self._price_cache[symbol]
        
        try:
            ftso = await self.get_ftso_contract()
            feed_id = self._get_feed_id(symbol)
            
            value, decimals, timestamp = await ftso.functions.getFeedById(
                feed_id
            ).call()
            
            # Convert to human-readable price
            price = Decimal(value) / Decimal(10 ** decimals)
            
            result = {
                "symbol": symbol,
                "price": price,
                "decimals": decimals,
                "timestamp": datetime.fromtimestamp(timestamp, tz=timezone.utc),
                "raw_value": value,
                "fetched_at": datetime.now(timezone.utc)
            }
            
            # Update cache
            self._price_cache[symbol] = result
            
            logger.debug(
                "FTSO price fetched",
                symbol=symbol,
                price=str(price)
            )
            
            return result
            
        except Exception as e:
            logger.error("Failed to get FTSO price", symbol=symbol, error=str(e))
            raise FTSOPriceError(f"Failed to fetch {symbol} price: {str(e)}")
    
    async def get_prices(self, symbols: list[str]) -> dict[str, dict]:
        """
        Get prices for multiple symbols in a single call.
        """
        results = {}
        
        try:
            ftso = await self.get_ftso_contract()
            
            # Get feed IDs for all symbols
            feed_ids = [self._get_feed_id(s) for s in symbols]
            
            # Batch call
            values, decimals_list, timestamps = await ftso.functions.getFeedsById(
                feed_ids
            ).call()
            
            for i, symbol in enumerate(symbols):
                price = Decimal(values[i]) / Decimal(10 ** decimals_list[i])
                
                results[symbol] = {
                    "symbol": symbol,
                    "price": price,
                    "decimals": decimals_list[i],
                    "timestamp": datetime.fromtimestamp(timestamps[i], tz=timezone.utc),
                    "raw_value": values[i],
                    "fetched_at": datetime.now(timezone.utc)
                }
                
                # Update cache
                self._price_cache[symbol] = results[symbol]
            
            return results
            
        except Exception as e:
            logger.error("Failed to get FTSO prices", error=str(e))
            raise FTSOPriceError(f"Batch price fetch failed: {str(e)}")
    
    async def get_flr_usd(self) -> Decimal:
        """Get FLR/USD price."""
        result = await self.get_price("FLR/USD")
        return result["price"]
    
    async def get_xrp_usd(self) -> Decimal:
        """Get XRP/USD price."""
        result = await self.get_price("XRP/USD")
        return result["price"]
    
    async def get_usdt_usd(self) -> Decimal:
        """Get USDT/USD price (should be ~1.0)."""
        result = await self.get_price("USDT/USD")
        return result["price"]
    
    async def convert_to_usd(
        self,
        amount: Decimal,
        from_currency: str
    ) -> Decimal:
        """Convert an amount to USD."""
        if from_currency.upper() == "USD":
            return amount
        
        symbol = f"{from_currency.upper()}/USD"
        price = await self.get_price(symbol)
        return amount * price["price"]
    
    async def convert_from_usd(
        self,
        usd_amount: Decimal,
        to_currency: str
    ) -> Decimal:
        """Convert USD amount to another currency."""
        if to_currency.upper() == "USD":
            return usd_amount
        
        symbol = f"{to_currency.upper()}/USD"
        price = await self.get_price(symbol)
        return usd_amount / price["price"]
    
    async def get_exchange_rate(
        self,
        from_currency: str,
        to_currency: str
    ) -> Decimal:
        """Get exchange rate between two currencies."""
        if from_currency.upper() == to_currency.upper():
            return Decimal("1.0")
        
        # Get both prices in USD and calculate rate
        from_price = await self.get_price(f"{from_currency.upper()}/USD")
        to_price = await self.get_price(f"{to_currency.upper()}/USD")
        
        return from_price["price"] / to_price["price"]
    
    async def get_price_with_confidence(self, symbol: str) -> dict:
        """
        Get price with confidence interval.
        Uses historical data to estimate volatility.
        """
        current = await self.get_price(symbol)
        
        # For demo, we'll estimate confidence based on asset type
        volatility_estimates = {
            "FLR/USD": Decimal("0.05"),   # 5%
            "XRP/USD": Decimal("0.03"),   # 3%
            "BTC/USD": Decimal("0.02"),   # 2%
            "ETH/USD": Decimal("0.025"),  # 2.5%
            "USDT/USD": Decimal("0.001"), # 0.1%
        }
        
        volatility = volatility_estimates.get(symbol.upper(), Decimal("0.05"))
        
        return {
            **current,
            "confidence": {
                "volatility": volatility,
                "low": current["price"] * (1 - volatility),
                "high": current["price"] * (1 + volatility)
            }
        }
    
    async def health_check(self) -> dict:
        """Check FTSO connection health."""
        try:
            # Try to get a common price
            flr_price = await self.get_price("FLR/USD")
            
            return {
                "healthy": True,
                "last_price": str(flr_price["price"]),
                "last_update": flr_price["timestamp"].isoformat(),
                "rpc_url": settings.FLARE_RPC_URL
            }
            
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e)
            }


# Singleton instance
ftso_client = FTSOClient()
