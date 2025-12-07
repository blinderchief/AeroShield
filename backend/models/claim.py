"""
AeroShield Claim Model
Database model for insurance claims
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class ClaimStatus(str, Enum):
    """Claim status enumeration."""
    INITIATED = "initiated"
    VERIFYING = "verifying"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"


class ClaimType(str, Enum):
    """Type of claim trigger."""
    AUTOMATIC = "automatic"
    MANUAL = "manual"


class Claim(Base):
    """Insurance claim model."""
    
    __tablename__ = "claims"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Reference
    claim_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Foreign Keys
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    policy_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("policies.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    
    # Claim Type and Status
    claim_type: Mapped[ClaimType] = mapped_column(
        SQLEnum(ClaimType),
        default=ClaimType.AUTOMATIC,
    )
    status: Mapped[ClaimStatus] = mapped_column(
        SQLEnum(ClaimStatus),
        default=ClaimStatus.INITIATED,
        index=True,
    )
    
    # Trigger Information
    trigger_event: Mapped[str] = mapped_column(String(50))  # flight_delayed, flight_cancelled
    trigger_value: Mapped[Optional[str]] = mapped_column(String(100))  # e.g., "150 minutes"
    trigger_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    # FDC Verification
    fdc_request_id: Mapped[Optional[str]] = mapped_column(String(66))
    fdc_attestation_type: Mapped[Optional[str]] = mapped_column(String(50))
    fdc_merkle_root: Mapped[Optional[str]] = mapped_column(String(66))
    fdc_proof_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    fdc_verified: Mapped[bool] = mapped_column(default=False)
    fdc_verification_timestamp: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    
    # FTSO Price Data
    ftso_price_usd: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=8),
    )
    ftso_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Payout Information
    payout_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=2),
        nullable=False,
    )
    payout_currency: Mapped[str] = mapped_column(String(10), default="USDT")
    payout_address: Mapped[str] = mapped_column(String(42))
    
    # Blockchain Transaction
    payout_tx_hash: Mapped[Optional[str]] = mapped_column(String(66))
    payout_block_number: Mapped[Optional[int]] = mapped_column()
    payout_gas_used: Mapped[Optional[int]] = mapped_column()
    
    # Processing Details
    processor_notes: Mapped[Optional[str]] = mapped_column(Text)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    
    # Extra Data
    raw_flight_data: Mapped[Optional[dict]] = mapped_column(JSONB)
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
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="claims")
    policy = relationship("Policy", back_populates="claims")
    
    def __repr__(self) -> str:
        return f"<Claim {self.claim_number} - {self.status.value}>"
    
    @property
    def is_successful(self) -> bool:
        """Check if claim was successful."""
        return self.status == ClaimStatus.PAID
    
    @property
    def processing_time_seconds(self) -> Optional[float]:
        """Calculate processing time in seconds."""
        if self.paid_at and self.created_at:
            return (self.paid_at - self.created_at).total_seconds()
        return None
