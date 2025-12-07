"""
AeroShield Claim Schemas
Pydantic models for claim-related operations
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field

from models.claim import ClaimStatus, ClaimType
from schemas.base import BaseSchema, TimestampMixin


class ClaimCreate(BaseSchema):
    """Schema for creating a claim."""
    
    policy_id: UUID
    trigger_event: str = Field(..., max_length=50)
    trigger_value: Optional[str] = Field(None, max_length=100)
    payout_address: str = Field(..., max_length=42)


class ClaimResponse(BaseSchema, TimestampMixin):
    """Schema for claim response."""
    
    id: UUID
    claim_number: str
    user_id: UUID
    policy_id: UUID
    claim_type: ClaimType
    status: ClaimStatus
    
    # Trigger
    trigger_event: str
    trigger_value: Optional[str]
    trigger_timestamp: datetime
    
    # FDC
    fdc_request_id: Optional[str]
    fdc_verified: bool
    fdc_verification_timestamp: Optional[datetime]
    
    # FTSO
    ftso_price_usd: Optional[Decimal]
    ftso_timestamp: Optional[datetime]
    
    # Payout
    payout_amount: Decimal
    payout_currency: str
    payout_address: str
    payout_tx_hash: Optional[str]
    
    # Processing
    rejection_reason: Optional[str]
    
    # Timestamps
    verified_at: Optional[datetime]
    approved_at: Optional[datetime]
    paid_at: Optional[datetime]


class ClaimListResponse(BaseSchema):
    """Simplified claim for list views."""
    
    id: UUID
    claim_number: str
    policy_id: UUID
    status: ClaimStatus
    trigger_event: str
    payout_amount: Decimal
    created_at: datetime
    paid_at: Optional[datetime]


class ClaimStatusUpdate(BaseSchema):
    """Schema for updating claim status."""
    
    status: ClaimStatus
    processor_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class ClaimVerificationResult(BaseSchema):
    """Result of FDC verification for a claim."""
    
    is_verified: bool
    fdc_request_id: str
    merkle_root: Optional[str]
    verification_timestamp: datetime
    flight_data: Optional[dict]
    error_message: Optional[str]
