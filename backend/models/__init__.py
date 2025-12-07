"""
AeroShield Models Package
Database models for the application
"""

from models.user import User
from models.policy import Policy, PolicyStatus, PolicyType
from models.claim import Claim, ClaimStatus, ClaimType
from models.fdc_event import FDCEvent, AttestationType, FDCRequestStatus
from models.ai_prediction import AIPrediction, PredictionType, RiskTier
from models.pool import InsurancePool, PoolTransaction, PoolTransactionType

__all__ = [
    # User
    "User",
    # Policy
    "Policy",
    "PolicyStatus",
    "PolicyType",
    # Claim
    "Claim",
    "ClaimStatus",
    "ClaimType",
    # FDC
    "FDCEvent",
    "AttestationType",
    "FDCRequestStatus",
    # AI
    "AIPrediction",
    "PredictionType",
    "RiskTier",
    # Pool
    "InsurancePool",
    "PoolTransaction",
    "PoolTransactionType",
]
