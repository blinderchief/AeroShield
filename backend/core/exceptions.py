"""
AeroShield Custom Exceptions
Application-specific error handling
"""

from typing import Any, Dict, Optional

from fastapi import HTTPException, status


class AeroShieldException(HTTPException):
    """Base exception for AeroShield application."""
    
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An error occurred",
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


# Authentication Exceptions
class AuthenticationError(AeroShieldException):
    """Authentication failed."""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(AeroShieldException):
    """User not authorized for this action."""
    
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


# Resource Exceptions
class ResourceNotFoundError(AeroShieldException):
    """Resource not found."""
    
    def __init__(self, resource: str = "Resource", identifier: Any = None):
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} with id '{identifier}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class ResourceAlreadyExistsError(AeroShieldException):
    """Resource already exists."""
    
    def __init__(self, resource: str = "Resource", identifier: Any = None):
        detail = f"{resource} already exists"
        if identifier:
            detail = f"{resource} with id '{identifier}' already exists"
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )


# Validation Exceptions
class ValidationError(AeroShieldException):
    """Validation failed."""
    
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )


# Blockchain Exceptions
class BlockchainError(AeroShieldException):
    """Blockchain operation failed."""
    
    def __init__(self, detail: str = "Blockchain operation failed"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        )


class FDCAttestationError(BlockchainError):
    """FDC attestation failed."""
    
    def __init__(self, detail: str = "FDC attestation failed"):
        super().__init__(detail=f"FDC Error: {detail}")


class FTSOPriceError(BlockchainError):
    """FTSO price feed error."""
    
    def __init__(self, detail: str = "Failed to fetch price feed"):
        super().__init__(detail=f"FTSO Error: {detail}")


class SmartAccountError(BlockchainError):
    """Smart account operation failed."""
    
    def __init__(self, detail: str = "Smart account operation failed"):
        super().__init__(detail=f"Smart Account Error: {detail}")


# External Service Exceptions
class ExternalServiceError(AeroShieldException):
    """External service call failed."""
    
    def __init__(self, service: str, detail: str = "Service unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{service}: {detail}",
        )


class FlightDataError(ExternalServiceError):
    """Flight data API error."""
    
    def __init__(self, detail: str = "Failed to fetch flight data"):
        super().__init__(service="Flight Data API", detail=detail)


class AIServiceError(ExternalServiceError):
    """AI service error."""
    
    def __init__(self, detail: str = "AI service unavailable"):
        super().__init__(service="Gemini AI", detail=detail)


# Rate Limiting
class RateLimitError(AeroShieldException):
    """Rate limit exceeded."""
    
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )


# Policy Exceptions
class PolicyError(AeroShieldException):
    """Policy-related error."""
    pass


class PolicyNotActiveError(PolicyError):
    """Policy is not active."""
    
    def __init__(self, policy_id: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Policy {policy_id} is not active",
        )


class PolicyAlreadyClaimedError(PolicyError):
    """Policy has already been claimed."""
    
    def __init__(self, policy_id: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Policy {policy_id} has already been claimed",
        )


class InsufficientFundsError(PolicyError):
    """Insufficient funds in pool."""
    
    def __init__(self, required: float, available: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient funds: required {required}, available {available}",
        )
