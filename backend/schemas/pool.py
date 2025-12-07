"""
AeroShield Pool Schemas
Pydantic models for insurance pool operations
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field

from models.pool import PoolTransactionType
from schemas.base import BaseSchema


class PoolStatsResponse(BaseSchema):
    """Insurance pool statistics."""
    
    total_value_locked: Decimal
    total_premiums_collected: Decimal
    total_payouts_made: Decimal
    stablecoin_reserve: Decimal
    fasset_reserve: Decimal
    collateralization_ratio: Decimal
    total_policies_issued: int
    total_claims_paid: int
    average_payout_time_seconds: Optional[int]
    lp_apy: Optional[Decimal]


class PoolResponse(BaseSchema):
    """Insurance pool response."""
    
    id: UUID
    name: str
    symbol: str
    contract_address: str
    is_active: bool
    stats: PoolStatsResponse
    created_at: datetime
    updated_at: datetime


class PoolTransactionResponse(BaseSchema):
    """Pool transaction response."""
    
    id: UUID
    pool_id: UUID
    transaction_type: PoolTransactionType
    amount: Decimal
    currency: str
    tx_hash: str
    block_number: int
    from_address: str
    to_address: str
    description: Optional[str]
    created_at: datetime


class LPStakeRequest(BaseSchema):
    """Request to stake in the pool as LP."""
    
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USDT")


class LPUnstakeRequest(BaseSchema):
    """Request to unstake from the pool."""
    
    lp_tokens: Decimal = Field(..., gt=0)


class LPPositionResponse(BaseSchema):
    """LP position information."""
    
    user_id: UUID
    pool_id: UUID
    lp_tokens: Decimal
    underlying_value: Decimal
    share_percentage: Decimal
    earned_yield: Decimal
    staked_at: datetime


class PoolHealthResponse(BaseSchema):
    """Pool health metrics."""
    
    is_healthy: bool
    collateralization_ratio: Decimal
    minimum_ratio: Decimal
    available_for_claims: Decimal
    pending_claims_value: Decimal
    utilization_rate: Decimal
    risk_level: str  # low, medium, high
    warnings: list[str]
