"""
AeroShield FDC Schemas
Pydantic models for Flare Data Connector operations
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import Field

from models.fdc_event import AttestationType, FDCRequestStatus
from schemas.base import BaseSchema


class FDCAttestationRequest(BaseSchema):
    """Request to create an FDC attestation."""
    
    attestation_type: AttestationType
    source_id: str = Field(..., max_length=50)
    request_body: dict


class FDCFlightStatusRequest(BaseSchema):
    """Request for flight status attestation."""
    
    flight_number: str
    airline_code: str
    flight_date: datetime
    api_url: str
    expected_fields: list[str] = ["status", "delay_minutes", "actual_departure"]


class FDCPaymentRequest(BaseSchema):
    """Request for payment attestation (XRP, BTC, DOGE)."""
    
    chain: str = Field(..., pattern="^(XRP|BTC|DOGE)$")
    transaction_id: str
    expected_amount: Optional[str] = None
    expected_destination: Optional[str] = None


class FDCSubmitResponse(BaseSchema):
    """Response after submitting FDC request."""
    
    request_id: str
    attestation_type: AttestationType
    status: FDCRequestStatus
    submitted_at: datetime
    voting_round: Optional[int]
    estimated_finalization: datetime


class FDCProofData(BaseSchema):
    """FDC Merkle proof data."""
    
    merkle_root: str
    merkle_proof: list[str]
    leaf_index: int
    response_body: dict


class FDCVerificationResult(BaseSchema):
    """Result of FDC proof verification."""
    
    request_id: str
    is_valid: bool
    verified_at: datetime
    proof_data: Optional[FDCProofData]
    verification_tx_hash: Optional[str]
    error_message: Optional[str]


class FDCEventResponse(BaseSchema):
    """FDC event response."""
    
    id: UUID
    request_id: str
    attestation_type: AttestationType
    status: FDCRequestStatus
    source_id: str
    submission_tx_hash: Optional[str]
    voting_round: Optional[int]
    merkle_root: Optional[str]
    response_body: Optional[dict]
    is_verified: bool
    error_message: Optional[str]
    created_at: datetime
    finalized_at: Optional[datetime]
    verified_at: Optional[datetime]


class FDCStatusResponse(BaseSchema):
    """Current status of an FDC request."""
    
    request_id: str
    status: FDCRequestStatus
    progress_percentage: int
    current_step: str
    steps: list[dict[str, Any]]
    estimated_completion: Optional[datetime]
