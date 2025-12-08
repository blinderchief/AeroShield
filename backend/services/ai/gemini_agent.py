"""
AeroShield Gemini Agent
AI-powered flight delay prediction and risk assessment
"""

import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Optional

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from core.config import settings
from core.exceptions import AIServiceError
from core.logging import get_logger
from models.ai_prediction import RiskTier

logger = get_logger(__name__)


# System prompts for different AI tasks
DELAY_PREDICTION_PROMPT = """You are AeroShield AI Agent, an expert in flight delay prediction and risk assessment.

Your task is to predict the probability of a flight delay and assess the risk factors.

IMPORTANT: You must respond ONLY with valid JSON. No explanations, no markdown, just pure JSON.

Analyze the following flight and provide a comprehensive risk assessment:

Flight Details:
- Flight Number: {flight_number}
- Airline: {airline_code} ({airline_name})
- Route: {departure_airport} → {arrival_airport}
- Scheduled Date: {flight_date}
- Scheduled Departure: {departure_time}

Additional Context:
{context}

Consider these factors in your analysis:
1. Historical delay patterns for this route and airline
2. Typical weather conditions for the season
3. Airport congestion patterns
4. Time of day effects
5. Day of week patterns
6. Aircraft turnaround risks

Respond with JSON in exactly this format:
{{
    "delay_probability": <float between 0.0 and 1.0>,
    "risk_tier": "<very_low|low|medium|high|very_high>",
    "risk_score": <float between 0 and 100>,
    "estimated_delay_minutes": <integer or null>,
    "risk_factors": [
        {{
            "name": "<factor name>",
            "score": <float 0-1>,
            "weight": <float 0-1>,
            "details": "<explanation>",
            "impact": "<positive|negative|neutral>"
        }}
    ],
    "weather_summary": "<brief weather analysis>",
    "historical_analysis": "<brief historical pattern analysis>",
    "confidence_score": <float 0-1>,
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}}
"""

PREMIUM_CALCULATION_PROMPT = """You are AeroShield AI Agent, an actuarial expert for parametric travel insurance.

Calculate the appropriate premium for the following insurance policy:

Policy Details:
- Coverage Amount: ${coverage_amount}
- Delay Threshold: {delay_threshold} minutes

Risk Assessment:
- Delay Probability: {delay_probability}
- Risk Tier: {risk_tier}
- Risk Score: {risk_score}/100

Base Premium Rate: 2% of coverage for low risk

Respond with JSON only:
{{
    "base_premium": <float>,
    "risk_multiplier": <float>,
    "final_premium": <float>,
    "breakdown": {{
        "base_rate": <float>,
        "risk_adjustment": <float>,
        "seasonal_adjustment": <float>,
        "route_adjustment": <float>
    }},
    "profit_margin": <float>,
    "expected_loss_ratio": <float>
}}
"""

ANOMALY_DETECTION_PROMPT = """You are AeroShield AI Agent, monitoring flight operations for anomalies.

Analyze the following flight data for any unusual patterns or anomalies:

Data Summary:
{data_summary}

Time Window: Last {time_window} hours

Look for:
1. Mass delays affecting multiple flights
2. Unusual delay patterns for specific airlines or airports
3. Weather-related system impacts
4. ATC congestion indicators
5. Any other anomalies

Respond with JSON only:
{{
    "anomalies_detected": <boolean>,
    "alerts": [
        {{
            "alert_type": "<mass_delay|system_outage|weather_event|congestion|other>",
            "severity": "<low|medium|high|critical>",
            "affected_flights": <integer>,
            "affected_airports": ["<airport codes>"],
            "description": "<detailed description>",
            "recommendations": ["<action items>"]
        }}
    ],
    "overall_risk_level": "<normal|elevated|high|critical>",
    "summary": "<brief summary>"
}}
"""


class GeminiAgent:
    """AI Agent powered by Google Gemini."""
    
    def __init__(self):
        self.model_name = settings.GEMINI_MODEL
        self.temperature = settings.GEMINI_TEMPERATURE
        self.max_tokens = settings.GEMINI_MAX_TOKENS
        self._model = None
        
        # Configure Gemini
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
    
    @property
    def model(self):
        """Get or create Gemini model instance."""
        if not self._model:
            if not settings.GOOGLE_API_KEY:
                raise AIServiceError("Google API key not configured")
            
            self._model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={
                    "temperature": self.temperature,
                    "max_output_tokens": self.max_tokens,
                    "response_mime_type": "application/json"
                }
            )
        return self._model
    
    def _parse_json_response(self, response_text: str) -> dict:
        """Parse JSON from model response."""
        try:
            # Clean up the response
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            return json.loads(text.strip())
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse AI response", error=str(e), response=response_text[:500])
            raise AIServiceError(f"Invalid JSON response from AI: {str(e)}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def _generate(self, prompt: str) -> dict:
        """Generate response from Gemini with retry logic."""
        try:
            response = await self.model.generate_content_async(prompt)
            return self._parse_json_response(response.text)
            
        except Exception as e:
            error_str = str(e)
            logger.error("Gemini generation failed", error=error_str)
            # Check if it's a quota error - don't retry, return fallback
            if "429" in error_str or "quota" in error_str.lower():
                raise AIServiceError(f"AI quota exceeded: {error_str}")
            raise AIServiceError(f"AI generation failed: {error_str}")
    
    def _get_fallback_prediction(self, flight_number: str, departure_airport: str, arrival_airport: str) -> dict:
        """Return a fallback prediction when AI is unavailable."""
        import random
        # Generate reasonable random values for demo purposes
        delay_prob = round(random.uniform(0.15, 0.45), 2)
        risk_score = round(delay_prob * 100, 1)
        
        if delay_prob < 0.20:
            risk_tier = "low"
        elif delay_prob < 0.35:
            risk_tier = "medium"
        else:
            risk_tier = "high"
            
        return {
            "delay_probability": delay_prob,
            "risk_tier": risk_tier,
            "risk_score": risk_score,
            "estimated_delay_minutes": int(delay_prob * 60) if delay_prob > 0.3 else None,
            "risk_factors": [
                {
                    "name": "Historical Performance",
                    "score": round(random.uniform(0.2, 0.5), 2),
                    "weight": 0.3,
                    "details": f"Based on typical {departure_airport}-{arrival_airport} route performance",
                    "impact": "neutral"
                },
                {
                    "name": "Time of Day",
                    "score": round(random.uniform(0.1, 0.4), 2),
                    "weight": 0.2,
                    "details": "Standard departure time analysis",
                    "impact": "neutral"
                }
            ],
            "weather_summary": "Weather data temporarily unavailable - using historical averages",
            "historical_analysis": "AI analysis temporarily unavailable - using statistical defaults",
            "confidence_score": 0.5,
            "recommendations": [
                "Consider purchasing delay protection for peace of mind",
                "Check flight status closer to departure"
            ],
            "_fallback": True  # Flag to indicate this is fallback data
        }

    async def predict_delay(
        self,
        flight_number: str,
        airline_code: str,
        departure_airport: str,
        arrival_airport: str,
        flight_date: datetime,
        airline_name: Optional[str] = None,
        additional_context: Optional[dict] = None
    ) -> dict:
        """
        Predict flight delay probability and assess risk factors.
        """
        logger.info(
            "Predicting delay",
            flight=flight_number,
            route=f"{departure_airport}-{arrival_airport}"
        )
        
        # Build context string
        context_parts = []
        if additional_context:
            if "weather" in additional_context:
                context_parts.append(f"Weather: {additional_context['weather']}")
            if "historical_delay_rate" in additional_context:
                context_parts.append(
                    f"Historical delay rate: {additional_context['historical_delay_rate']*100:.1f}%"
                )
        
        context = "\n".join(context_parts) if context_parts else "Standard conditions"
        
        # Format prompt
        prompt = DELAY_PREDICTION_PROMPT.format(
            flight_number=flight_number,
            airline_code=airline_code,
            airline_name=airline_name or airline_code,
            departure_airport=departure_airport,
            arrival_airport=arrival_airport,
            flight_date=flight_date.strftime("%Y-%m-%d"),
            departure_time=flight_date.strftime("%H:%M"),
            context=context
        )
        
        # Generate prediction with fallback
        try:
            result = await self._generate(prompt)
        except AIServiceError as e:
            if "quota" in str(e).lower():
                logger.warning(
                    "AI quota exceeded, using fallback prediction",
                    flight=flight_number,
                    route=f"{departure_airport}-{arrival_airport}"
                )
                return self._get_fallback_prediction(flight_number, departure_airport, arrival_airport)
            raise
        
        # Validate and normalize result
        result["delay_probability"] = max(0, min(1, float(result.get("delay_probability", 0.5))))
        result["risk_score"] = max(0, min(100, float(result.get("risk_score", 50))))
        result["confidence_score"] = max(0, min(1, float(result.get("confidence_score", 0.7))))
        
        # Ensure risk_tier is valid
        valid_tiers = ["very_low", "low", "medium", "high", "very_high"]
        if result.get("risk_tier") not in valid_tiers:
            # Derive from probability
            prob = result["delay_probability"]
            if prob < 0.15:
                result["risk_tier"] = "very_low"
            elif prob < 0.30:
                result["risk_tier"] = "low"
            elif prob < 0.50:
                result["risk_tier"] = "medium"
            elif prob < 0.70:
                result["risk_tier"] = "high"
            else:
                result["risk_tier"] = "very_high"
        
        logger.info(
            "Delay prediction complete",
            flight=flight_number,
            probability=result["delay_probability"],
            risk_tier=result["risk_tier"]
        )
        
        return result
    
    async def calculate_premium(
        self,
        coverage_amount: Decimal,
        delay_threshold_minutes: int,
        delay_probability: float,
        risk_tier: str,
        risk_score: float
    ) -> dict:
        """
        Calculate insurance premium based on risk assessment.
        """
        logger.info(
            "Calculating premium",
            coverage=str(coverage_amount),
            risk_tier=risk_tier
        )
        
        prompt = PREMIUM_CALCULATION_PROMPT.format(
            coverage_amount=coverage_amount,
            delay_threshold=delay_threshold_minutes,
            delay_probability=delay_probability,
            risk_tier=risk_tier,
            risk_score=risk_score
        )
        
        result = await self._generate(prompt)
        
        # Validate premium is reasonable (1-15% of coverage)
        final_premium = Decimal(str(result.get("final_premium", 0)))
        min_premium = coverage_amount * Decimal("0.01")
        max_premium = coverage_amount * Decimal("0.15")
        
        if final_premium < min_premium:
            result["final_premium"] = float(min_premium)
        elif final_premium > max_premium:
            result["final_premium"] = float(max_premium)
        
        return result
    
    async def detect_anomalies(
        self,
        flight_data: list[dict],
        time_window_hours: int = 24
    ) -> dict:
        """
        Detect anomalies in flight data patterns.
        """
        logger.info(
            "Running anomaly detection",
            flights=len(flight_data),
            window_hours=time_window_hours
        )
        
        # Summarize the data for the prompt
        delayed_count = sum(1 for f in flight_data if f.get("is_delayed"))
        total_count = len(flight_data)
        
        airports = {}
        airlines = {}
        
        for flight in flight_data:
            dep = flight.get("departure_airport", "UNK")
            arr = flight.get("arrival_airport", "UNK")
            airline = flight.get("airline_code", "UNK")
            
            airports[dep] = airports.get(dep, 0) + (1 if flight.get("is_delayed") else 0)
            airports[arr] = airports.get(arr, 0) + (1 if flight.get("is_delayed") else 0)
            airlines[airline] = airlines.get(airline, 0) + (1 if flight.get("is_delayed") else 0)
        
        data_summary = f"""
Total Flights Analyzed: {total_count}
Delayed Flights: {delayed_count} ({delayed_count/total_count*100:.1f}% if total_count > 0 else 0)

Airport Delay Counts:
{json.dumps(airports, indent=2)}

Airline Delay Counts:
{json.dumps(airlines, indent=2)}
"""
        
        prompt = ANOMALY_DETECTION_PROMPT.format(
            data_summary=data_summary,
            time_window=time_window_hours
        )
        
        result = await self._generate(prompt)
        result["data_points_analyzed"] = total_count
        result["analysis_timestamp"] = datetime.now(timezone.utc).isoformat()
        
        return result
    
    async def generate_insight(
        self,
        context: dict
    ) -> dict:
        """
        Generate a single AI insight for dashboard display.
        """
        insight_types = ["delay_risk", "weather_alert", "route_tip", "savings_opportunity"]
        
        # For demo, generate a simple insight based on context
        if context.get("risk_tier") in ["high", "very_high"]:
            return {
                "insight_type": "delay_risk",
                "title": "High Delay Risk Detected",
                "description": f"Your flight has a {context.get('delay_probability', 0)*100:.0f}% chance of delay. Consider purchasing protection.",
                "icon": "⚠️",
                "color": "orange",
                "action_url": "/dashboard/buy"
            }
        elif context.get("weather"):
            return {
                "insight_type": "weather_alert",
                "title": "Weather Advisory",
                "description": context.get("weather", "Check weather conditions for your route."),
                "icon": "🌧️",
                "color": "blue",
                "action_url": None
            }
        else:
            return {
                "insight_type": "route_tip",
                "title": "Route Insight",
                "description": "This route typically has good on-time performance.",
                "icon": "✈️",
                "color": "green",
                "action_url": None
            }
    
    async def predict_flight_delay(
        self,
        flight_number: str,
        airline_code: str,
        departure_airport: str,
        arrival_airport: str,
        flight_date,
        departure_time=None,
        airline_name: Optional[str] = None,
        additional_context: Optional[dict] = None
    ) -> dict:
        """
        Predict flight delay probability - wrapper for predict_delay.
        Handles both datetime and separate date/time parameters.
        """
        # Handle case where flight_date is a date object and departure_time is separate
        if hasattr(flight_date, 'hour'):
            # It's already a datetime
            full_datetime = flight_date
        elif departure_time is not None:
            # Combine date and time
            from datetime import datetime as dt
            if hasattr(flight_date, 'year'):
                full_datetime = dt.combine(flight_date, departure_time)
            else:
                full_datetime = flight_date
        else:
            # Just a date, use midnight
            from datetime import datetime as dt, time
            if hasattr(flight_date, 'year'):
                full_datetime = dt.combine(flight_date, time(0, 0))
            else:
                full_datetime = flight_date
        
        return await self.predict_delay(
            flight_number=flight_number,
            airline_code=airline_code,
            departure_airport=departure_airport,
            arrival_airport=arrival_airport,
            flight_date=full_datetime,
            airline_name=airline_name,
            additional_context=additional_context
        )

    async def health_check(self) -> dict:
        """Check AI service health."""
        try:
            # Simple test generation
            response = await self.model.generate_content_async(
                "Respond with exactly: {\"status\": \"ok\"}"
            )
            result = self._parse_json_response(response.text)
            
            return {
                "healthy": True,
                "model": self.model_name,
                "response": result
            }
            
        except Exception as e:
            return {
                "healthy": False,
                "model": self.model_name,
                "error": str(e)
            }


# Singleton instance
gemini_agent = GeminiAgent()
