"""
AeroShield Insurance Pool Model
Database model for the insurance liquidity pool
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class PoolTransactionType(str, Enum):
    """Type of pool transaction."""
    PREMIUM_DEPOSIT = "premium_deposit"
    PAYOUT = "payout"
    LP_STAKE = "lp_stake"
    LP_UNSTAKE = "lp_unstake"
    YIELD_DISTRIBUTION = "yield_distribution"
    COLLATERAL_ADJUSTMENT = "collateral_adjustment"
    FEE_COLLECTION = "fee_collection"


class InsurancePool(Base):
    """Insurance liquidity pool model."""
    
    __tablename__ = "insurance_pools"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Pool Identification
    name: Mapped[str] = mapped_column(String(100), unique=True)
    symbol: Mapped[str] = mapped_column(String(10), unique=True)
    
    # Contract Address
    contract_address: Mapped[str] = mapped_column(
        String(42),
        unique=True,
        index=True,
    )
    
    # Pool Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Financial Metrics
    total_value_locked: Mapped[Decimal] = mapped_column(
        Numeric(precision=36, scale=18),
        default=Decimal("0"),
    )
    total_premiums_collected: Mapped[Decimal] = mapped_column(
        Numeric(precision=36, scale=18),
        default=Decimal("0"),
    )
    total_payouts_made: Mapped[Decimal] = mapped_column(
        Numeric(precision=36, scale=18),
        default=Decimal("0"),
    )
    
    # Collateralization
    stablecoin_reserve: Mapped[Decimal] = mapped_column(
        Numeric(precision=36, scale=18),
        default=Decimal("0"),
    )  # USDT0
    fasset_reserve: Mapped[Decimal] = mapped_column(
        Numeric(precision=36, scale=18),
        default=Decimal("0"),
    )  # FXRP, etc.
    collateralization_ratio: Mapped[Decimal] = mapped_column(
        Numeric(precision=8, scale=4),
        default=Decimal("150.0000"),
    )  # 150%
    
    # Statistics
    total_policies_issued: Mapped[int] = mapped_column(default=0)
    total_claims_paid: Mapped[int] = mapped_column(default=0)
    average_payout_time_seconds: Mapped[Optional[int]] = mapped_column()
    
    # LP Information
    total_lp_tokens: Mapped[Decimal] = mapped_column(
        Numeric(precision=36, scale=18),
        default=Decimal("0"),
    )
    lp_apy: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=8, scale=4),
    )
    
    # Extra Data
    extra_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    
    def __repr__(self) -> str:
        return f"<InsurancePool {self.symbol}>"


class PoolTransaction(Base):
    """Pool transaction history model."""
    
    __tablename__ = "pool_transactions"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Pool Reference
    pool_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("insurance_pools.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    # Transaction Type
    transaction_type: Mapped[PoolTransactionType] = mapped_column(
        SQLEnum(PoolTransactionType),
        nullable=False,
    )
    
    # Amount
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=36, scale=18),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(String(10), default="USDT")
    
    # Blockchain Data
    tx_hash: Mapped[str] = mapped_column(
        String(66),
        unique=True,
        index=True,
    )
    block_number: Mapped[int] = mapped_column()
    from_address: Mapped[str] = mapped_column(String(42))
    to_address: Mapped[str] = mapped_column(String(42))
    
    # Related Entities
    user_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    policy_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("policies.id", ondelete="SET NULL"),
    )
    claim_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("claims.id", ondelete="SET NULL"),
    )
    
    # Notes
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    
    def __repr__(self) -> str:
        return f"<PoolTransaction {self.transaction_type.value} - {self.amount}>"
