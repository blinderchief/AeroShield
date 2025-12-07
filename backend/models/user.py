"""
AeroShield User Model
Database model for users
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base


class User(Base):
    """User model - synced with Clerk authentication."""
    
    __tablename__ = "users"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Clerk Integration
    clerk_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # User Information
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    first_name: Mapped[Optional[str]] = mapped_column(String(100))
    last_name: Mapped[Optional[str]] = mapped_column(String(100))
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    
    # Wallet Addresses
    flare_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        index=True,
    )
    xrpl_address: Mapped[Optional[str]] = mapped_column(
        String(35),
        index=True,
    )
    smart_account_address: Mapped[Optional[str]] = mapped_column(
        String(42),
        index=True,
    )
    
    # User Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # KYC Information
    kyc_status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
    )  # pending, approved, rejected
    kyc_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Risk Profile
    risk_score: Mapped[Optional[float]] = mapped_column(default=50.0)
    
    # Statistics
    total_policies: Mapped[int] = mapped_column(default=0)
    total_claims: Mapped[int] = mapped_column(default=0)
    total_payouts_received: Mapped[float] = mapped_column(default=0.0)
    
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
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Relationships
    policies = relationship("Policy", back_populates="user", lazy="dynamic")
    claims = relationship("Claim", back_populates="user", lazy="dynamic")
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        parts = [self.first_name, self.last_name]
        return " ".join(p for p in parts if p) or self.email
    
    @property
    def has_wallet(self) -> bool:
        """Check if user has connected a wallet."""
        return bool(self.flare_address or self.xrpl_address)
