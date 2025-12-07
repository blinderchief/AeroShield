"""
AeroShield Schemas Package
Pydantic models for API requests and responses
"""

from schemas.base import (
    APIResponse,
    BaseSchema,
    ErrorDetail,
    ErrorResponse,
    HealthResponse,
    PaginatedResponse,
    PaginationParams,
    TimestampMixin,
)
from schemas.user import (
    UserBase,
    UserCreate,
    UserPublicResponse,
    UserResponse,
    UserStats,
    UserUpdate,
    UserWalletUpdate,
)
from schemas.policy import (
    FlightInfo,
    PolicyClaimRequest,
    PolicyCreate,
    PolicyListResponse,
    PolicyQuoteRequest,
    PolicyQuoteResponse,
    PolicyResponse,
    PolicyStatusUpdate,
)
from schemas.claim import (
    ClaimCreate,
    ClaimListResponse,
    ClaimResponse,
    ClaimStatusUpdate,
    ClaimVerificationResult,
)
from schemas.ai_prediction import (
    AIInsight,
    AIPredictionRecord,
    AnomalyAlert,
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    DelayPredictionRequest,
    DelayPredictionResponse,
    PremiumCalculationRequest,
    PremiumCalculationResponse,
    RiskFactor,
)
from schemas.fdc import (
    FDCAttestationRequest,
    FDCEventResponse,
    FDCFlightStatusRequest,
    FDCPaymentRequest,
    FDCProofData,
    FDCStatusResponse,
    FDCSubmitResponse,
    FDCVerificationResult,
)
from schemas.pool import (
    LPPositionResponse,
    LPStakeRequest,
    LPUnstakeRequest,
    PoolHealthResponse,
    PoolResponse,
    PoolStatsResponse,
    PoolTransactionResponse,
)

__all__ = [
    # Base
    "APIResponse",
    "BaseSchema",
    "ErrorDetail",
    "ErrorResponse",
    "HealthResponse",
    "PaginatedResponse",
    "PaginationParams",
    "TimestampMixin",
    # User
    "UserBase",
    "UserCreate",
    "UserPublicResponse",
    "UserResponse",
    "UserStats",
    "UserUpdate",
    "UserWalletUpdate",
    # Policy
    "FlightInfo",
    "PolicyClaimRequest",
    "PolicyCreate",
    "PolicyListResponse",
    "PolicyQuoteRequest",
    "PolicyQuoteResponse",
    "PolicyResponse",
    "PolicyStatusUpdate",
    # Claim
    "ClaimCreate",
    "ClaimListResponse",
    "ClaimResponse",
    "ClaimStatusUpdate",
    "ClaimVerificationResult",
    # AI
    "AIInsight",
    "AIPredictionRecord",
    "AnomalyAlert",
    "AnomalyDetectionRequest",
    "AnomalyDetectionResponse",
    "DelayPredictionRequest",
    "DelayPredictionResponse",
    "PremiumCalculationRequest",
    "PremiumCalculationResponse",
    "RiskFactor",
    # FDC
    "FDCAttestationRequest",
    "FDCEventResponse",
    "FDCFlightStatusRequest",
    "FDCPaymentRequest",
    "FDCProofData",
    "FDCStatusResponse",
    "FDCSubmitResponse",
    "FDCVerificationResult",
    # Pool
    "LPPositionResponse",
    "LPStakeRequest",
    "LPUnstakeRequest",
    "PoolHealthResponse",
    "PoolResponse",
    "PoolStatsResponse",
    "PoolTransactionResponse",
]
