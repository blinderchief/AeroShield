"""
AeroShield FDC Event Model
Database model for Flare Data Connector events
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class AttestationType(str, Enum):
    """FDC Attestation types."""
    ADDRESS_VALIDITY = "AddressValidity"
    EVM_TRANSACTION = "EVMTransaction"
    PAYMENT = "Payment"
    BALANCE_DECREASING = "BalanceDecreasingTransaction"
    CONFIRMED_BLOCK_HEIGHT = "ConfirmedBlockHeightExists"
    REFERENCED_PAYMENT = "ReferencedPaymentNonexistence"
    WEB2_JSON = "Web2Json"


class FDCRequestStatus(str, Enum):
    """Status of FDC request."""
    PENDING = "pending"
    SUBMITTED = "submitted"
    VOTING = "voting"
    FINALIZED = "finalized"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"


class FDCEvent(Base):
    """FDC attestation event model."""
    
    __tablename__ = "fdc_events"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Request Identification
    request_id: Mapped[str] = mapped_column(
        String(66),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Attestation Type
    attestation_type: Mapped[AttestationType] = mapped_column(
        SQLEnum(AttestationType),
        nullable=False,
    )
    
    # Request Status
    status: Mapped[FDCRequestStatus] = mapped_column(
        SQLEnum(FDCRequestStatus),
        default=FDCRequestStatus.PENDING,
        index=True,
    )
    
    # Request Data
    source_id: Mapped[str] = mapped_column(String(50))  # e.g., "XRP", "ETH", "API"
    request_body: Mapped[dict] = mapped_column(JSONB, nullable=False)
    encoded_request: Mapped[Optional[str]] = mapped_column(Text)
    
    # Submission Details
    submission_tx_hash: Mapped[Optional[str]] = mapped_column(String(66))
    submission_block: Mapped[Optional[int]] = mapped_column(Integer)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Voting Round
    voting_round: Mapped[Optional[int]] = mapped_column(Integer)
    voting_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    voting_ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Finalization
    merkle_root: Mapped[Optional[str]] = mapped_column(String(66))
    merkle_proof: Mapped[Optional[list]] = mapped_column(JSONB)
    response_body: Mapped[Optional[dict]] = mapped_column(JSONB)
    finalized_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Verification
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_tx_hash: Mapped[Optional[str]] = mapped_column(String(66))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Error Handling
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Related Entity
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(50))  # policy, claim
    related_entity_id: Mapped[Optional[UUID]] = mapped_column(PGUUID(as_uuid=True))
    
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
        return f"<FDCEvent {self.request_id} - {self.attestation_type.value}>"
    
    @property
    def is_complete(self) -> bool:
        """Check if FDC request is complete."""
        return self.status in [
            FDCRequestStatus.VERIFIED,
            FDCRequestStatus.FAILED,
            FDCRequestStatus.EXPIRED,
        ]
    
    @property
    def processing_time_seconds(self) -> Optional[float]:
        """Calculate total processing time."""
        if self.verified_at and self.submitted_at:
            return (self.verified_at - self.submitted_at).total_seconds()
        return None
