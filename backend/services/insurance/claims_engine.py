"""
AeroShield Claims Engine
Processes and manages insurance claims
"""

import secrets
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import (
    PolicyAlreadyClaimedError,
    PolicyNotActiveError,
    ResourceNotFoundError,
    FDCAttestationError,
)
from core.logging import get_logger
from models.claim import Claim, ClaimStatus, ClaimType
from models.policy import Policy, PolicyStatus
from services.blockchain.fdc_client import fdc_client
from services.blockchain.ftso_client import ftso_client
from services.insurance.pool_manager import pool_manager

logger = get_logger(__name__)


class ClaimsEngine:
    """Engine for processing insurance claims."""
    
    def __init__(self):
        self.claim_prefix = "CLM"
    
    def generate_claim_number(self) -> str:
        """Generate unique claim number."""
        timestamp = datetime.now(timezone.utc).strftime("%y%m%d")
        random_part = secrets.token_hex(3).upper()
        return f"{self.claim_prefix}-{timestamp}-{random_part}"
    
    async def initiate_claim(
        self,
        db: AsyncSession,
        policy_id: UUID,
        user_id: UUID,
        trigger_event: str,
        trigger_value: Optional[str],
        payout_address: str
    ) -> Claim:
        """Initiate a new claim for a policy."""
        # Get policy
        result = await db.execute(
            select(Policy).where(Policy.id == policy_id)
        )
        policy = result.scalar_one_or_none()
        
        if not policy:
            raise ResourceNotFoundError("Policy", policy_id)
        
        # Verify ownership
        if policy.user_id != user_id:
            raise ResourceNotFoundError("Policy", policy_id)
        
        # Check policy status
        if policy.status != PolicyStatus.ACTIVE:
            raise PolicyNotActiveError(str(policy_id))
        
        # Check if already claimed
        if policy.status in [PolicyStatus.CLAIMED, PolicyStatus.PAID]:
            raise PolicyAlreadyClaimedError(str(policy_id))
        
        # Create claim
        claim = Claim(
            claim_number=self.generate_claim_number(),
            user_id=user_id,
            policy_id=policy_id,
            claim_type=ClaimType.AUTOMATIC,
            status=ClaimStatus.INITIATED,
            trigger_event=trigger_event,
            trigger_value=trigger_value,
            trigger_timestamp=datetime.now(timezone.utc),
            payout_amount=policy.coverage_amount,
            payout_currency=policy.currency,
            payout_address=payout_address
        )
        
        db.add(claim)
        
        # Update policy status
        policy.status = PolicyStatus.PAYOUT_PENDING
        
        await db.flush()
        
        logger.info(
            "Claim initiated",
            claim_id=str(claim.id),
            claim_number=claim.claim_number,
            policy_id=str(policy_id)
        )
        
        return claim
    
    async def verify_claim_with_fdc(
        self,
        db: AsyncSession,
        claim_id: UUID
    ) -> dict:
        """Verify a claim using FDC attestation."""
        # Get claim with policy
        result = await db.execute(
            select(Claim).where(Claim.id == claim_id)
        )
        claim = result.scalar_one_or_none()
        
        if not claim:
            raise ResourceNotFoundError("Claim", claim_id)
        
        # Get associated policy
        result = await db.execute(
            select(Policy).where(Policy.id == claim.policy_id)
        )
        policy = result.scalar_one_or_none()
        
        if not policy:
            raise ResourceNotFoundError("Policy", claim.policy_id)
        
        # Update claim status
        claim.status = ClaimStatus.VERIFYING
        await db.flush()
        
        try:
            # Prepare FDC request for flight status
            fdc_request = await fdc_client.prepare_flight_status_request(
                flight_number=policy.flight_number,
                airline_code=policy.airline_code,
                flight_date=policy.scheduled_departure
            )
            
            # Submit to FDC
            request_id = await fdc_client.submit_request(fdc_request)
            
            # Update claim with FDC request ID
            claim.fdc_request_id = request_id
            claim.fdc_attestation_type = "EVMTransaction"
            await db.flush()
            
            # Wait for finalization (in production, this would be async)
            await fdc_client.poll_until_finalized(request_id)
            
            # Get proof
            proof = await fdc_client.get_proof(request_id)
            
            # Get response data
            response_data = await fdc_client.get_response_data(request_id)
            
            # Verify the proof
            is_valid = await fdc_client.verify_proof(
                merkle_root=proof["merkle_root"],
                proof=proof["proof"],
                data=b""  # Would be the actual data
            )
            
            if is_valid:
                claim.fdc_merkle_root = proof["merkle_root"]
                claim.fdc_proof_data = {
                    "proof": proof["proof"],
                    "response": response_data
                }
                claim.fdc_verified = True
                claim.fdc_verification_timestamp = datetime.now(timezone.utc)
                claim.status = ClaimStatus.APPROVED
                claim.verified_at = datetime.now(timezone.utc)
                claim.approved_at = datetime.now(timezone.utc)
                
                # Store raw flight data
                if response_data:
                    claim.raw_flight_data = response_data
                
                logger.info(
                    "Claim verified via FDC",
                    claim_id=str(claim_id),
                    request_id=request_id
                )
            else:
                claim.fdc_verified = False
                claim.status = ClaimStatus.REJECTED
                claim.rejection_reason = "FDC proof verification failed"
            
            await db.flush()
            
            return {
                "is_verified": is_valid,
                "fdc_request_id": request_id,
                "merkle_root": proof.get("merkle_root"),
                "verification_timestamp": datetime.now(timezone.utc),
                "flight_data": response_data,
                "error_message": None if is_valid else "Verification failed"
            }
            
        except FDCAttestationError as e:
            claim.status = ClaimStatus.FAILED
            claim.error_message = str(e)
            await db.flush()
            
            logger.error(
                "FDC verification failed",
                claim_id=str(claim_id),
                error=str(e)
            )
            
            return {
                "is_verified": False,
                "fdc_request_id": claim.fdc_request_id,
                "merkle_root": None,
                "verification_timestamp": datetime.now(timezone.utc),
                "flight_data": None,
                "error_message": str(e)
            }
    
    async def process_payout(
        self,
        db: AsyncSession,
        claim_id: UUID,
        pool_id: UUID
    ) -> dict:
        """Process payout for an approved claim."""
        # Get claim
        result = await db.execute(
            select(Claim).where(Claim.id == claim_id)
        )
        claim = result.scalar_one_or_none()
        
        if not claim:
            raise ResourceNotFoundError("Claim", claim_id)
        
        if claim.status != ClaimStatus.APPROVED:
            raise ValueError(f"Claim {claim_id} is not approved for payout")
        
        # Update status to processing
        claim.status = ClaimStatus.PROCESSING
        await db.flush()
        
        try:
            # Get FTSO price for payout valuation
            usdt_price = await ftso_client.get_usdt_usd()
            claim.ftso_price_usd = usdt_price
            claim.ftso_timestamp = datetime.now(timezone.utc)
            
            # Process payout through pool
            payout_info = await pool_manager.process_payout(
                db=db,
                pool_id=pool_id,
                amount=claim.payout_amount,
                claim_id=claim_id,
                user_id=claim.user_id,
                to_address=claim.payout_address
            )
            
            # Update claim status
            claim.status = ClaimStatus.PAID
            claim.paid_at = datetime.now(timezone.utc)
            
            # Update policy status
            await db.execute(
                update(Policy)
                .where(Policy.id == claim.policy_id)
                .values(
                    status=PolicyStatus.PAID,
                    payout_amount=claim.payout_amount,
                    paid_at=datetime.now(timezone.utc),
                    payout_address=claim.payout_address
                )
            )
            
            await db.flush()
            
            logger.info(
                "Claim payout processed",
                claim_id=str(claim_id),
                amount=str(claim.payout_amount)
            )
            
            return {
                "success": True,
                "claim_id": str(claim_id),
                "payout_amount": float(claim.payout_amount),
                "payout_address": claim.payout_address,
                "ftso_price_usd": float(usdt_price),
                "paid_at": claim.paid_at.isoformat()
            }
            
        except Exception as e:
            claim.status = ClaimStatus.FAILED
            claim.error_message = str(e)
            await db.flush()
            
            logger.error(
                "Payout processing failed",
                claim_id=str(claim_id),
                error=str(e)
            )
            
            return {
                "success": False,
                "claim_id": str(claim_id),
                "error": str(e)
            }
    
    async def auto_process_claim(
        self,
        db: AsyncSession,
        policy_id: UUID,
        user_id: UUID,
        pool_id: UUID,
        payout_address: str
    ) -> dict:
        """
        Automatically process a claim end-to-end.
        This is the main entry point for automatic claims.
        """
        logger.info("Starting auto claim process", policy_id=str(policy_id))
        
        # 1. Initiate claim
        claim = await self.initiate_claim(
            db=db,
            policy_id=policy_id,
            user_id=user_id,
            trigger_event="flight_delayed",
            trigger_value=None,  # Will be filled by FDC
            payout_address=payout_address
        )
        
        # 2. Verify with FDC
        verification = await self.verify_claim_with_fdc(db=db, claim_id=claim.id)
        
        if not verification["is_verified"]:
            return {
                "success": False,
                "claim_id": str(claim.id),
                "claim_number": claim.claim_number,
                "status": "verification_failed",
                "error": verification.get("error_message")
            }
        
        # 3. Process payout
        payout = await self.process_payout(
            db=db,
            claim_id=claim.id,
            pool_id=pool_id
        )
        
        return {
            "success": payout["success"],
            "claim_id": str(claim.id),
            "claim_number": claim.claim_number,
            "status": "paid" if payout["success"] else "payout_failed",
            "payout_amount": payout.get("payout_amount"),
            "payout_address": payout.get("payout_address"),
            "paid_at": payout.get("paid_at"),
            "error": payout.get("error")
        }
    
    async def get_claim_status(
        self,
        db: AsyncSession,
        claim_id: UUID
    ) -> dict:
        """Get detailed status of a claim."""
        result = await db.execute(
            select(Claim).where(Claim.id == claim_id)
        )
        claim = result.scalar_one_or_none()
        
        if not claim:
            raise ResourceNotFoundError("Claim", claim_id)
        
        # Calculate progress
        progress_steps = [
            {"step": "initiated", "completed": True, "timestamp": claim.created_at.isoformat()},
            {"step": "verifying", "completed": claim.fdc_request_id is not None,
             "timestamp": claim.fdc_verification_timestamp.isoformat() if claim.fdc_verification_timestamp else None},
            {"step": "approved", "completed": claim.approved_at is not None,
             "timestamp": claim.approved_at.isoformat() if claim.approved_at else None},
            {"step": "paid", "completed": claim.paid_at is not None,
             "timestamp": claim.paid_at.isoformat() if claim.paid_at else None}
        ]
        
        completed_steps = sum(1 for s in progress_steps if s["completed"])
        progress_percentage = int((completed_steps / len(progress_steps)) * 100)
        
        return {
            "claim_id": str(claim.id),
            "claim_number": claim.claim_number,
            "status": claim.status.value,
            "progress_percentage": progress_percentage,
            "steps": progress_steps,
            "fdc_verified": claim.fdc_verified,
            "payout_amount": float(claim.payout_amount),
            "payout_address": claim.payout_address,
            "paid_at": claim.paid_at.isoformat() if claim.paid_at else None,
            "error_message": claim.error_message
        }


# Singleton instance
claims_engine = ClaimsEngine()
