import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
import asyncio

# Test fixtures and configuration
pytest_plugins = ["pytest_asyncio"]


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_db():
    """Mock database session"""
    mock = AsyncMock()
    mock.execute = AsyncMock()
    mock.commit = AsyncMock()
    mock.refresh = AsyncMock()
    mock.rollback = AsyncMock()
    return mock


@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock()
    mock.delete = AsyncMock()
    mock.exists = AsyncMock(return_value=False)
    return mock


@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    return {
        "id": "test-user-123",
        "email": "test@example.com",
        "wallet_address": "0x1234567890abcdef1234567890abcdef12345678",
    }


@pytest.fixture
def mock_policy():
    """Mock policy data"""
    return {
        "id": "policy-123",
        "user_id": "test-user-123",
        "flight_number": "AA100",
        "departure_airport": "JFK",
        "arrival_airport": "LAX",
        "departure_time": "2024-06-15T10:00:00Z",
        "coverage_amount": 1000.0,
        "premium": 25.0,
        "status": "active",
        "payout_tiers": {
            "delay_1h": 100,
            "delay_2h": 300,
            "delay_4h": 500,
            "cancellation": 1000
        },
        "ai_risk_score": 0.15,
    }


@pytest.fixture
def mock_claim():
    """Mock claim data"""
    return {
        "id": "claim-456",
        "policy_id": "policy-123",
        "user_id": "test-user-123",
        "status": "pending",
        "claim_type": "delay_2h",
        "amount": 300.0,
        "fdc_attestation": None,
        "created_at": "2024-06-15T14:00:00Z",
    }


@pytest.fixture
def auth_headers():
    """Mock authorization headers"""
    return {"Authorization": "Bearer mock-jwt-token"}
