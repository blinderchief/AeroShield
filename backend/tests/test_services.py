import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from decimal import Decimal


class TestRiskScoringService:
    """Test suite for AI risk scoring service"""

    @pytest.mark.asyncio
    async def test_calculate_risk_score_low_risk(self):
        """Test risk calculation for low-risk flight"""
        from services.ai.risk_scoring import RiskScoringService
        
        flight_data = {
            "airline": "SQ",  # Singapore Airlines - excellent track record
            "flight_number": "22",
            "origin": "SIN",
            "destination": "JFK",
            "departure_time": "2024-06-15T10:00:00Z",
            "historical_on_time_rate": 0.95,
        }
        
        service = RiskScoringService()
        # Mock external API calls
        with patch.object(service, "_get_historical_data", return_value={"delay_rate": 0.05}):
            with patch.object(service, "_get_weather_factor", return_value=1.0):
                risk_score = await service.calculate_risk_score(flight_data)
                assert 0 <= risk_score <= 100
                assert risk_score < 30  # Should be low risk

    @pytest.mark.asyncio
    async def test_calculate_risk_score_high_risk(self):
        """Test risk calculation for high-risk flight"""
        from services.ai.risk_scoring import RiskScoringService
        
        flight_data = {
            "airline": "BUDGET",
            "flight_number": "999",
            "origin": "JFK",  # Busy hub, winter
            "destination": "ORD",  # Another busy hub
            "departure_time": "2024-12-20T17:00:00Z",  # Peak holiday travel
            "historical_on_time_rate": 0.60,
        }
        
        service = RiskScoringService()
        with patch.object(service, "_get_historical_data", return_value={"delay_rate": 0.40}):
            with patch.object(service, "_get_weather_factor", return_value=1.5):  # Bad weather
                risk_score = await service.calculate_risk_score(flight_data)
                assert 0 <= risk_score <= 100
                assert risk_score > 50  # Should be high risk

    @pytest.mark.asyncio
    async def test_calculate_premium(self):
        """Test premium calculation based on risk score"""
        from services.ai.risk_scoring import RiskScoringService
        
        service = RiskScoringService()
        
        # Low risk should have lower premium
        low_risk_premium = service.calculate_premium(
            risk_score=15,
            coverage_amount=Decimal("1000.00")
        )
        
        # High risk should have higher premium
        high_risk_premium = service.calculate_premium(
            risk_score=75,
            coverage_amount=Decimal("1000.00")
        )
        
        assert low_risk_premium < high_risk_premium
        assert low_risk_premium > 0
        assert high_risk_premium <= Decimal("1000.00")  # Premium shouldn't exceed coverage


class TestGeminiAgent:
    """Test suite for Gemini AI agent"""

    @pytest.mark.asyncio
    async def test_predict_delay(self):
        """Test delay prediction"""
        from services.ai.gemini_agent import GeminiAgent
        
        with patch("google.generativeai.GenerativeModel") as mock_model:
            mock_response = MagicMock()
            mock_response.text = '{"delay_probability": 0.3, "confidence": 0.85, "factors": ["weather", "airport_congestion"]}'
            mock_model.return_value.generate_content_async = AsyncMock(return_value=mock_response)
            
            agent = GeminiAgent()
            result = await agent.predict_delay(
                airline="AA",
                flight_number="100",
                date="2024-06-15",
                origin="JFK",
                destination="LAX"
            )
            
            assert "delay_probability" in result
            assert 0 <= result["delay_probability"] <= 1

    @pytest.mark.asyncio
    async def test_analyze_claim(self):
        """Test claim analysis"""
        from services.ai.gemini_agent import GeminiAgent
        
        with patch("google.generativeai.GenerativeModel") as mock_model:
            mock_response = MagicMock()
            mock_response.text = '{"is_valid": true, "recommended_payout_tier": "delay_2h", "confidence": 0.92}'
            mock_model.return_value.generate_content_async = AsyncMock(return_value=mock_response)
            
            agent = GeminiAgent()
            result = await agent.analyze_claim(
                policy_id="policy-123",
                claim_reason="Flight was delayed by 2.5 hours",
                flight_data={"actual_arrival": "14:30", "scheduled_arrival": "12:00"}
            )
            
            assert "is_valid" in result


class TestClaimsEngine:
    """Test suite for claims processing engine"""

    @pytest.mark.asyncio
    async def test_process_claim_valid(self, mock_db, mock_policy, mock_claim):
        """Test processing a valid claim"""
        from services.insurance.claims_engine import ClaimsEngine
        
        engine = ClaimsEngine(mock_db)
        
        with patch.object(engine, "_verify_with_fdc", return_value=True):
            with patch.object(engine, "_calculate_payout", return_value=Decimal("300.00")):
                result = await engine.process_claim(mock_claim["id"])
                
                assert result is not None

    @pytest.mark.asyncio
    async def test_process_claim_invalid_fdc(self, mock_db, mock_policy, mock_claim):
        """Test claim rejection when FDC verification fails"""
        from services.insurance.claims_engine import ClaimsEngine
        
        engine = ClaimsEngine(mock_db)
        
        with patch.object(engine, "_verify_with_fdc", return_value=False):
            result = await engine.process_claim(mock_claim["id"])
            
            # Should be rejected or require manual review
            assert result is None or result.get("status") == "rejected"

    @pytest.mark.asyncio
    async def test_calculate_payout_tiers(self, mock_db):
        """Test payout calculation for different delay tiers"""
        from services.insurance.claims_engine import ClaimsEngine
        
        engine = ClaimsEngine(mock_db)
        
        payout_tiers = {
            "delay_1h": Decimal("100.00"),
            "delay_2h": Decimal("300.00"),
            "delay_4h": Decimal("500.00"),
            "cancellation": Decimal("1000.00"),
        }
        
        # 1 hour delay
        payout_1h = engine._calculate_payout(delay_minutes=60, payout_tiers=payout_tiers)
        assert payout_1h == Decimal("100.00")
        
        # 2 hour delay
        payout_2h = engine._calculate_payout(delay_minutes=120, payout_tiers=payout_tiers)
        assert payout_2h == Decimal("300.00")
        
        # 4 hour delay
        payout_4h = engine._calculate_payout(delay_minutes=240, payout_tiers=payout_tiers)
        assert payout_4h == Decimal("500.00")


class TestPoolManager:
    """Test suite for liquidity pool manager"""

    @pytest.mark.asyncio
    async def test_deposit(self, mock_db):
        """Test deposit to liquidity pool"""
        from services.insurance.pool_manager import PoolManager
        
        manager = PoolManager(mock_db)
        
        result = await manager.deposit(
            user_id="user-123",
            amount=Decimal("1000.00"),
            tx_hash="0xabc123"
        )
        
        assert result is not None

    @pytest.mark.asyncio
    async def test_withdraw(self, mock_db):
        """Test withdrawal from liquidity pool"""
        from services.insurance.pool_manager import PoolManager
        
        manager = PoolManager(mock_db)
        
        # Mock user having sufficient balance
        with patch.object(manager, "_get_user_balance", return_value=Decimal("1000.00")):
            result = await manager.withdraw(
                user_id="user-123",
                shares=Decimal("500.00")
            )
            
            assert result is not None

    @pytest.mark.asyncio
    async def test_withdraw_insufficient_balance(self, mock_db):
        """Test withdrawal with insufficient balance"""
        from services.insurance.pool_manager import PoolManager
        
        manager = PoolManager(mock_db)
        
        with patch.object(manager, "_get_user_balance", return_value=Decimal("100.00")):
            with pytest.raises(ValueError):
                await manager.withdraw(
                    user_id="user-123",
                    shares=Decimal("500.00")
                )

    @pytest.mark.asyncio
    async def test_calculate_share_value(self, mock_db):
        """Test LP share value calculation"""
        from services.insurance.pool_manager import PoolManager
        
        manager = PoolManager(mock_db)
        
        # Mock pool stats
        with patch.object(manager, "_get_pool_stats", return_value={
            "total_assets": Decimal("100000.00"),
            "total_shares": Decimal("95000.00"),
        }):
            share_value = manager._calculate_share_value()
            
            # Share value should be slightly more than 1:1 due to yield
            assert share_value > Decimal("1.00")
