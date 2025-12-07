"""
AeroShield Smart Account Service
Flare Smart Accounts for gasless XRPL interactions
"""

from datetime import datetime, timezone
from typing import Optional

from web3 import AsyncWeb3
from web3.contract import AsyncContract

from core.config import settings
from core.exceptions import SmartAccountError
from core.logging import get_logger

logger = get_logger(__name__)

# Smart Account Registry ABI (simplified)
SMART_ACCOUNT_REGISTRY_ABI = [
    {
        "name": "getSmartAccount",
        "type": "function",
        "inputs": [{"name": "xrplAddress", "type": "string"}],
        "outputs": [{"name": "smartAccount", "type": "address"}]
    },
    {
        "name": "createSmartAccount",
        "type": "function",
        "inputs": [{"name": "xrplAddress", "type": "string"}],
        "outputs": [{"name": "smartAccount", "type": "address"}]
    },
    {
        "name": "executeForUser",
        "type": "function",
        "inputs": [
            {"name": "smartAccount", "type": "address"},
            {"name": "target", "type": "address"},
            {"name": "value", "type": "uint256"},
            {"name": "data", "type": "bytes"},
            {"name": "proof", "type": "bytes"}
        ],
        "outputs": [{"name": "success", "type": "bool"}]
    }
]

# Smart Account ABI (individual account)
SMART_ACCOUNT_ABI = [
    {
        "name": "owner",
        "type": "function",
        "inputs": [],
        "outputs": [{"name": "", "type": "address"}]
    },
    {
        "name": "xrplAddress",
        "type": "function",
        "inputs": [],
        "outputs": [{"name": "", "type": "string"}]
    },
    {
        "name": "execute",
        "type": "function",
        "inputs": [
            {"name": "target", "type": "address"},
            {"name": "value", "type": "uint256"},
            {"name": "data", "type": "bytes"}
        ],
        "outputs": [{"name": "success", "type": "bool"}]
    },
    {
        "name": "nonce",
        "type": "function",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}]
    }
]


class SmartAccountService:
    """Service for managing Flare Smart Accounts."""
    
    def __init__(self):
        self.web3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.FLARE_RPC_URL))
        self._registry: Optional[AsyncContract] = None
        
        # In production, this would be the deployed registry address
        self.registry_address = "0x0000000000000000000000000000000000000000"
    
    async def get_registry(self) -> AsyncContract:
        """Get Smart Account Registry contract."""
        if not self._registry:
            self._registry = self.web3.eth.contract(
                address=self.web3.to_checksum_address(self.registry_address),
                abi=SMART_ACCOUNT_REGISTRY_ABI
            )
        return self._registry
    
    def validate_xrpl_address(self, address: str) -> bool:
        """Validate XRPL address format."""
        if not address:
            return False
        
        # XRPL addresses start with 'r' and are 25-35 characters
        if not address.startswith('r'):
            return False
        
        if len(address) < 25 or len(address) > 35:
            return False
        
        # Check for valid base58 characters
        valid_chars = set('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')
        return all(c in valid_chars for c in address)
    
    async def get_smart_account(self, xrpl_address: str) -> Optional[str]:
        """
        Get the Flare Smart Account address for an XRPL address.
        Returns None if no smart account exists.
        """
        if not self.validate_xrpl_address(xrpl_address):
            raise SmartAccountError(f"Invalid XRPL address: {xrpl_address}")
        
        try:
            registry = await self.get_registry()
            
            smart_account = await registry.functions.getSmartAccount(
                xrpl_address
            ).call()
            
            # Check if it's the zero address (no account exists)
            if smart_account == "0x0000000000000000000000000000000000000000":
                return None
            
            return smart_account
            
        except Exception as e:
            logger.error(
                "Failed to get smart account",
                xrpl_address=xrpl_address,
                error=str(e)
            )
            raise SmartAccountError(f"Failed to get smart account: {str(e)}")
    
    async def create_smart_account(self, xrpl_address: str) -> str:
        """
        Create a new Smart Account for an XRPL address.
        """
        if not self.validate_xrpl_address(xrpl_address):
            raise SmartAccountError(f"Invalid XRPL address: {xrpl_address}")
        
        # Check if account already exists
        existing = await self.get_smart_account(xrpl_address)
        if existing:
            logger.info(
                "Smart account already exists",
                xrpl_address=xrpl_address,
                smart_account=existing
            )
            return existing
        
        try:
            registry = await self.get_registry()
            account = self.web3.eth.account.from_key(settings.OPERATOR_PRIVATE_KEY)
            
            # Build transaction
            nonce = await self.web3.eth.get_transaction_count(account.address)
            
            tx = await registry.functions.createSmartAccount(
                xrpl_address
            ).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 500000,
                'gasPrice': await self.web3.eth.gas_price
            })
            
            # Sign and send
            signed_tx = account.sign_transaction(tx)
            tx_hash = await self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            receipt = await self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get the created account address from logs
            smart_account = await self.get_smart_account(xrpl_address)
            
            logger.info(
                "Smart account created",
                xrpl_address=xrpl_address,
                smart_account=smart_account,
                tx_hash=tx_hash.hex()
            )
            
            return smart_account
            
        except Exception as e:
            logger.error(
                "Failed to create smart account",
                xrpl_address=xrpl_address,
                error=str(e)
            )
            raise SmartAccountError(f"Failed to create smart account: {str(e)}")
    
    async def execute_for_user(
        self,
        smart_account: str,
        target_contract: str,
        value: int,
        data: bytes,
        fdc_proof: bytes
    ) -> dict:
        """
        Execute a transaction on behalf of a user using their Smart Account.
        This is the gasless transaction mechanism.
        """
        try:
            registry = await self.get_registry()
            account = self.web3.eth.account.from_key(settings.OPERATOR_PRIVATE_KEY)
            
            nonce = await self.web3.eth.get_transaction_count(account.address)
            
            tx = await registry.functions.executeForUser(
                self.web3.to_checksum_address(smart_account),
                self.web3.to_checksum_address(target_contract),
                value,
                data,
                fdc_proof
            ).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 500000,
                'gasPrice': await self.web3.eth.gas_price
            })
            
            signed_tx = account.sign_transaction(tx)
            tx_hash = await self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            receipt = await self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            logger.info(
                "Executed transaction for user",
                smart_account=smart_account,
                target=target_contract,
                tx_hash=tx_hash.hex()
            )
            
            return {
                "success": receipt['status'] == 1,
                "tx_hash": tx_hash.hex(),
                "block_number": receipt['blockNumber'],
                "gas_used": receipt['gasUsed']
            }
            
        except Exception as e:
            logger.error(
                "Failed to execute for user",
                smart_account=smart_account,
                error=str(e)
            )
            raise SmartAccountError(f"Execution failed: {str(e)}")
    
    async def get_account_info(self, smart_account: str) -> dict:
        """Get information about a Smart Account."""
        try:
            contract = self.web3.eth.contract(
                address=self.web3.to_checksum_address(smart_account),
                abi=SMART_ACCOUNT_ABI
            )
            
            owner = await contract.functions.owner().call()
            xrpl_address = await contract.functions.xrplAddress().call()
            nonce = await contract.functions.nonce().call()
            balance = await self.web3.eth.get_balance(smart_account)
            
            return {
                "address": smart_account,
                "owner": owner,
                "xrpl_address": xrpl_address,
                "nonce": nonce,
                "balance_wei": balance,
                "balance_flr": self.web3.from_wei(balance, 'ether')
            }
            
        except Exception as e:
            logger.error(
                "Failed to get account info",
                smart_account=smart_account,
                error=str(e)
            )
            raise SmartAccountError(f"Failed to get account info: {str(e)}")
    
    async def derive_smart_account_address(self, xrpl_address: str) -> str:
        """
        Deterministically derive the expected Smart Account address
        for an XRPL address (before creation).
        """
        # This would use CREATE2-style derivation in production
        import hashlib
        
        # Simple deterministic derivation for demo
        hash_input = f"aeroshield:{xrpl_address}".encode()
        address_hash = hashlib.sha256(hash_input).hexdigest()[-40:]
        
        return f"0x{address_hash}"
    
    def encode_memo_instruction(
        self,
        action: str,
        params: dict
    ) -> str:
        """
        Encode an instruction to be placed in XRPL payment memo.
        Users send XRP with this memo to trigger actions.
        """
        import json
        
        instruction = {
            "protocol": "aeroshield",
            "version": "1.0",
            "action": action,
            "params": params,
            "timestamp": int(datetime.now(timezone.utc).timestamp())
        }
        
        return json.dumps(instruction, separators=(',', ':'))
    
    def decode_memo_instruction(self, memo: str) -> Optional[dict]:
        """Decode an instruction from XRPL payment memo."""
        import json
        
        try:
            instruction = json.loads(memo)
            
            if instruction.get("protocol") != "aeroshield":
                return None
            
            return instruction
            
        except json.JSONDecodeError:
            return None


# Singleton instance
smart_account_service = SmartAccountService()
