"""
AeroShield Triggers API
FDC webhooks and automatic claim triggers
"""

import hashlib
import hmac
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.logging import get_logger
from models.claim import Claim, ClaimStatus, ClaimType
from models.policy import Policy, PolicyStatus
from services.blockchain.fdc_client import fdc_client
from services.insurance.claims_engine import claims_engine

logger = get_logger(__name__)
router = APIRouter()


class FDCWebhookPayload(BaseModel):
    """Payload from FDC finalization webhook."""
    request_id: str
    attestation_type: str
    merkle_root: str
    response_data: dict
    finalized_at: datetime
    block_number: int


class FlightStatusUpdate(BaseModel):
    """Flight status update from external provider."""
    flight_number: str
    airline_code: str
    scheduled_departure: datetime
    actual_departure: Optional[datetime]
    scheduled_arrival: datetime
    actual_arrival: Optional[datetime]
    status: str = Field(..., examples=["on_time", "delayed", "cancelled"])
    delay_minutes: Optional[int]
    delay_reason: Optional[str]


class ManualTriggerRequest(BaseModel):
    """Request for manual claim trigger (admin only)."""
    policy_id: str
    trigger_event: str
    trigger_value: str
    evidence_url: Optional[str]


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify webhook signature for security."""
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/fdc-webhook")
async def fdc_finalization_webhook(
    payload: FDCWebhookPayload,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    x_fdc_signature: str = Header(None),
):
    """
    Webhook endpoint for FDC attestation finalization.
    Called by the Flare network when an attestation is finalized.
    """
    # Find the claim associated with this FDC request
    result = await db.execute(
        select(Claim).where(Claim.fdc_request_id == payload.request_id)
    )
    claim = result.scalar_one_or_none()
    
    if not claim:
        logger.warning("FDC webhook: Claim not found", request_id=payload.request_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found for this FDC request"
        )
    
    # Update claim with FDC data
    claim.fdc_merkle_root = payload.merkle_root
    claim.fdc_proof_data = payload.response_data
    claim.fdc_verified = True
    claim.fdc_verification_timestamp = payload.finalized_at
    
    # Parse the response to check if claim should be approved
    # This depends on the attestation type and response structure
    if payload.attestation_type == "Web2Json":
        # Extract delay information from response
        flight_data = payload.response_data.get("result", {})
        delay_minutes = flight_data.get("delay_minutes", 0)
        
        # Get associated policy
        result = await db.execute(
            select(Policy).where(Policy.id == claim.policy_id)
        )
        policy = result.scalar_one_or_none()
        
        if policy and delay_minutes >= policy.delay_threshold_minutes:
            claim.status = ClaimStatus.APPROVED
            logger.info(
                "Claim approved via FDC",
                claim_id=str(claim.id),
                delay_minutes=delay_minutes
            )
            
            # Queue payout processing
            background_tasks.add_task(
                process_claim_payout,
                claim_id=str(claim.id)
            )
        else:
            claim.status = ClaimStatus.REJECTED
            claim.rejection_reason = f"Delay of {delay_minutes} minutes below threshold"
            logger.info(
                "Claim rejected: below threshold",
                claim_id=str(claim.id),
                delay_minutes=delay_minutes,
                threshold=policy.delay_threshold_minutes if policy else "unknown"
            )
    
    await db.commit()
    
    return {
        "status": "processed",
        "claim_id": str(claim.id),
        "claim_status": claim.status.value,
    }


@router.post("/flight-status")
async def flight_status_update(
    update: FlightStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive flight status updates from external providers.
    Automatically triggers claims for eligible policies.
    """
    logger.info(
        "Flight status update received",
        flight=f"{update.airline_code}{update.flight_number}",
        status=update.status,
        delay=update.delay_minutes
    )
    
    # Find active policies for this flight
    result = await db.execute(
        select(Policy).where(
            and_(
                Policy.flight_number == update.flight_number.upper(),
                Policy.airline_code == update.airline_code.upper(),
                Policy.status == PolicyStatus.ACTIVE,
            )
        )
    )
    policies = result.scalars().all()
    
    if not policies:
        return {
            "status": "no_eligible_policies",
            "flight": f"{update.airline_code}{update.flight_number}"
        }
    
    triggered_claims = []
    
    for policy in policies:
        # Check if delay exceeds threshold
        if update.delay_minutes and update.delay_minutes >= policy.delay_threshold_minutes:
            # Update policy with actual data
            policy.actual_departure = update.actual_departure
            policy.actual_arrival = update.actual_arrival
            policy.actual_delay_minutes = update.delay_minutes
            policy.flight_status = update.status
            
            # Auto-initiate claim
            claim = await claims_engine.initiate_claim(
                db=db,
                policy_id=policy.id,
                user_id=policy.user_id,
                trigger_event="flight_delayed",
                trigger_value=f"{update.delay_minutes} minutes",
                payout_address=policy.payout_address,
            )
            
            triggered_claims.append({
                "policy_id": str(policy.id),
                "claim_id": str(claim.id),
                "delay_minutes": update.delay_minutes,
            })
            
            # Queue FDC verification
            background_tasks.add_task(
                verify_claim_with_fdc_task,
                claim_id=str(claim.id)
            )
    
    await db.commit()
    
    return {
        "status": "processed",
        "flight": f"{update.airline_code}{update.flight_number}",
        "triggered_claims": triggered_claims,
    }


@router.post("/check-delays")
async def check_flight_delays(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger delay check for all active policies.
    This would normally run as a scheduled job.
    """
    # Get all active policies with flights in the next 24 hours
    result = await db.execute(
        select(Policy).where(Policy.status == PolicyStatus.ACTIVE)
    )
    policies = result.scalars().all()
    
    checked = 0
    for policy in policies:
        # Queue individual checks
        background_tasks.add_task(
            check_single_flight_status,
            policy_id=str(policy.id)
        )
        checked += 1
    
    return {
        "status": "queued",
        "policies_checked": checked,
    }


# Background task functions
async def process_claim_payout(claim_id: str):
    """Process payout for an approved claim."""
    logger.info("Processing payout", claim_id=claim_id)
    # Implementation would interact with smart contract
    # to execute the payout
    pass


async def verify_claim_with_fdc_task(claim_id: str):
    """Background task to verify claim with FDC."""
    logger.info("Starting FDC verification", claim_id=claim_id)
    # This would call the FDC client to submit attestation request
    pass


async def check_single_flight_status(policy_id: str):
    """Check status of a single flight."""
    logger.info("Checking flight status", policy_id=policy_id)
    # This would call external flight API and trigger updates
    pass
