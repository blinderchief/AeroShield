"""
AeroShield AI Prediction Model
Database model for AI risk assessments and predictions
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
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class PredictionType(str, Enum):
    """Type of AI prediction."""
    DELAY_PROBABILITY = "delay_probability"
    RISK_ASSESSMENT = "risk_assessment"
    PREMIUM_PRICING = "premium_pricing"
    ANOMALY_DETECTION = "anomaly_detection"


class RiskTier(str, Enum):
    """Risk tier classification."""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class AIPrediction(Base):
    """AI prediction and risk assessment model."""
    
    __tablename__ = "ai_predictions"
    
    # Primary Key
    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    
    # Prediction Type
    prediction_type: Mapped[PredictionType] = mapped_column(
        SQLEnum(PredictionType),
        nullable=False,
    )
    
    # Related Policy (optional)
    policy_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("policies.id", ondelete="SET NULL"),
        index=True,
    )
    
    # Flight Information
    flight_number: Mapped[str] = mapped_column(String(10), index=True)
    airline_code: Mapped[str] = mapped_column(String(3))
    departure_airport: Mapped[str] = mapped_column(String(4))
    arrival_airport: Mapped[str] = mapped_column(String(4))
    flight_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    
    # Prediction Results
    delay_probability: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=4),
    )  # 0.0000 to 1.0000
    
    risk_tier: Mapped[Optional[RiskTier]] = mapped_column(SQLEnum(RiskTier))
    risk_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=2),
    )  # 0.00 to 100.00
    
    # Suggested Pricing
    suggested_premium: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2),
    )
    base_premium: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2),
    )
    risk_multiplier: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=2),
    )
    
    # Risk Factors
    risk_factors: Mapped[Optional[dict]] = mapped_column(JSONB)
    """
    Example:
    {
        "weather": {"score": 0.3, "details": "Thunderstorms expected"},
        "historical": {"score": 0.2, "details": "Route has 15% delay rate"},
        "congestion": {"score": 0.4, "details": "High ATC traffic"},
        "aircraft": {"score": 0.1, "details": "Aircraft turnaround risk"}
    }
    """
    
    # Model Information
    model_name: Mapped[str] = mapped_column(String(50), default="gemini-1.5-flash")
    model_version: Mapped[str] = mapped_column(String(20), default="1.0")
    prompt_template: Mapped[Optional[str]] = mapped_column(Text)
    
    # Input Data
    input_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    """
    Example:
    {
        "flight": {"number": "6E542", "date": "2025-12-10"},
        "weather": {"origin": {...}, "destination": {...}},
        "historical": {"delay_rate": 0.15, "avg_delay_minutes": 25}
    }
    """
    
    # Raw AI Response
    raw_response: Mapped[Optional[dict]] = mapped_column(JSONB)
    confidence_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=4),
    )
    
    # Processing Metrics
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer)
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    
    # Caching
    cache_key: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    cache_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    # Actual Outcome (for model training)
    actual_delay_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    prediction_accuracy: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=5, scale=4),
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    
    def __repr__(self) -> str:
        return f"<AIPrediction {self.flight_number} - {self.prediction_type.value}>"
    
    @property
    def is_high_risk(self) -> bool:
        """Check if prediction indicates high risk."""
        return self.risk_tier in [RiskTier.HIGH, RiskTier.VERY_HIGH]
    
    @property
    def delay_percentage(self) -> Optional[float]:
        """Get delay probability as percentage."""
        if self.delay_probability:
            return float(self.delay_probability) * 100
        return None
