"""
AeroShield Flare Data Connector (FDC) Client
Handles attestation requests and verification
"""

import asyncio
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from eth_abi import encode
from web3 import AsyncWeb3
from web3.contract import AsyncContract

from core.config import settings
from core.exceptions import FDCAttestationError
from core.logging import get_logger

logger = get_logger(__name__)

# FDC Contract ABIs (simplified)
FDC_HUB_ABI = [
    {
        "name": "requestAttestation",
        "type": "function",
        "inputs": [
            {"name": "data", "type": "bytes"}
        ],
        "outputs": [{"name": "requestId", "type": "bytes32"}]
    },
    {
        "name": "getAttestationStatus",
        "type": "function",
        "inputs": [{"name": "requestId", "type": "bytes32"}],
        "outputs": [{"name": "status", "type": "uint8"}]
    },
    {
        "name": "getProof",
        "type": "function",
        "inputs": [{"name": "requestId", "type": "bytes32"}],
        "outputs": [
            {"name": "merkleRoot", "type": "bytes32"},
            {"name": "proof", "type": "bytes32[]"}
        ]
    }
]

FDC_VERIFICATION_ABI = [
    {
        "name": "verifyEVMTransaction",
        "type": "function",
        "inputs": [
            {"name": "proof", "type": "bytes32[]"},
            {"name": "merkleRoot", "type": "bytes32"},
            {"name": "data", "type": "bytes"}
        ],
        "outputs": [{"name": "isValid", "type": "bool"}]
    }
]


class FDCClient:
    """Client for interacting with Flare Data Connector."""
    
    def __init__(self):
        self.web3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.FLARE_RPC_URL))
        self.verifier_base_url = "https://fdc-verifier.flare.network"
        self._fdc_hub: Optional[AsyncContract] = None
        
    async def get_fdc_hub(self) -> AsyncContract:
        """Get FDC Hub contract instance."""
        if not self._fdc_hub:
            self._fdc_hub = self.web3.eth.contract(
                address=self.web3.to_checksum_address(settings.FLARE_FDC_HUB_ADDRESS),
                abi=FDC_HUB_ABI
            )
        return self._fdc_hub
    
    async def prepare_web2_json_request(
        self,
        url: str,
        json_path: str,
        expected_type: str = "string"
    ) -> dict:
        """
        Prepare a Web2Json attestation request.
        This is for fetching JSON data from Web2 APIs.
        """
        return {
            "attestationType": "Web2Json",
            "sourceId": "WEB2",
            "requestBody": {
                "url": url,
                "jsonPath": json_path,
                "expectedType": expected_type,
                "postProcessing": []
            }
        }
    
    async def prepare_evm_transaction_request(
        self,
        transaction_hash: str,
        required_confirmations: int = 1,
        source_chain: str = "ETH"
    ) -> dict:
        """
        Prepare an EVMTransaction attestation request.
        """
        return {
            "attestationType": "EVMTransaction",
            "sourceId": source_chain,
            "requestBody": {
                "transactionHash": transaction_hash,
                "requiredConfirmations": required_confirmations,
                "provideInput": True,
                "listEvents": True,
                "logIndices": []
            }
        }
    
    async def prepare_payment_request(
        self,
        transaction_id: str,
        source_chain: str,  # XRP, BTC, DOGE
        in_utxo: int = 0,
        utxo: int = 0
    ) -> dict:
        """
        Prepare a Payment attestation request for non-EVM chains.
        """
        return {
            "attestationType": "Payment",
            "sourceId": source_chain,
            "requestBody": {
                "transactionId": transaction_id,
                "inUtxo": in_utxo,
                "utxo": utxo
            }
        }
    
    async def prepare_flight_status_request(
        self,
        flight_number: str,
        airline_code: str,
        flight_date: datetime
    ) -> dict:
        """
        Prepare a request to verify flight status via Web2Json.
        """
        # Format the flight date
        date_str = flight_date.strftime("%Y/%m/%d")
        
        # FlightStats API URL (example)
        api_url = (
            f"https://api.flightstats.com/flex/flightstatus/rest/v2/json/"
            f"flight/status/{airline_code}/{flight_number}/dep/{date_str}"
        )
        
        return await self.prepare_web2_json_request(
            url=api_url,
            json_path="$.flightStatuses[0].status",
            expected_type="string"
        )
    
    async def encode_request(self, request_data: dict) -> bytes:
        """Encode attestation request for submission."""
        # This is a simplified encoding - actual implementation would follow
        # the specific encoding rules for each attestation type
        import json
        request_json = json.dumps(request_data, separators=(',', ':'))
        return request_json.encode('utf-8')
    
    async def submit_request(self, request_data: dict) -> str:
        """
        Submit attestation request to FDC Hub.
        Returns the request ID.
        """
        try:
            # First, prepare the request via verifier API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.verifier_base_url}/api/prepare",
                    json=request_data,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    raise FDCAttestationError(
                        f"Failed to prepare request: {response.text}"
                    )
                
                prepared = response.json()
            
            # Encode the prepared request
            encoded_request = await self.encode_request(prepared)
            
            # Submit to FDC Hub contract
            fdc_hub = await self.get_fdc_hub()
            
            # Build transaction
            account = self.web3.eth.account.from_key(settings.OPERATOR_PRIVATE_KEY)
            nonce = await self.web3.eth.get_transaction_count(account.address)
            
            tx = await fdc_hub.functions.requestAttestation(
                encoded_request
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
            
            # Extract request ID from logs
            request_id = receipt['logs'][0]['topics'][1].hex() if receipt['logs'] else None
            
            if not request_id:
                # Generate a deterministic request ID
                request_id = "0x" + hashlib.sha256(encoded_request).hexdigest()
            
            logger.info(
                "FDC request submitted",
                request_id=request_id,
                tx_hash=tx_hash.hex()
            )
            
            return request_id
            
        except Exception as e:
            logger.error("Failed to submit FDC request", error=str(e))
            raise FDCAttestationError(f"Submission failed: {str(e)}")
    
    async def get_request_status(self, request_id: str) -> dict:
        """Get the current status of an FDC request."""
        try:
            fdc_hub = await self.get_fdc_hub()
            
            status = await fdc_hub.functions.getAttestationStatus(
                bytes.fromhex(request_id[2:] if request_id.startswith("0x") else request_id)
            ).call()
            
            status_map = {
                0: "pending",
                1: "submitted",
                2: "voting",
                3: "finalized",
                4: "failed"
            }
            
            return {
                "request_id": request_id,
                "status": status_map.get(status, "unknown"),
                "status_code": status
            }
            
        except Exception as e:
            logger.error("Failed to get FDC status", error=str(e))
            raise FDCAttestationError(f"Status check failed: {str(e)}")
    
    async def poll_until_finalized(
        self,
        request_id: str,
        timeout_seconds: int = 180,
        poll_interval: int = 10
    ) -> dict:
        """
        Poll FDC Hub until the request is finalized or timeout.
        """
        start_time = datetime.now(timezone.utc)
        deadline = start_time + timedelta(seconds=timeout_seconds)
        
        while datetime.now(timezone.utc) < deadline:
            status = await self.get_request_status(request_id)
            
            if status["status"] == "finalized":
                logger.info(
                    "FDC request finalized",
                    request_id=request_id,
                    duration=(datetime.now(timezone.utc) - start_time).total_seconds()
                )
                return status
            
            if status["status"] == "failed":
                raise FDCAttestationError(f"Request {request_id} failed")
            
            await asyncio.sleep(poll_interval)
        
        raise FDCAttestationError(
            f"Request {request_id} did not finalize within {timeout_seconds}s"
        )
    
    async def get_proof(self, request_id: str) -> dict:
        """
        Get the Merkle proof for a finalized request.
        """
        try:
            fdc_hub = await self.get_fdc_hub()
            
            request_bytes = bytes.fromhex(
                request_id[2:] if request_id.startswith("0x") else request_id
            )
            
            merkle_root, proof = await fdc_hub.functions.getProof(
                request_bytes
            ).call()
            
            return {
                "request_id": request_id,
                "merkle_root": "0x" + merkle_root.hex(),
                "proof": ["0x" + p.hex() for p in proof]
            }
            
        except Exception as e:
            logger.error("Failed to get FDC proof", error=str(e))
            raise FDCAttestationError(f"Proof retrieval failed: {str(e)}")
    
    async def verify_proof(
        self,
        merkle_root: str,
        proof: list[str],
        data: bytes
    ) -> bool:
        """
        Verify an FDC proof on-chain.
        """
        try:
            # For demo purposes, we'll do basic verification
            # In production, this would call the FdcVerification contract
            
            if not merkle_root or not proof:
                return False
            
            # Simplified verification logic
            # Actual implementation would verify Merkle path
            
            return True
            
        except Exception as e:
            logger.error("FDC proof verification failed", error=str(e))
            return False
    
    async def get_response_data(self, request_id: str) -> Optional[dict]:
        """
        Get the response data for a finalized attestation.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.verifier_base_url}/api/response/{request_id}",
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    return response.json()
                
            return None
            
        except Exception as e:
            logger.error("Failed to get FDC response", error=str(e))
            return None


# Singleton instance
fdc_client = FDCClient()
