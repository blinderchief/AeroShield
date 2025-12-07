"""
AeroShield Pool API
Insurance pool management and statistics
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.logging import get_logger
from core.security import ClerkTokenPayload, verify_clerk_token
from models.pool import InsurancePool
from services.blockchain.ftso_client import ftso_client
from services.insurance.pool_manager import pool_manager

logger = get_logger(__name__)
router = APIRouter()


class PoolStatsResponse(BaseModel):
    """Pool statistics response."""
    pool_id: str
    name: str
    symbol: str
    total_value_locked: float
    total_premiums_collected: float
    total_payouts_made: float
    stablecoin_reserve: float
    fasset_reserve: float
    collateralization_ratio: float
    total_policies_issued: int
    total_claims_paid: int
    average_payout_time_seconds: Optional[int]
    lp_apy: Optional[float]
    utilization_rate: float
    available_for_claims: float
    is_active: bool


class DepositRequest(BaseModel):
    """Request to deposit into liquidity pool."""
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USDT")
    tx_hash: str


class WithdrawRequest(BaseModel):
    """Request to withdraw from liquidity pool."""
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USDT")


class LPPositionResponse(BaseModel):
    """LP position response."""
    pool_id: str
    deposited_amount: float
    current_value: float
    earned_fees: float
    share_percentage: float
    deposit_timestamp: str


@router.get("/stats", response_model=PoolStatsResponse)
async def get_pool_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get current pool statistics."""
    # Get the main pool
    result = await db.execute(
        select(InsurancePool).where(InsurancePool.is_active == True)
    )
    pool = result.scalar_one_or_none()
    
    if not pool:
        raise HTTPException(
            status_code=404,
            detail="No active pool found"
        )
    
    stats = await pool_manager.get_pool_stats(db, pool.id)
    return PoolStatsResponse(**stats)


@router.get("/health")
async def get_pool_health(
    db: AsyncSession = Depends(get_db),
):
    """Get pool health metrics and risk indicators."""
    result = await db.execute(
        select(InsurancePool).where(InsurancePool.is_active == True)
    )
    pool = result.scalar_one_or_none()
    
    if not pool:
        raise HTTPException(status_code=404, detail="No active pool found")
    
    # Calculate health metrics
    tvl = float(pool.total_value_locked)
    pending_liabilities = float(pool.total_premiums_collected - pool.total_payouts_made)
    
    health_score = 100.0
    risk_level = "low"
    
    if tvl > 0:
        utilization = pending_liabilities / tvl
        if utilization > 0.8:
            health_score = 50.0
            risk_level = "high"
        elif utilization > 0.5:
            health_score = 75.0
            risk_level = "medium"
    
    # Get current FLR price for collateral valuation
    try:
        flr_price = await ftso_client.get_price("FLR/USD")
        flr_usd = float(flr_price["price"])
    except:
        flr_usd = 0.02  # Fallback
    
    return {
        "pool_id": str(pool.id),
        "health_score": health_score,
        "risk_level": risk_level,
        "collateralization_ratio": float(pool.collateralization_ratio),
        "min_collateralization_required": 150.0,
        "tvl_usd": tvl,
        "flr_price_usd": flr_usd,
        "stablecoin_reserve_pct": (float(pool.stablecoin_reserve) / tvl * 100) if tvl > 0 else 0,
        "fasset_reserve_pct": (float(pool.fasset_reserve) / tvl * 100) if tvl > 0 else 0,
        "recommendations": _get_pool_recommendations(health_score, float(pool.collateralization_ratio)),
    }


@router.post("/deposit")
async def deposit_to_pool(
    request: DepositRequest,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Deposit funds into the liquidity pool.
    Earn yield from insurance premiums.
    """
    # Verify transaction on blockchain
    # In production, this would verify the actual deposit transaction
    
    result = await db.execute(
        select(InsurancePool).where(InsurancePool.is_active == True)
    )
    pool = result.scalar_one_or_none()
    
    if not pool:
        raise HTTPException(status_code=404, detail="No active pool found")
    
    # Record deposit
    # In production, this would create LP tokens and track position
    
    return {
        "status": "success",
        "pool_id": str(pool.id),
        "deposited_amount": float(request.amount),
        "currency": request.currency,
        "tx_hash": request.tx_hash,
        "lp_tokens_received": float(request.amount),  # 1:1 for simplicity
        "current_apy": float(pool.lp_apy) if pool.lp_apy else 5.0,
    }


@router.post("/withdraw")
async def withdraw_from_pool(
    request: WithdrawRequest,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Withdraw funds from the liquidity pool.
    Burns LP tokens and returns underlying assets.
    """
    result = await db.execute(
        select(InsurancePool).where(InsurancePool.is_active == True)
    )
    pool = result.scalar_one_or_none()
    
    if not pool:
        raise HTTPException(status_code=404, detail="No active pool found")
    
    # Check available liquidity
    available = pool.total_value_locked - pool.total_payouts_made
    if request.amount > available:
        raise HTTPException(
            status_code=400,
            detail="Insufficient liquidity for withdrawal"
        )
    
    # Process withdrawal
    # In production, this would burn LP tokens and transfer assets
    
    return {
        "status": "pending",
        "pool_id": str(pool.id),
        "withdraw_amount": float(request.amount),
        "currency": request.currency,
        "estimated_completion": "2-3 minutes",
    }


@router.get("/my-position", response_model=LPPositionResponse)
async def get_my_lp_position(
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's LP position in the pool."""
    # In production, this would query the user's LP token balance
    # and calculate their share of the pool
    
    return LPPositionResponse(
        pool_id="main-pool",
        deposited_amount=0.0,
        current_value=0.0,
        earned_fees=0.0,
        share_percentage=0.0,
        deposit_timestamp="",
    )


@router.get("/transactions")
async def get_pool_transactions(
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    tx_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get recent pool transactions."""
    # This would query the PoolTransaction table
    return {
        "transactions": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


def _get_pool_recommendations(health_score: float, collateralization: float) -> list[str]:
    """Generate recommendations based on pool health."""
    recommendations = []
    
    if health_score < 75:
        recommendations.append("Consider reducing coverage limits until TVL increases")
    
    if collateralization < 150:
        recommendations.append("Pool collateralization is below recommended 150%")
        recommendations.append("Additional FAsset deposits recommended")
    
    if not recommendations:
        recommendations.append("Pool is operating within healthy parameters")
    
    return recommendations
