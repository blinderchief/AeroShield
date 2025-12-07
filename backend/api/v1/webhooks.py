"""
Webhook endpoints for blockchain event notifications.
Receives events from the contract event listener.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from core.config import settings
from core.database import get_db
from core.redis import get_redis
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)


# Webhook payload schemas
class PolicyCreatedWebhook(BaseModel):
    policyId: str
    holder: str
    premium: str
    coverage: str
    txHash: str
    blockNumber: int


class PolicyActivatedWebhook(BaseModel):
    policyId: str
    flightNumber: str
    departureTime: str
    txHash: str


class ClaimSubmittedWebhook(BaseModel):
    claimId: str
    policyId: str
    amount: str
    txHash: str


class ClaimProcessedWebhook(BaseModel):
    claimId: str
    approved: bool
    payout: str
    txHash: str


class PoolDepositWebhook(BaseModel):
    provider: str
    amount: str
    shares: str
    txHash: str


class PoolWithdrawalWebhook(BaseModel):
    provider: str
    amount: str
    shares: str
    txHash: str


# Simple API key verification for webhook security
async def verify_webhook_secret(x_webhook_secret: Optional[str] = None):
    """Verify the webhook secret for security."""
    expected_secret = settings.WEBHOOK_SECRET if hasattr(settings, 'WEBHOOK_SECRET') else None
    if expected_secret and x_webhook_secret != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
    return True


@router.post("/policy-created")
async def policy_created_webhook(
    payload: PolicyCreatedWebhook,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle policy created event from blockchain.
    Updates local database with on-chain policy data.
    """
    logger.info(f"📋 Received PolicyCreated webhook: Policy #{payload.policyId}")
    
    try:
        # Store event in cache for quick access
        redis = await get_redis()
        await redis.hset(
            f"policy:{payload.policyId}:chain",
            mapping={
                "holder": payload.holder,
                "premium": payload.premium,
                "coverage": payload.coverage,
                "txHash": payload.txHash,
                "blockNumber": str(payload.blockNumber),
                "createdAt": datetime.utcnow().isoformat(),
            }
        )
        
        # Background task to sync with database
        background_tasks.add_task(
            sync_policy_from_chain,
            payload.policyId,
            payload.holder,
            payload.premium,
            payload.coverage,
            payload.txHash,
        )
        
        return {"status": "received", "policyId": payload.policyId}
        
    except Exception as e:
        logger.error(f"Error processing PolicyCreated webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/policy-activated")
async def policy_activated_webhook(
    payload: PolicyActivatedWebhook,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle policy activated event from blockchain.
    """
    logger.info(f"✈️ Received PolicyActivated webhook: Policy #{payload.policyId}")
    
    try:
        redis = await get_redis()
        await redis.hset(
            f"policy:{payload.policyId}:activation",
            mapping={
                "flightNumber": payload.flightNumber,
                "departureTime": payload.departureTime,
                "txHash": payload.txHash,
                "activatedAt": datetime.utcnow().isoformat(),
            }
        )
        
        # Schedule flight monitoring
        background_tasks.add_task(
            schedule_flight_monitoring,
            payload.policyId,
            payload.flightNumber,
            int(payload.departureTime),
        )
        
        return {"status": "received", "policyId": payload.policyId}
        
    except Exception as e:
        logger.error(f"Error processing PolicyActivated webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/claim-submitted")
async def claim_submitted_webhook(
    payload: ClaimSubmittedWebhook,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle claim submitted event from blockchain.
    """
    logger.info(f"📝 Received ClaimSubmitted webhook: Claim #{payload.claimId}")
    
    try:
        redis = await get_redis()
        await redis.hset(
            f"claim:{payload.claimId}:chain",
            mapping={
                "policyId": payload.policyId,
                "amount": payload.amount,
                "txHash": payload.txHash,
                "submittedAt": datetime.utcnow().isoformat(),
                "status": "submitted",
            }
        )
        
        return {"status": "received", "claimId": payload.claimId}
        
    except Exception as e:
        logger.error(f"Error processing ClaimSubmitted webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/claim-processed")
async def claim_processed_webhook(
    payload: ClaimProcessedWebhook,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle claim processed event from blockchain.
    """
    status_emoji = "✅" if payload.approved else "❌"
    logger.info(f"{status_emoji} Received ClaimProcessed webhook: Claim #{payload.claimId}")
    
    try:
        redis = await get_redis()
        await redis.hset(
            f"claim:{payload.claimId}:result",
            mapping={
                "approved": str(payload.approved),
                "payout": payload.payout,
                "txHash": payload.txHash,
                "processedAt": datetime.utcnow().isoformat(),
            }
        )
        
        # Update claim status
        await redis.hset(f"claim:{payload.claimId}:chain", "status", "approved" if payload.approved else "rejected")
        
        # Notify user (background task)
        background_tasks.add_task(
            notify_claim_result,
            payload.claimId,
            payload.approved,
            payload.payout,
        )
        
        return {"status": "received", "claimId": payload.claimId, "approved": payload.approved}
        
    except Exception as e:
        logger.error(f"Error processing ClaimProcessed webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pool-deposit")
async def pool_deposit_webhook(
    payload: PoolDepositWebhook,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle pool deposit event from blockchain.
    """
    logger.info(f"💰 Received PoolDeposit webhook: {payload.provider[:10]}...")
    
    try:
        redis = await get_redis()
        
        # Update provider's position
        await redis.hset(
            f"pool:provider:{payload.provider}",
            mapping={
                "lastDeposit": payload.amount,
                "lastDepositShares": payload.shares,
                "lastDepositTx": payload.txHash,
                "lastActivityAt": datetime.utcnow().isoformat(),
            }
        )
        
        # Increment pool stats
        await redis.hincrby("pool:stats", "totalDeposits", 1)
        
        return {"status": "received", "provider": payload.provider}
        
    except Exception as e:
        logger.error(f"Error processing PoolDeposit webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pool-withdrawal")
async def pool_withdrawal_webhook(
    payload: PoolWithdrawalWebhook,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle pool withdrawal event from blockchain.
    """
    logger.info(f"💸 Received PoolWithdrawal webhook: {payload.provider[:10]}...")
    
    try:
        redis = await get_redis()
        
        await redis.hset(
            f"pool:provider:{payload.provider}",
            mapping={
                "lastWithdrawal": payload.amount,
                "lastWithdrawalShares": payload.shares,
                "lastWithdrawalTx": payload.txHash,
                "lastActivityAt": datetime.utcnow().isoformat(),
            }
        )
        
        await redis.hincrby("pool:stats", "totalWithdrawals", 1)
        
        return {"status": "received", "provider": payload.provider}
        
    except Exception as e:
        logger.error(f"Error processing PoolWithdrawal webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Background task functions
async def sync_policy_from_chain(
    policy_id: str,
    holder: str,
    premium: str,
    coverage: str,
    tx_hash: str,
):
    """Sync policy data from blockchain to database."""
    logger.info(f"Syncing policy #{policy_id} from chain...")
    # Implementation would update database
    pass


async def schedule_flight_monitoring(
    policy_id: str,
    flight_number: str,
    departure_time: int,
):
    """Schedule monitoring for flight status."""
    logger.info(f"Scheduling monitoring for flight {flight_number}")
    # Implementation would schedule Celery task
    pass


async def notify_claim_result(
    claim_id: str,
    approved: bool,
    payout: str,
):
    """Notify user about claim result."""
    logger.info(f"Notifying user about claim #{claim_id} result")
    # Implementation would send notification
    pass
