"""
AeroShield AI API
AI-powered predictions and insights
"""

from datetime import date, datetime, time, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from core.logging import get_logger
from core.security import ClerkTokenPayload, verify_clerk_token
from services.ai.gemini_agent import gemini_agent
from services.ai.risk_scoring import risk_scoring_service

logger = get_logger(__name__)
router = APIRouter()


class DelayPredictionRequest(BaseModel):
    """Request for flight delay prediction."""
    airline_code: str = Field(..., min_length=2, max_length=3, examples=["6E"])
    flight_number: str = Field(..., min_length=1, max_length=10, examples=["542"])
    departure_airport: str = Field(..., min_length=3, max_length=4, examples=["DEL"])
    arrival_airport: str = Field(..., min_length=3, max_length=4, examples=["BOM"])
    flight_date: date
    departure_time: Optional[time] = None
    additional_context: Optional[str] = None


class RiskFactor(BaseModel):
    """Individual risk factor."""
    name: str
    score: float
    weight: float
    details: str
    impact: str


class DelayPredictionResponse(BaseModel):
    """Response with delay prediction."""
    delay_probability: float
    risk_tier: str
    risk_score: float
    estimated_delay_minutes: Optional[int]
    risk_factors: List[RiskFactor]
    weather_summary: str
    historical_analysis: str
    confidence_score: float
    recommendations: List[str]
    suggested_premium: float


class RiskAssessmentRequest(BaseModel):
    """Request for comprehensive risk assessment."""
    route: str = Field(..., examples=["DEL-BOM"])
    airline: str = Field(..., examples=["6E"])
    date_range_start: date
    date_range_end: date


class AnomalyDetectionRequest(BaseModel):
    """Request for flight anomaly detection."""
    flight_number: str
    airline_code: str
    actual_departure: datetime
    scheduled_departure: datetime
    actual_arrival: Optional[datetime]
    scheduled_arrival: datetime


@router.post("/predict-delay", response_model=DelayPredictionResponse)
async def predict_delay(
    request: DelayPredictionRequest,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """
    Predict flight delay probability using Gemini AI.
    
    This endpoint analyzes:
    - Historical delay patterns
    - Weather conditions
    - Airport congestion
    - Airline performance
    - Time of day/week patterns
    """
    try:
        prediction = await gemini_agent.predict_flight_delay(
            flight_number=request.flight_number,
            airline_code=request.airline_code,
            departure_airport=request.departure_airport,
            arrival_airport=request.arrival_airport,
            flight_date=request.flight_date,
            departure_time=request.departure_time or time(12, 0),
            context=request.additional_context,
        )
        
        # Calculate suggested premium
        base_premium = 50.0  # Base ₹50
        risk_multiplier = 1 + prediction.delay_probability
        suggested_premium = round(base_premium * risk_multiplier, 2)
        
        return DelayPredictionResponse(
            delay_probability=prediction.delay_probability,
            risk_tier=prediction.risk_tier.value,
            risk_score=prediction.risk_score,
            estimated_delay_minutes=prediction.estimated_delay_minutes,
            risk_factors=[
                RiskFactor(
                    name=f.name,
                    score=f.score,
                    weight=f.weight,
                    details=f.details,
                    impact=f.impact,
                )
                for f in prediction.risk_factors
            ],
            weather_summary=prediction.weather_summary,
            historical_analysis=prediction.historical_analysis,
            confidence_score=prediction.confidence_score,
            recommendations=prediction.recommendations,
            suggested_premium=suggested_premium,
        )
        
    except Exception as e:
        logger.error("Delay prediction failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"AI prediction failed: {str(e)}"
        )


@router.post("/risk-assessment")
async def assess_route_risk(
    request: RiskAssessmentRequest,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """
    Get comprehensive risk assessment for a route.
    Analyzes historical data and provides insights.
    """
    try:
        airports = request.route.split("-")
        if len(airports) != 2:
            raise HTTPException(
                status_code=400,
                detail="Invalid route format. Use: ORIGIN-DESTINATION (e.g., DEL-BOM)"
            )
        
        assessment = await risk_scoring_service.assess_route_risk(
            origin=airports[0],
            destination=airports[1],
            airline=request.airline,
            start_date=request.date_range_start,
            end_date=request.date_range_end,
        )
        
        return assessment
        
    except Exception as e:
        logger.error("Risk assessment failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Risk assessment failed: {str(e)}"
        )


@router.post("/detect-anomaly")
async def detect_anomaly(
    request: AnomalyDetectionRequest,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """
    Detect anomalies in flight data.
    Useful for fraud detection and claim validation.
    """
    try:
        result = await gemini_agent.detect_flight_anomaly(
            flight_number=request.flight_number,
            airline_code=request.airline_code,
            actual_departure=request.actual_departure,
            scheduled_departure=request.scheduled_departure,
            actual_arrival=request.actual_arrival,
            scheduled_arrival=request.scheduled_arrival,
        )
        
        return result
        
    except Exception as e:
        logger.error("Anomaly detection failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Anomaly detection failed: {str(e)}"
        )


@router.get("/insights/{flight_number}")
async def get_flight_insights(
    flight_number: str,
    airline_code: str = Query(...),
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """
    Get AI-generated insights for a specific flight.
    Includes historical patterns, common delay causes, and tips.
    """
    try:
        insights = await gemini_agent.generate_flight_insights(
            flight_number=flight_number,
            airline_code=airline_code,
        )
        
        return {
            "flight": f"{airline_code}{flight_number}",
            "insights": insights,
            "generated_at": datetime.now(timezone.utc),
        }
        
    except Exception as e:
        logger.error("Failed to generate insights", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insights: {str(e)}"
        )


@router.get("/weather-impact")
async def get_weather_impact(
    airport: str = Query(..., min_length=3, max_length=4),
    date: date = Query(...),
    token: ClerkTokenPayload = Depends(verify_clerk_token),
):
    """
    Get AI analysis of weather impact on flights.
    """
    try:
        impact = await gemini_agent.analyze_weather_impact(
            airport=airport.upper(),
            target_date=date,
        )
        
        return {
            "airport": airport.upper(),
            "date": date.isoformat(),
            "impact": impact,
        }
        
    except Exception as e:
        logger.error("Weather impact analysis failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Weather impact analysis failed: {str(e)}"
        )
