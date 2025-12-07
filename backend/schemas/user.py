"""
AeroShield User Schemas
Pydantic models for user-related operations
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from schemas.base import BaseSchema, TimestampMixin


class UserBase(BaseSchema):
    """Base user schema."""
    
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class UserCreate(UserBase):
    """Schema for creating a user."""
    
    clerk_id: str = Field(..., max_length=255)
    avatar_url: Optional[str] = None


class UserUpdate(BaseSchema):
    """Schema for updating a user."""
    
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None


class UserWalletUpdate(BaseSchema):
    """Schema for updating user wallet addresses."""
    
    flare_address: Optional[str] = Field(None, max_length=42)
    xrpl_address: Optional[str] = Field(None, max_length=35)
    smart_account_address: Optional[str] = Field(None, max_length=42)
    
    @field_validator("flare_address")
    @classmethod
    def validate_flare_address(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith("0x"):
            raise ValueError("Flare address must start with 0x")
        if v and len(v) != 42:
            raise ValueError("Invalid Flare address length")
        return v
    
    @field_validator("xrpl_address")
    @classmethod
    def validate_xrpl_address(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith("r"):
            raise ValueError("XRPL address must start with r")
        return v


class UserResponse(UserBase, TimestampMixin):
    """Schema for user response."""
    
    id: UUID
    clerk_id: str
    avatar_url: Optional[str]
    flare_address: Optional[str]
    xrpl_address: Optional[str]
    smart_account_address: Optional[str]
    is_active: bool
    is_verified: bool
    is_premium: bool
    kyc_status: str
    risk_score: Optional[float]
    total_policies: int
    total_claims: int
    total_payouts_received: float
    last_login_at: Optional[datetime]


class UserPublicResponse(BaseSchema):
    """Public user information (limited fields)."""
    
    id: UUID
    first_name: Optional[str]
    avatar_url: Optional[str]
    is_verified: bool


class UserStats(BaseSchema):
    """User statistics."""
    
    total_policies: int
    active_policies: int
    total_claims: int
    successful_claims: int
    total_premiums_paid: float
    total_payouts_received: float
    average_claim_time_seconds: Optional[float]
    risk_score: float
