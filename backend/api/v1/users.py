"""
AeroShield Users API
User management and authentication endpoints
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.logging import get_logger
from core.security import ClerkTokenPayload, verify_clerk_token
from models.user import User
from schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    UserWalletUpdate,
    UserStats,
)
from services.blockchain.smart_account import smart_account_service

logger = get_logger(__name__)
router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user profile."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please complete onboarding."
        )
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    
    return user


@router.post("/onboard", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def onboard_user(
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Onboard a new user from Clerk authentication.
    Creates user profile if not exists.
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        logger.info("User already onboarded", clerk_id=token.sub)
        return existing_user
    
    # Create new user
    user = User(
        clerk_id=token.sub,
        email=token.email or f"{token.sub}@aeroshield.io",
        first_name=token.first_name,
        last_name=token.last_name,
        avatar_url=token.image_url,
        is_active=True,
        last_login_at=datetime.now(timezone.utc),
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info("User onboarded successfully", user_id=str(user.id), clerk_id=token.sub)
    
    return user


@router.patch("/me", response_model=UserResponse)
async def update_user(
    update_data: UserUpdate,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.patch("/me/wallet", response_model=UserResponse)
async def update_wallet(
    wallet_data: UserWalletUpdate,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Update user wallet addresses."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update wallet addresses
    update_dict = wallet_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    logger.info("Wallet updated", user_id=str(user.id))
    return user


@router.post("/me/smart-account", response_model=UserResponse)
async def create_smart_account(
    xrpl_address: str,
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or get a Flare Smart Account for the user.
    Maps XRPL address to Flare Smart Account for gasless transactions.
    """
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate XRPL address
    if not smart_account_service.validate_xrpl_address(xrpl_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid XRPL address"
        )
    
    # Get or create smart account
    smart_account = await smart_account_service.get_or_create_smart_account(xrpl_address)
    
    # Update user
    user.xrpl_address = xrpl_address
    user.smart_account_address = smart_account["address"]
    
    await db.commit()
    await db.refresh(user)
    
    logger.info(
        "Smart account created",
        user_id=str(user.id),
        smart_account=smart_account["address"]
    )
    
    return user


@router.get("/me/stats", response_model=UserStats)
async def get_user_stats(
    token: ClerkTokenPayload = Depends(verify_clerk_token),
    db: AsyncSession = Depends(get_db),
):
    """Get user statistics and metrics."""
    result = await db.execute(
        select(User).where(User.clerk_id == token.sub)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Calculate stats from policies and claims
    # In production, this would query the policies/claims tables
    return UserStats(
        total_policies=user.total_policies,
        active_policies=0,  # Would be calculated
        total_claims=user.total_claims,
        successful_claims=0,  # Would be calculated
        total_premiums_paid=0.0,  # Would be calculated
    )
