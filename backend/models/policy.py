"""
AeroShield Policy Model
Database model for insurance policies
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
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class PolicyStatus(str, Enum):
    """Policy status enumeration."""
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    CLAIMED = "claimed"
    CANCELLED = "cancelled"
    PAYOUT_PENDING = "payout_pending"
    PAID = "paid"


class PolicyType(str, Enum):
    """Type of insurance policy."""
    FLIGHT_DELAY = "flight_delay"
    FLIGHT_CANCEL = "flight_cancel"
    BAGGAGE_DELAY = "baggage_delay"
    COMPREHENSIVE = "comprehensive"


class Policy(Base):
    """Insurance policy model."""
    
    __tablename__ = "policies"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Reference
    policy_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # User Reference
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    # Policy Type and Status
    policy_type: Mapped[PolicyType] = mapped_column(
        SQLEnum(PolicyType),
        default=PolicyType.FLIGHT_DELAY,
    )
    status: Mapped[PolicyStatus] = mapped_column(
        SQLEnum(PolicyStatus),
        default=PolicyStatus.PENDING,
        index=True,
    )
    
    # Flight Information
    flight_number: Mapped[str] = mapped_column(String(10), index=True)
    airline_code: Mapped[str] = mapped_column(String(3))
    airline_name: Mapped[Optional[str]] = mapped_column(String(100))
    departure_airport: Mapped[str] = mapped_column(String(4))
    arrival_airport: Mapped[str] = mapped_column(String(4))
    scheduled_departure: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scheduled_arrival: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    # Coverage Details
    coverage_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=2),
        nullable=False,
    )
    premium_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(String(10), default="USDT")
    
    # Trigger Conditions
    delay_threshold_minutes: Mapped[int] = mapped_column(Integer, default=120)  # 2 hours
    
    # AI Risk Assessment
    ai_risk_score: Mapped[Optional[float]] = mapped_column()
    ai_risk_factors: Mapped[Optional[dict]] = mapped_column(JSONB)
    ai_delay_probability: Mapped[Optional[float]] = mapped_column()
    
    # Blockchain Data
    transaction_hash: Mapped[Optional[str]] = mapped_column(String(66))
    contract_policy_id: Mapped[Optional[int]] = mapped_column(Integer)
    premium_tx_hash: Mapped[Optional[str]] = mapped_column(String(66))
    payout_tx_hash: Mapped[Optional[str]] = mapped_column(String(66))
    
    # FDC Attestation
    fdc_request_id: Mapped[Optional[str]] = mapped_column(String(66))
    fdc_merkle_root: Mapped[Optional[str]] = mapped_column(String(66))
    fdc_proof: Mapped[Optional[dict]] = mapped_column(JSONB)
    fdc_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Actual Flight Data (after verification)
    actual_departure: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    actual_arrival: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    actual_delay_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    flight_status: Mapped[Optional[str]] = mapped_column(String(20))
    
    # Payout Information
    payout_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2),
    )
    payout_address: Mapped[Optional[str]] = mapped_column(String(42))
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Coverage Period
    coverage_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    coverage_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
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
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="policies")
    claims = relationship("Claim", back_populates="policy", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<Policy {self.policy_number} - {self.flight_number}>"
    
    @property
    def is_claimable(self) -> bool:
        """Check if policy can be claimed."""
        return (
            self.status == PolicyStatus.ACTIVE
            and self.actual_delay_minutes is not None
            and self.actual_delay_minutes >= self.delay_threshold_minutes
        )
    
    @property
    def is_expired(self) -> bool:
        """Check if policy has expired."""
        return datetime.now().astimezone() > self.coverage_end
