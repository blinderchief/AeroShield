"""
AeroShield Security Module
Clerk JWT verification and authentication
"""

from datetime import datetime, timezone
from typing import Any, Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

# HTTP Bearer scheme for JWT tokens
security = HTTPBearer()


class ClerkTokenPayload:
    """Parsed Clerk JWT token payload."""
    
    def __init__(self, payload: dict[str, Any]):
        self.sub = payload.get("sub")  # User ID
        self.email = payload.get("email")
        self.first_name = payload.get("first_name")
        self.last_name = payload.get("last_name")
        self.image_url = payload.get("image_url")
        self.exp = payload.get("exp")
        self.iat = payload.get("iat")
        self.azp = payload.get("azp")  # Authorized party
        self.raw = payload


async def get_clerk_jwks() -> dict:
    """Fetch Clerk JWKS (JSON Web Key Set) for token verification."""
    if not settings.CLERK_JWT_ISSUER:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk JWT issuer not configured"
        )
    
    jwks_url = f"{settings.CLERK_JWT_ISSUER}/.well-known/jwks.json"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch Clerk JWKS"
            )
        return response.json()


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> ClerkTokenPayload:
    """Verify Clerk JWT token and return payload."""
    token = credentials.credentials
    
    try:
        # Get JWKS from Clerk
        jwks = await get_clerk_jwks()
        
        # Get the signing key
        unverified_header = jwt.get_unverified_header(token)
        
        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == unverified_header.get("kid"):
                rsa_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key",
            )
        
        # Verify the token with leeway for clock skew
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            issuer=settings.CLERK_JWT_ISSUER,
            leeway=60,  # Allow 60 seconds clock skew
            options={
                "verify_aud": False,  # Clerk doesn't use standard audience
                "verify_exp": True,
                "verify_iat": True,
            },
        )
        
        return ClerkTokenPayload(payload)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        logger.error("Invalid token", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )


async def get_current_user(
    token_payload: ClerkTokenPayload = Depends(verify_clerk_token),
) -> ClerkTokenPayload:
    """Get current authenticated user from token."""
    if not token_payload.sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user in token",
        )
    return token_payload


def get_optional_user(request: Request) -> Optional[ClerkTokenPayload]:
    """Get current user if authenticated, None otherwise."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    try:
        # This is a sync version for optional auth
        token = auth_header.split(" ")[1]
        # For optional auth, we skip verification
        payload = jwt.decode(token, options={"verify_signature": False})
        return ClerkTokenPayload(payload)
    except Exception:
        return None
