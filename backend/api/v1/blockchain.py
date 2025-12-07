"""
AeroShield Blockchain API
Blockchain interactions and status
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from core.config import settings
from core.logging import get_logger
from core.security import ClerkTokenPayload, verify_clerk_token
from services.blockchain.fdc_client import fdc_client
from services.blockchain.ftso_client import ftso_client
from services.blockchain.smart_account import smart_account_service

logger = get_logger(__name__)
router = APIRouter()


class NetworkStatus(BaseModel):
    """Blockchain network status."""
    network: str
    chain_id: int
    block_number: int
    gas_price_gwei: float
    is_synced: bool
    rpc_url: str


class PriceFeed(BaseModel):
    """FTSO price feed data."""
    symbol: str
    price: float
    decimals: int
    timestamp: datetime
    source: str = "FTSO"


class SmartAccountInfo(BaseModel):
    """Smart Account information."""
    xrpl_address: str
    smart_account_address: str
    nonce: int
    is_deployed: bool


class FDCRequestStatus(BaseModel):
    """FDC attestation request status."""
    request_id: str
    status: str
    attestation_type: str
    submitted_at: Optional[datetime]
    finalized_at: Optional[datetime]
    merkle_root: Optional[str]


@router.get("/status", response_model=NetworkStatus)
async def get_network_status():
    """Get current Flare network status."""
    try:
        web3 = ftso_client.web3
        
        block_number = await web3.eth.block_number
        gas_price = await web3.eth.gas_price
        syncing = await web3.eth.syncing
        
        return NetworkStatus(
            network=settings.flare_network_name,
            chain_id=settings.FLARE_CHAIN_ID,
            block_number=block_number,
            gas_price_gwei=float(web3.from_wei(gas_price, "gwei")),
            is_synced=syncing is False,
            rpc_url=settings.FLARE_RPC_URL,
        )
    except Exception as e:
        logger.error("Failed to get network status", error=str(e))
        raise HTTPException(status_code=503, detail="Network unavailable")


@router.get("/prices", response_model=List[PriceFeed])
async def get_price_feeds(
    symbols: str = Query("FLR/USD,XRP/USD,USDT/USD", description="Comma-separated symbols"),
):
    """Get current FTSO price feeds."""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    
    prices = []
    for symbol in symbol_list:
        try:
            price_data = await ftso_client.get_price(symbol)
            prices.append(PriceFeed(
                symbol=symbol,
                price=float(price_data["price"]),
                decimals=price_data["decimals"],
                timestamp=price_data["timestamp"],
            ))
        except Exception as e:
            logger.warning(f"Failed to get price for {symbol}", error=str(e))
    
    return prices


@router.get("/price/{symbol}", response_model=PriceFeed)
async def get_single_price(symbol: str):
    """Get price for a specific symbol pair."""
    try:
        price_data = await ftso_client.get_price(symbol.upper())
        return PriceFeed(
            symbol=symbol.upper(),
            price=float(price_data["price"]),
            decimals=price_data["decimals"],
            timestamp=price_data["timestamp"],
        )
    except Exception as e:
        logger.error(f"Failed to get price for {symbol}", error=str(e))
        raise HTTPException(status_code=404, detail=f"Price feed not found: {symbol}")


@router.get("/smart-account/{xrpl_address}", response_model=SmartAccountInfo)
async def get_smart_account(
    xrpl_address: str,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """Get Smart Account information for an XRPL address."""
    if not smart_account_service.validate_xrpl_address(xrpl_address):
        raise HTTPException(status_code=400, detail="Invalid XRPL address")
    
    try:
        account = await smart_account_service.get_or_create_smart_account(xrpl_address)
        return SmartAccountInfo(
            xrpl_address=xrpl_address,
            smart_account_address=account["address"],
            nonce=account.get("nonce", 0),
            is_deployed=account.get("is_deployed", False),
        )
    except Exception as e:
        logger.error("Failed to get smart account", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get smart account")


@router.post("/smart-account/execute")
async def execute_smart_account_transaction(
    xrpl_address: str,
    target: str,
    value: int = 0,
    data: str = "0x",
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """
    Execute a gasless transaction via Smart Account.
    The transaction is paid for by the protocol.
    """
    if not smart_account_service.validate_xrpl_address(xrpl_address):
        raise HTTPException(status_code=400, detail="Invalid XRPL address")
    
    try:
        result = await smart_account_service.execute_transaction(
            xrpl_address=xrpl_address,
            target=target,
            value=value,
            data=bytes.fromhex(data[2:]) if data.startswith("0x") else bytes.fromhex(data),
        )
        
        return {
            "success": True,
            "tx_hash": result["tx_hash"],
            "gas_used": result.get("gas_used"),
            "effective_gas_price": result.get("effective_gas_price"),
        }
    except Exception as e:
        logger.error("Smart account execution failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fdc/status/{request_id}", response_model=FDCRequestStatus)
async def get_fdc_request_status(
    request_id: str,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """Get status of an FDC attestation request."""
    try:
        status = await fdc_client.get_attestation_status(request_id)
        return FDCRequestStatus(
            request_id=request_id,
            status=status["status"],
            attestation_type=status.get("attestation_type", "unknown"),
            submitted_at=status.get("submitted_at"),
            finalized_at=status.get("finalized_at"),
            merkle_root=status.get("merkle_root"),
        )
    except Exception as e:
        logger.error("Failed to get FDC status", error=str(e))
        raise HTTPException(status_code=404, detail="FDC request not found")


@router.get("/fdc/proof/{request_id}")
async def get_fdc_proof(
    request_id: str,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """Get Merkle proof for a finalized FDC attestation."""
    try:
        proof = await fdc_client.get_proof(request_id)
        return {
            "request_id": request_id,
            "merkle_root": proof["merkle_root"],
            "proof": proof["proof"],
            "response_data": proof.get("response_data"),
        }
    except Exception as e:
        logger.error("Failed to get FDC proof", error=str(e))
        raise HTTPException(status_code=404, detail="Proof not available")


@router.get("/contracts")
async def get_contract_addresses():
    """Get AeroShield contract addresses."""
    return {
        "network": settings.flare_network_name,
        "chain_id": settings.FLARE_CHAIN_ID,
        "explorer": settings.FLARE_EXPLORER_URL,
        "contracts": {
            "aeroshield_pool": settings.AEROSHIELD_POOL_ADDRESS or "Not deployed",
            "policy_manager": settings.AEROSHIELD_POLICY_MANAGER_ADDRESS or "Not deployed",
            "fdc_hub": settings.FLARE_FDC_HUB_ADDRESS,
            "ftso_v2": settings.FLARE_FTSO_V2_ADDRESS,
            "registry": settings.FLARE_REGISTRY_ADDRESS,
        }
    }


@router.get("/gas-estimate")
async def estimate_gas(
    operation: str = Query(..., description="Operation type: buy_policy, claim, deposit"),
):
    """Estimate gas for common operations."""
    # Gas estimates for different operations
    estimates = {
        "buy_policy": 150000,
        "claim": 200000,
        "deposit": 100000,
        "withdraw": 120000,
        "execute_payout": 180000,
    }
    
    gas_limit = estimates.get(operation, 100000)
    
    try:
        web3 = ftso_client.web3
        gas_price = await web3.eth.gas_price
        gas_price_gwei = float(web3.from_wei(gas_price, "gwei"))
        
        # Get FLR price
        flr_price = await ftso_client.get_price("FLR/USD")
        flr_usd = float(flr_price["price"])
        
        estimated_cost_flr = gas_limit * gas_price_gwei / 1e9
        estimated_cost_usd = estimated_cost_flr * flr_usd
        
        return {
            "operation": operation,
            "gas_limit": gas_limit,
            "gas_price_gwei": gas_price_gwei,
            "estimated_cost_flr": estimated_cost_flr,
            "estimated_cost_usd": estimated_cost_usd,
            "flr_price_usd": flr_usd,
        }
    except Exception as e:
        return {
            "operation": operation,
            "gas_limit": gas_limit,
            "error": "Could not estimate cost",
        }
