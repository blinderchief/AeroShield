"""
AeroShield AI Prediction Schemas
Pydantic models for AI-related operations
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import Field

from models.ai_prediction import PredictionType, RiskTier
from schemas.base import BaseSchema


class DelayPredictionRequest(BaseSchema):
    """Request for flight delay prediction."""
    
    flight_number: str = Field(..., min_length=3, max_length=10, examples=["6E542"])
    airline_code: str = Field(..., min_length=2, max_length=3, examples=["6E"])
    departure_airport: str = Field(..., min_length=3, max_length=4, examples=["DEL"])
    arrival_airport: str = Field(..., min_length=3, max_length=4, examples=["BOM"])
    flight_date: datetime
    include_weather: bool = True
    include_historical: bool = True


class RiskFactor(BaseSchema):
    """Individual risk factor."""
    
    name: str
    score: float = Field(..., ge=0, le=1)
    weight: float = Field(..., ge=0, le=1)
    details: str
    impact: str  # positive, negative, neutral


class DelayPredictionResponse(BaseSchema):
    """Response with delay prediction."""
    
    flight_number: str
    flight_date: datetime
    delay_probability: float = Field(..., ge=0, le=1)
    risk_tier: RiskTier
    risk_score: float = Field(..., ge=0, le=100)
    risk_factors: list[RiskFactor]
    suggested_premium: Decimal
    confidence_score: float = Field(..., ge=0, le=1)
    prediction_valid_until: datetime
    
    # Additional insights
    weather_summary: Optional[str] = None
    historical_delay_rate: Optional[float] = None
    average_delay_minutes: Optional[int] = None


class PremiumCalculationRequest(BaseSchema):
    """Request for premium calculation."""
    
    flight_number: str
    airline_code: str
    departure_airport: str
    arrival_airport: str
    flight_date: datetime
    coverage_amount: Decimal = Field(..., gt=0)
    delay_threshold_minutes: int = Field(default=120, ge=30, le=360)


class PremiumCalculationResponse(BaseSchema):
    """Response with calculated premium."""
    
    base_premium: Decimal
    risk_multiplier: float
    final_premium: Decimal
    coverage_amount: Decimal
    delay_threshold_minutes: int
    risk_tier: RiskTier
    breakdown: dict  # Detailed breakdown of premium calculation


class AnomalyDetectionRequest(BaseSchema):
    """Request for anomaly detection in flight data."""
    
    airline_code: str
    airport_code: Optional[str] = None
    time_window_hours: int = Field(default=24, ge=1, le=168)


class AnomalyAlert(BaseSchema):
    """Anomaly detection alert."""
    
    alert_type: str  # mass_delay, system_outage, weather_event
    severity: str  # low, medium, high, critical
    affected_flights: int
    affected_airports: list[str]
    description: str
    detected_at: datetime
    recommendations: list[str]


class AnomalyDetectionResponse(BaseSchema):
    """Response with anomaly detection results."""
    
    anomalies_detected: bool
    alerts: list[AnomalyAlert]
    analysis_timestamp: datetime
    data_points_analyzed: int


class AIInsight(BaseSchema):
    """AI-generated insight for dashboard."""
    
    insight_type: str  # delay_risk, weather_alert, route_tip
    title: str
    description: str
    icon: str
    color: str  # for UI styling
    action_url: Optional[str] = None


class AIPredictionRecord(BaseSchema):
    """Stored AI prediction record."""
    
    id: UUID
    prediction_type: PredictionType
    flight_number: str
    flight_date: datetime
    delay_probability: Optional[Decimal]
    risk_tier: Optional[RiskTier]
    risk_score: Optional[Decimal]
    suggested_premium: Optional[Decimal]
    confidence_score: Optional[Decimal]
    created_at: datetime
