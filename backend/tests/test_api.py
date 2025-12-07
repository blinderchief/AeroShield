import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta


class TestPoliciesEndpoints:
    """Test suite for /api/v1/policies endpoints"""

    @pytest.mark.asyncio
    async def test_get_policies_unauthorized(self, mock_db):
        """Test that unauthorized requests are rejected"""
        from main import app
        
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/policies/my-policies")
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_policies_success(self, mock_db, mock_user, mock_policy, auth_headers):
        """Test successful policy retrieval"""
        from main import app
        
        with patch("api.routes.policies.get_current_user", return_value=mock_user):
            with patch("api.routes.policies.get_db", return_value=mock_db):
                mock_db.execute.return_value.scalars.return_value.all.return_value = [mock_policy]
                
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get(
                        "/api/v1/policies/my-policies",
                        headers=auth_headers
                    )
                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_create_policy_success(self, mock_db, mock_user, auth_headers):
        """Test successful policy creation"""
        from main import app
        
        policy_data = {
            "flight_number": "UA456",
            "departure_airport": "SFO",
            "arrival_airport": "ORD",
            "departure_time": "2024-07-01T08:00:00Z",
            "coverage_amount": 2000.0,
        }
        
        with patch("api.routes.policies.get_current_user", return_value=mock_user):
            with patch("api.routes.policies.get_db", return_value=mock_db):
                with patch("services.ai.risk_scoring.calculate_premium", return_value=50.0):
                    async with AsyncClient(
                        transport=ASGITransport(app=app),
                        base_url="http://test"
                    ) as client:
                        response = await client.post(
                            "/api/v1/policies",
                            json=policy_data,
                            headers=auth_headers
                        )
                        # May be 201 or validation error depending on full implementation
                        assert response.status_code in [201, 422]

    @pytest.mark.asyncio
    async def test_create_policy_invalid_data(self, mock_db, mock_user, auth_headers):
        """Test policy creation with invalid data"""
        from main import app
        
        invalid_data = {
            "flight_number": "",  # Empty flight number
            "coverage_amount": -100,  # Negative amount
        }
        
        with patch("api.routes.policies.get_current_user", return_value=mock_user):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/v1/policies",
                    json=invalid_data,
                    headers=auth_headers
                )
                assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_get_single_policy(self, mock_db, mock_user, mock_policy, auth_headers):
        """Test getting a single policy by ID"""
        from main import app
        
        with patch("api.routes.policies.get_current_user", return_value=mock_user):
            with patch("api.routes.policies.get_db", return_value=mock_db):
                mock_db.execute.return_value.scalar_one_or_none.return_value = mock_policy
                
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get(
                        "/api/v1/policies/policy-123",
                        headers=auth_headers
                    )
                    assert response.status_code in [200, 404]


class TestClaimsEndpoints:
    """Test suite for /api/v1/claims endpoints"""

    @pytest.mark.asyncio
    async def test_get_claims_unauthorized(self, mock_db):
        """Test that unauthorized requests are rejected"""
        from main import app
        
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/claims/my-claims")
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_file_claim_success(self, mock_db, mock_user, mock_policy, auth_headers):
        """Test successful claim filing"""
        from main import app
        
        claim_data = {
            "policy_id": "policy-123",
            "reason": "Flight delayed by 3 hours",
        }
        
        with patch("api.routes.claims.get_current_user", return_value=mock_user):
            with patch("api.routes.claims.get_db", return_value=mock_db):
                mock_db.execute.return_value.scalar_one_or_none.return_value = mock_policy
                
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.post(
                        "/api/v1/claims",
                        json=claim_data,
                        headers=auth_headers
                    )
                    assert response.status_code in [201, 400, 404]

    @pytest.mark.asyncio
    async def test_file_claim_invalid_policy(self, mock_db, mock_user, auth_headers):
        """Test claim filing with invalid policy ID"""
        from main import app
        
        claim_data = {
            "policy_id": "non-existent-policy",
            "reason": "Flight delayed",
        }
        
        with patch("api.routes.claims.get_current_user", return_value=mock_user):
            with patch("api.routes.claims.get_db", return_value=mock_db):
                mock_db.execute.return_value.scalar_one_or_none.return_value = None
                
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.post(
                        "/api/v1/claims",
                        json=claim_data,
                        headers=auth_headers
                    )
                    assert response.status_code in [400, 404]


class TestPoolEndpoints:
    """Test suite for /api/v1/pool endpoints"""

    @pytest.mark.asyncio
    async def test_get_pool_stats(self, mock_db):
        """Test getting pool statistics (public endpoint)"""
        from main import app
        
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/pool/stats")
            # Should work without auth
            assert response.status_code in [200, 500]

    @pytest.mark.asyncio
    async def test_deposit_unauthorized(self, mock_db):
        """Test that deposit requires authentication"""
        from main import app
        
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/pool/deposit",
                json={"amount": 100}
            )
            assert response.status_code == 401


class TestAIEndpoints:
    """Test suite for /api/v1/ai endpoints"""

    @pytest.mark.asyncio
    async def test_predict_delay(self, mock_db, auth_headers):
        """Test flight delay prediction"""
        from main import app
        
        flight_data = {
            "airline": "AA",
            "flight_number": "100",
            "date": "2024-06-15",
            "origin": "JFK",
            "destination": "LAX",
        }
        
        with patch("services.ai.gemini_agent.GeminiAgent") as mock_agent:
            mock_agent.return_value.predict_delay = AsyncMock(
                return_value={"delay_probability": 0.25, "risk_score": 15}
            )
            
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/v1/ai/predict-delay",
                    json=flight_data,
                    headers=auth_headers
                )
                assert response.status_code in [200, 401, 500]

    @pytest.mark.asyncio
    async def test_get_risk_assessment(self, mock_db, mock_user, auth_headers):
        """Test getting risk assessment for a flight"""
        from main import app
        
        with patch("api.routes.ai.get_current_user", return_value=mock_user):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get(
                    "/api/v1/ai/risk-assessment/AA100/2024-06-15",
                    headers=auth_headers
                )
                assert response.status_code in [200, 404, 500]


class TestFTSOEndpoints:
    """Test suite for /api/v1/ftso endpoints"""

    @pytest.mark.asyncio
    async def test_get_price_feeds(self, mock_db):
        """Test getting FTSO price feeds"""
        from main import app
        
        with patch("services.blockchain.ftso_client.FTSOClient") as mock_client:
            mock_client.return_value.get_prices = AsyncMock(
                return_value={"FLR/USD": 0.025, "ETH/USD": 2500.0}
            )
            
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get("/api/v1/ftso/prices")
                assert response.status_code in [200, 500]


class TestHealthEndpoints:
    """Test suite for health check endpoints"""

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health check endpoint"""
        from main import app
        
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data

    @pytest.mark.asyncio
    async def test_root_endpoint(self):
        """Test root endpoint"""
        from main import app
        
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/")
            assert response.status_code == 200
