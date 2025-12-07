"""
AeroShield Policy Schemas
Pydantic models for policy-related operations
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field, field_validator

from models.policy import PolicyStatus, PolicyType
from schemas.base import BaseSchema, TimestampMixin


class FlightInfo(BaseSchema):
    """Flight information schema."""
    
    flight_number: str = Field(..., min_length=3, max_length=10, examples=["6E542"])
    airline_code: str = Field(..., min_length=2, max_length=3, examples=["6E"])
    airline_name: Optional[str] = Field(None, examples=["IndiGo"])
    departure_airport: str = Field(..., min_length=3, max_length=4, examples=["DEL"])
    arrival_airport: str = Field(..., min_length=3, max_length=4, examples=["BOM"])
    scheduled_departure: datetime
    scheduled_arrival: datetime
    
    @field_validator("flight_number")
    @classmethod
    def validate_flight_number(cls, v: str) -> str:
        return v.upper().strip()
    
    @field_validator("departure_airport", "arrival_airport")
    @classmethod
    def validate_airport(cls, v: str) -> str:
        return v.upper().strip()


class PolicyCreate(BaseSchema):
    """Schema for creating a policy."""
    
    policy_type: PolicyType = PolicyType.FLIGHT_DELAY
    flight_number: str = Field(..., min_length=3, max_length=10)
    airline_code: str = Field(..., min_length=2, max_length=3)
    airline_name: Optional[str] = None
    departure_airport: str = Field(..., min_length=3, max_length=4)
    arrival_airport: str = Field(..., min_length=3, max_length=4)
    scheduled_departure: datetime
    scheduled_arrival: datetime
    coverage_amount: Decimal = Field(..., gt=0, le=10000)
    delay_threshold_minutes: int = Field(default=120, ge=30, le=360)
    payout_address: Optional[str] = Field(None, max_length=42)
    
    @field_validator("coverage_amount")
    @classmethod
    def validate_coverage(cls, v: Decimal) -> Decimal:
        return round(v, 2)


class PolicyQuoteRequest(BaseSchema):
    """Request for policy quote/pricing."""
    
    flight_number: str
    airline_code: str
    departure_airport: str
    arrival_airport: str
    scheduled_departure: datetime
    coverage_amount: Decimal = Field(..., gt=0, le=10000)
    delay_threshold_minutes: int = Field(default=120, ge=30, le=360)


class PolicyQuoteResponse(BaseSchema):
    """Response with policy quote/pricing."""
    
    premium_amount: Decimal
    coverage_amount: Decimal
    currency: str = "USDT"
    delay_threshold_minutes: int
    ai_risk_score: float
    ai_delay_probability: float
    risk_factors: dict
    suggested_premium: Decimal
    valid_until: datetime


class PolicyResponse(BaseSchema, TimestampMixin):
    """Schema for policy response."""
    
    id: UUID
    policy_number: str
    user_id: UUID
    policy_type: PolicyType
    status: PolicyStatus
    
    # Flight Information
    flight_number: str
    airline_code: str
    airline_name: Optional[str]
    departure_airport: str
    arrival_airport: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    
    # Coverage
    coverage_amount: Decimal
    premium_amount: Decimal
    currency: str
    delay_threshold_minutes: int
    
    # AI Assessment
    ai_risk_score: Optional[float]
    ai_delay_probability: Optional[float]
    ai_risk_factors: Optional[dict]
    
    # Blockchain
    transaction_hash: Optional[str]
    contract_policy_id: Optional[int]
    
    # Actual Data
    actual_departure: Optional[datetime]
    actual_arrival: Optional[datetime]
    actual_delay_minutes: Optional[int]
    flight_status: Optional[str]
    
    # Payout
    payout_amount: Optional[Decimal]
    payout_tx_hash: Optional[str]
    paid_at: Optional[datetime]
    
    # Coverage Period
    coverage_start: datetime
    coverage_end: datetime
    activated_at: Optional[datetime]


class PolicyListResponse(BaseSchema):
    """Simplified policy for list views."""
    
    id: UUID
    policy_number: str
    status: PolicyStatus
    flight_number: str
    departure_airport: str
    arrival_airport: str
    scheduled_departure: datetime
    coverage_amount: Decimal
    premium_amount: Decimal
    ai_risk_score: Optional[float]
    created_at: datetime


class PolicyStatusUpdate(BaseSchema):
    """Schema for updating policy status."""
    
    status: PolicyStatus
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    actual_delay_minutes: Optional[int] = None
    flight_status: Optional[str] = None


class PolicyClaimRequest(BaseSchema):
    """Request to initiate a claim on a policy."""
    
    policy_id: UUID
    payout_address: Optional[str] = Field(None, max_length=42)
