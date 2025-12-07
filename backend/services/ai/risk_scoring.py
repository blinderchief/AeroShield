"""
AeroShield Risk Scoring Service
Advanced risk assessment and scoring
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from core.logging import get_logger
from models.ai_prediction import RiskTier
from services.ai.gemini_agent import gemini_agent

logger = get_logger(__name__)


# Risk weights for different factors
RISK_WEIGHTS = {
    "weather": 0.25,
    "historical": 0.25,
    "congestion": 0.20,
    "aircraft": 0.10,
    "time_of_day": 0.10,
    "day_of_week": 0.05,
    "airline": 0.05,
}

# Historical delay rates by airline (mock data for demo)
AIRLINE_DELAY_RATES = {
    "6E": 0.18,  # IndiGo
    "AI": 0.22,  # Air India
    "UK": 0.15,  # Vistara
    "SG": 0.20,  # SpiceJet
    "IX": 0.17,  # Air India Express
    "QP": 0.14,  # Akasa Air
    "G8": 0.19,  # Go First (historical)
    "AA": 0.16,  # American Airlines
    "UA": 0.18,  # United Airlines
    "DL": 0.14,  # Delta
    "BA": 0.12,  # British Airways
    "LH": 0.11,  # Lufthansa
    "EK": 0.09,  # Emirates
    "SQ": 0.08,  # Singapore Airlines
}

# Airport congestion scores (0-1, higher = more congested)
AIRPORT_CONGESTION = {
    "DEL": 0.75,  # Delhi
    "BOM": 0.80,  # Mumbai
    "BLR": 0.65,  # Bangalore
    "MAA": 0.55,  # Chennai
    "CCU": 0.50,  # Kolkata
    "HYD": 0.60,  # Hyderabad
    "GOI": 0.45,  # Goa
    "COK": 0.40,  # Kochi
    "AMD": 0.35,  # Ahmedabad
    "PNQ": 0.30,  # Pune
    "JFK": 0.85,  # New York JFK
    "LHR": 0.80,  # London Heathrow
    "DXB": 0.70,  # Dubai
    "SIN": 0.55,  # Singapore
}


class RiskScoringService:
    """Service for calculating risk scores and premiums."""
    
    def __init__(self):
        self.base_premium_rate = Decimal("0.02")  # 2% of coverage
        self.min_premium = Decimal("5.00")
        self.max_premium_rate = Decimal("0.15")  # 15% cap
    
    def get_airline_delay_rate(self, airline_code: str) -> float:
        """Get historical delay rate for an airline."""
        return AIRLINE_DELAY_RATES.get(airline_code.upper(), 0.15)
    
    def get_airport_congestion(self, airport_code: str) -> float:
        """Get congestion score for an airport."""
        return AIRPORT_CONGESTION.get(airport_code.upper(), 0.50)
    
    def get_time_of_day_factor(self, departure_time: datetime) -> float:
        """
        Calculate risk factor based on time of day.
        Early morning and late night flights tend to be more reliable.
        """
        hour = departure_time.hour
        
        if 5 <= hour < 8:  # Early morning
            return 0.8
        elif 8 <= hour < 11:  # Morning
            return 0.9
        elif 11 <= hour < 14:  # Midday
            return 1.1
        elif 14 <= hour < 18:  # Afternoon
            return 1.2
        elif 18 <= hour < 21:  # Evening
            return 1.15
        else:  # Night
            return 1.0
    
    def get_day_of_week_factor(self, date: datetime) -> float:
        """
        Calculate risk factor based on day of week.
        Weekends and Mondays tend to have more delays.
        """
        day = date.weekday()
        
        factors = {
            0: 1.15,  # Monday
            1: 1.0,   # Tuesday
            2: 1.0,   # Wednesday
            3: 1.05,  # Thursday
            4: 1.2,   # Friday
            5: 1.1,   # Saturday
            6: 1.15,  # Sunday
        }
        
        return factors.get(day, 1.0)
    
    def get_seasonal_factor(self, date: datetime) -> float:
        """
        Calculate risk factor based on season.
        Monsoon and holiday seasons have higher delay rates.
        """
        month = date.month
        
        # India-focused seasonal factors
        if month in [6, 7, 8, 9]:  # Monsoon season
            return 1.4
        elif month in [12, 1]:  # Winter fog season
            return 1.3
        elif month in [4, 5]:  # Summer (peak heat)
            return 1.1
        else:
            return 1.0
    
    async def calculate_risk_score(
        self,
        flight_number: str,
        airline_code: str,
        departure_airport: str,
        arrival_airport: str,
        scheduled_departure: datetime,
        weather_data: Optional[dict] = None
    ) -> dict:
        """
        Calculate comprehensive risk score for a flight.
        """
        logger.info(
            "Calculating risk score",
            flight=flight_number,
            route=f"{departure_airport}-{arrival_airport}"
        )
        
        # Individual risk components
        airline_risk = self.get_airline_delay_rate(airline_code)
        dep_congestion = self.get_airport_congestion(departure_airport)
        arr_congestion = self.get_airport_congestion(arrival_airport)
        time_factor = self.get_time_of_day_factor(scheduled_departure)
        day_factor = self.get_day_of_week_factor(scheduled_departure)
        seasonal_factor = self.get_seasonal_factor(scheduled_departure)
        
        # Weather factor (default to moderate if no data)
        weather_factor = 1.0
        if weather_data:
            # Simplified weather risk calculation
            conditions = weather_data.get("conditions", "").lower()
            if "storm" in conditions or "thunderstorm" in conditions:
                weather_factor = 1.8
            elif "rain" in conditions or "snow" in conditions:
                weather_factor = 1.4
            elif "fog" in conditions:
                weather_factor = 1.5
            elif "wind" in conditions:
                weather_factor = 1.2
        
        # Calculate weighted risk score
        base_risk = (
            airline_risk * RISK_WEIGHTS["airline"] +
            ((dep_congestion + arr_congestion) / 2) * RISK_WEIGHTS["congestion"] +
            airline_risk * RISK_WEIGHTS["historical"]  # Using airline rate as proxy
        )
        
        # Apply multiplicative factors
        adjusted_risk = base_risk * time_factor * day_factor * seasonal_factor * weather_factor
        
        # Normalize to 0-100 scale
        risk_score = min(100, max(0, adjusted_risk * 100))
        
        # Calculate delay probability
        delay_probability = min(0.95, max(0.05, adjusted_risk))
        
        # Determine risk tier
        if risk_score < 20:
            risk_tier = RiskTier.VERY_LOW
        elif risk_score < 35:
            risk_tier = RiskTier.LOW
        elif risk_score < 55:
            risk_tier = RiskTier.MEDIUM
        elif risk_score < 75:
            risk_tier = RiskTier.HIGH
        else:
            risk_tier = RiskTier.VERY_HIGH
        
        # Build risk factors breakdown
        risk_factors = [
            {
                "name": "Airline Performance",
                "score": airline_risk,
                "weight": RISK_WEIGHTS["airline"],
                "details": f"{airline_code} has {airline_risk*100:.1f}% historical delay rate",
                "impact": "negative" if airline_risk > 0.15 else "neutral"
            },
            {
                "name": "Airport Congestion",
                "score": (dep_congestion + arr_congestion) / 2,
                "weight": RISK_WEIGHTS["congestion"],
                "details": f"DEP: {dep_congestion*100:.0f}%, ARR: {arr_congestion*100:.0f}%",
                "impact": "negative" if dep_congestion > 0.6 or arr_congestion > 0.6 else "neutral"
            },
            {
                "name": "Time of Day",
                "score": time_factor - 1,
                "weight": RISK_WEIGHTS["time_of_day"],
                "details": f"Departure at {scheduled_departure.strftime('%H:%M')}",
                "impact": "positive" if time_factor < 1 else "negative" if time_factor > 1.1 else "neutral"
            },
            {
                "name": "Day of Week",
                "score": day_factor - 1,
                "weight": RISK_WEIGHTS["day_of_week"],
                "details": scheduled_departure.strftime("%A"),
                "impact": "negative" if day_factor > 1.1 else "neutral"
            },
            {
                "name": "Seasonal",
                "score": seasonal_factor - 1,
                "weight": 0.15,
                "details": f"Month: {scheduled_departure.strftime('%B')}",
                "impact": "negative" if seasonal_factor > 1.2 else "neutral"
            },
            {
                "name": "Weather",
                "score": weather_factor - 1,
                "weight": RISK_WEIGHTS["weather"],
                "details": weather_data.get("conditions", "Normal") if weather_data else "Normal conditions",
                "impact": "negative" if weather_factor > 1.2 else "neutral"
            }
        ]
        
        return {
            "risk_score": round(risk_score, 2),
            "delay_probability": round(delay_probability, 4),
            "risk_tier": risk_tier,
            "risk_factors": risk_factors,
            "confidence_score": 0.85,
            "factors_summary": {
                "airline_risk": round(airline_risk, 3),
                "congestion": round((dep_congestion + arr_congestion) / 2, 3),
                "time_factor": round(time_factor, 2),
                "day_factor": round(day_factor, 2),
                "seasonal_factor": round(seasonal_factor, 2),
                "weather_factor": round(weather_factor, 2)
            }
        }
    
    def calculate_premium(
        self,
        coverage_amount: Decimal,
        delay_probability: float,
        risk_tier: RiskTier,
        delay_threshold_minutes: int = 120
    ) -> dict:
        """
        Calculate insurance premium based on risk assessment.
        """
        # Base premium
        base_premium = coverage_amount * self.base_premium_rate
        
        # Risk multiplier based on tier
        tier_multipliers = {
            RiskTier.VERY_LOW: Decimal("0.5"),
            RiskTier.LOW: Decimal("0.75"),
            RiskTier.MEDIUM: Decimal("1.0"),
            RiskTier.HIGH: Decimal("1.5"),
            RiskTier.VERY_HIGH: Decimal("2.0"),
        }
        risk_multiplier = tier_multipliers.get(risk_tier, Decimal("1.0"))
        
        # Threshold adjustment (lower threshold = higher premium)
        threshold_factor = Decimal("1.0")
        if delay_threshold_minutes < 60:
            threshold_factor = Decimal("1.5")
        elif delay_threshold_minutes < 120:
            threshold_factor = Decimal("1.2")
        elif delay_threshold_minutes > 180:
            threshold_factor = Decimal("0.8")
        
        # Calculate final premium
        final_premium = base_premium * risk_multiplier * threshold_factor
        
        # Apply bounds
        max_premium = coverage_amount * self.max_premium_rate
        final_premium = max(self.min_premium, min(final_premium, max_premium))
        
        # Round to 2 decimal places
        final_premium = round(final_premium, 2)
        
        return {
            "base_premium": float(base_premium),
            "risk_multiplier": float(risk_multiplier),
            "threshold_factor": float(threshold_factor),
            "final_premium": float(final_premium),
            "coverage_amount": float(coverage_amount),
            "delay_threshold_minutes": delay_threshold_minutes,
            "breakdown": {
                "base_rate": float(self.base_premium_rate),
                "risk_adjustment": float(risk_multiplier - 1),
                "threshold_adjustment": float(threshold_factor - 1)
            }
        }
    
    async def get_ai_enhanced_prediction(
        self,
        flight_number: str,
        airline_code: str,
        departure_airport: str,
        arrival_airport: str,
        scheduled_departure: datetime,
        airline_name: Optional[str] = None
    ) -> dict:
        """
        Get AI-enhanced delay prediction combining local scoring and Gemini.
        """
        # First, calculate local risk score
        local_risk = await self.calculate_risk_score(
            flight_number=flight_number,
            airline_code=airline_code,
            departure_airport=departure_airport,
            arrival_airport=arrival_airport,
            scheduled_departure=scheduled_departure
        )
        
        # Then get AI prediction for additional insights
        try:
            ai_prediction = await gemini_agent.predict_delay(
                flight_number=flight_number,
                airline_code=airline_code,
                departure_airport=departure_airport,
                arrival_airport=arrival_airport,
                flight_date=scheduled_departure,
                airline_name=airline_name,
                additional_context={
                    "local_risk_score": local_risk["risk_score"],
                    "historical_delay_rate": self.get_airline_delay_rate(airline_code)
                }
            )
            
            # Blend local and AI predictions
            blended_probability = (
                local_risk["delay_probability"] * 0.4 +
                ai_prediction["delay_probability"] * 0.6
            )
            
            return {
                **ai_prediction,
                "delay_probability": round(blended_probability, 4),
                "local_risk_score": local_risk["risk_score"],
                "local_risk_factors": local_risk["risk_factors"],
                "ai_enhanced": True
            }
            
        except Exception as e:
            logger.warning("AI prediction failed, using local only", error=str(e))
            return {
                **local_risk,
                "ai_enhanced": False,
                "ai_error": str(e)
            }


# Singleton instance
risk_scoring_service = RiskScoringService()
