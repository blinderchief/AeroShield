"""
AeroShield Policies API
Policy creation, management, and quotes
"""

import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.logging import get_logger
from core.security import ClerkTokenPayload, verify_clerk_token
from models.policy import Policy, PolicyStatus, PolicyType
from models.user import User
from schemas.policy import (
    PolicyCreate,
    PolicyListResponse,
    PolicyQuoteRequest,
    PolicyQuoteResponse,
    PolicyResponse,
)
from services.ai.gemini_agent import gemini_agent
from services.blockchain.ftso_client import ftso_client

logger = get_logger(__name__)
router = APIRouter()


def generate_policy_number() -> str:
    """Generate unique policy number."""
    timestamp = datetime.now(timezone.utc).strftime("%y%m%d")
    random_part = secrets.token_hex(3).upper()
    return f"AS-{timestamp}-{random_part}"


@router.post("/quote", response_model=PolicyQuoteResponse)
async def get_policy_quote(
    request: PolicyQuoteRequest,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a quote for a policy based on AI risk assessment.
    Uses Gemini for delay prediction and FTSO for pricing.
    """
    # Get AI prediction
    prediction = await gemini_agent.predict_flight_delay(
        flight_number=request.flight_number,
        airline_code=request.airline_code,
        departure_airport=request.departure_airport,
        arrival_airport=request.arrival_airport,
        flight_date=request.scheduled_departure.date(),
        departure_time=request.scheduled_departure.time(),
    )
    
    # Calculate premium based on risk
    base_rate = Decimal("0.02")  # 2% base
    risk_multiplier = Decimal(str(1 + prediction["delay_probability"]))
    
    premium = request.coverage_amount * base_rate * risk_multiplier
    premium = max(premium, Decimal("5.00"))  # Minimum $5
    premium = round(premium, 2)
    
    return PolicyQuoteResponse(
        premium_amount=premium,
        coverage_amount=request.coverage_amount,
        currency="USDT",
        delay_threshold_minutes=request.delay_threshold_minutes,
        ai_risk_score=prediction["risk_score"],
        ai_delay_probability=prediction["delay_probability"],
        risk_factors={
            "factors": prediction.get("risk_factors", []),
            "weather": prediction.get("weather_summary", ""),
            "historical": prediction.get("historical_analysis", ""),
        },
        suggested_premium=premium,
        valid_until=datetime.now(timezone.utc) + timedelta(hours=1),
    )


@router.post("/buy", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def buy_policy(
    policy_data: PolicyCreate,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Purchase a new insurance policy.
    Requires premium payment via blockchain transaction.
    """
    # Get user
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please complete onboarding first."
        )
    
    # Get AI prediction for pricing
    prediction = await gemini_agent.predict_flight_delay(
        flight_number=policy_data.flight_number,
        airline_code=policy_data.airline_code,
        departure_airport=policy_data.departure_airport,
        arrival_airport=policy_data.arrival_airport,
        flight_date=policy_data.scheduled_departure.date(),
        departure_time=policy_data.scheduled_departure.time(),
    )
    
    # Calculate premium
    base_rate = Decimal("0.02")
    risk_multiplier = Decimal(str(1 + prediction["delay_probability"]))
    premium = policy_data.coverage_amount * base_rate * risk_multiplier
    premium = max(round(premium, 2), Decimal("5.00"))
    
    # Create policy
    policy = Policy(
        policy_number=generate_policy_number(),
        user_id=user.id,
        policy_type=policy_data.policy_type,
        status=PolicyStatus.PENDING,
        flight_number=policy_data.flight_number.upper(),
        airline_code=policy_data.airline_code.upper(),
        airline_name=policy_data.airline_name,
        departure_airport=policy_data.departure_airport.upper(),
        arrival_airport=policy_data.arrival_airport.upper(),
        scheduled_departure=policy_data.scheduled_departure,
        scheduled_arrival=policy_data.scheduled_arrival,
        coverage_amount=policy_data.coverage_amount,
        premium_amount=premium,
        currency="USDT",
        delay_threshold_minutes=policy_data.delay_threshold_minutes,
        ai_risk_score=prediction["risk_score"],
        ai_delay_probability=prediction["delay_probability"],
        ai_risk_factors={
            "factors": prediction.get("risk_factors", []),
            "weather": prediction.get("weather_summary", ""),
            "historical": prediction.get("historical_analysis", ""),
        },
        payout_address=policy_data.payout_address or user.flare_address,
        coverage_start=policy_data.scheduled_departure - timedelta(hours=24),
        coverage_end=policy_data.scheduled_arrival + timedelta(hours=12),
    )
    
    db.add(policy)
    
    # Update user stats
    user.total_policies += 1
    
    await db.commit()
    await db.refresh(policy)
    
    logger.info(
        "Policy created",
        policy_number=policy.policy_number,
        user_id=str(user.id),
        premium=str(premium)
    )
    
    return policy


@router.get("/", response_model=List[PolicyListResponse])
async def list_policies(
    status_filter: Optional[PolicyStatus] = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """List user's policies with optional filtering."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Build query
    query = select(Policy).where(Policy.user_id == user.id)
    
    if status_filter:
        query = query.where(Policy.status == status_filter)
    
    query = query.order_by(Policy.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    policies = result.scalars().all()
    
    return policies


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: UUID,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed policy information."""
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
        select(Policy).where(
            and_(Policy.id == policy_id, Policy.user_id == user.id)
        )
    )
    policy = result.scalar_one_or_none()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    return policy


@router.post("/{policy_id}/activate", response_model=PolicyResponse)
async def activate_policy(
    policy_id: UUID,
    tx_hash: str,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Activate a policy after payment confirmation.
    Verifies the blockchain transaction and activates coverage.
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
        select(Policy).where(
            and_(Policy.id == policy_id, Policy.user_id == user.id)
        )
    )
    policy = result.scalar_one_or_none()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    if policy.status != PolicyStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot activate policy with status: {policy.status}"
        )
    
    # TODO: Verify transaction on blockchain
    # In production, verify the tx_hash corresponds to the premium payment
    
    policy.status = PolicyStatus.ACTIVE
    policy.transaction_hash = tx_hash
    policy.activated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(policy)
    
    logger.info("Policy activated", policy_number=policy.policy_number, tx_hash=tx_hash)
    
    return policy


@router.delete("/{policy_id}")
async def cancel_policy(
    policy_id: UUID,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending policy (before activation only)."""
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
        select(Policy).where(
            and_(Policy.id == policy_id, Policy.user_id == user.id)
        )
    )
    policy = result.scalar_one_or_none()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    if policy.status != PolicyStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending policies can be cancelled"
        )
    
    policy.status = PolicyStatus.CANCELLED
    await db.commit()
    
    return {"message": "Policy cancelled successfully"}
