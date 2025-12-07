"""
AeroShield Claims API
Claim submission and tracking
"""

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.logging import get_logger
from core.security import ClerkTokenPayload, verify_clerk_token
from models.claim import Claim, ClaimStatus
from models.policy import Policy, PolicyStatus
from models.user import User
from schemas.claim import ClaimCreate, ClaimListResponse, ClaimResponse
from services.insurance.claims_engine import claims_engine

logger = get_logger(__name__)
router = APIRouter()


@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_data: ClaimCreate,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a new claim for a policy.
    Initiates the FDC verification process.
    """
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify policy ownership
    result = await db.execute(
        select(Policy).where(
            and_(Policy.id == claim_data.policy_id, Policy.user_id == user.id)
        )
    )
    policy = result.scalar_one_or_none()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    # Initiate claim through claims engine
    claim = await claims_engine.initiate_claim(
        db=db,
        policy_id=claim_data.policy_id,
        user_id=user.id,
        trigger_event=claim_data.trigger_event,
        trigger_value=claim_data.trigger_value,
        payout_address=claim_data.payout_address or policy.payout_address,
    )
    
    await db.commit()
    await db.refresh(claim)
    
    return claim


@router.get("/", response_model=List[ClaimListResponse])
async def list_claims(
    status_filter: Optional[ClaimStatus] = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """List user's claims with optional filtering."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    query = select(Claim).where(Claim.user_id == user.id)
    
    if status_filter:
        query = query.where(Claim.status == status_filter)
    
    query = query.order_by(Claim.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    claims = result.scalars().all()
    
    return claims


@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: UUID,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed claim information."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    result = await db.execute(
        select(Claim).where(
            and_(Claim.id == claim_id, Claim.user_id == user.id)
        )
    )
    claim = result.scalar_one_or_none()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    return claim


@router.post("/{claim_id}/verify")
async def verify_claim(
    claim_id: UUID,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger FDC verification for a claim.
    Submits attestation request to Flare Data Connector.
    """
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    result = await db.execute(
        select(Claim).where(
            and_(Claim.id == claim_id, Claim.user_id == user.id)
        )
    )
    claim = result.scalar_one_or_none()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    if claim.status not in [ClaimStatus.INITIATED, ClaimStatus.VERIFYING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot verify claim with status: {claim.status}"
        )
    
    # Trigger FDC verification
    verification_result = await claims_engine.verify_claim_with_fdc(db, claim_id)
    
    await db.commit()
    
    return {
        "message": "Verification initiated",
        "claim_id": str(claim_id),
        "fdc_request_id": verification_result.get("request_id"),
        "status": "verifying"
    }


@router.get("/{claim_id}/proof")
async def get_claim_proof(
    claim_id: UUID,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Get FDC proof data for a verified claim."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    result = await db.execute(
        select(Claim).where(
            and_(Claim.id == claim_id, Claim.user_id == user.id)
        )
    )
    claim = result.scalar_one_or_none()
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    if not claim.fdc_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Claim has not been verified yet"
        )
    
    return {
        "claim_id": str(claim.id),
        "claim_number": claim.claim_number,
        "fdc_request_id": claim.fdc_request_id,
        "fdc_merkle_root": claim.fdc_merkle_root,
        "fdc_attestation_type": claim.fdc_attestation_type,
        "fdc_proof_data": claim.fdc_proof_data,
        "verified_at": claim.fdc_verification_timestamp,
    }
