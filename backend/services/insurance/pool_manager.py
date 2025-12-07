"""
AeroShield Insurance Pool Manager
Manages the insurance liquidity pool
"""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import InsufficientFundsError
from core.logging import get_logger
from models.pool import InsurancePool, PoolTransaction, PoolTransactionType
from services.blockchain.ftso_client import ftso_client

logger = get_logger(__name__)


class PoolManager:
    """Manages the AeroShield insurance pool."""
    
    def __init__(self):
        self.default_pool_name = "AeroShield Main Pool"
        self.default_symbol = "asUSDT"
        self.min_collateralization_ratio = Decimal("150.0")  # 150%
    
    async def get_or_create_pool(
        self,
        db: AsyncSession,
        contract_address: str
    ) -> InsurancePool:
        """Get existing pool or create a new one."""
        # Try to get existing pool
        result = await db.execute(
            select(InsurancePool).where(
                InsurancePool.contract_address == contract_address
            )
        )
        pool = result.scalar_one_or_none()
        
        if pool:
            return pool
        
        # Create new pool
        pool = InsurancePool(
            name=self.default_pool_name,
            symbol=self.default_symbol,
            contract_address=contract_address,
            is_active=True,
            total_value_locked=Decimal("0"),
            collateralization_ratio=self.min_collateralization_ratio
        )
        
        db.add(pool)
        await db.flush()
        
        logger.info("Created insurance pool", pool_id=str(pool.id))
        return pool
    
    async def get_pool_stats(self, db: AsyncSession, pool_id: UUID) -> dict:
        """Get comprehensive pool statistics."""
        result = await db.execute(
            select(InsurancePool).where(InsurancePool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        
        if not pool:
            return None
        
        # Calculate utilization
        available = pool.total_value_locked - pool.total_payouts_made
        pending_obligations = pool.total_premiums_collected - pool.total_payouts_made
        
        utilization_rate = Decimal("0")
        if pool.total_value_locked > 0:
            utilization_rate = (pending_obligations / pool.total_value_locked) * 100
        
        return {
            "pool_id": str(pool.id),
            "name": pool.name,
            "symbol": pool.symbol,
            "total_value_locked": float(pool.total_value_locked),
            "total_premiums_collected": float(pool.total_premiums_collected),
            "total_payouts_made": float(pool.total_payouts_made),
            "stablecoin_reserve": float(pool.stablecoin_reserve),
            "fasset_reserve": float(pool.fasset_reserve),
            "collateralization_ratio": float(pool.collateralization_ratio),
            "total_policies_issued": pool.total_policies_issued,
            "total_claims_paid": pool.total_claims_paid,
            "average_payout_time_seconds": pool.average_payout_time_seconds,
            "lp_apy": float(pool.lp_apy) if pool.lp_apy else None,
            "utilization_rate": float(utilization_rate),
            "available_for_claims": float(available),
            "is_active": pool.is_active
        }
    
    async def deposit_premium(
        self,
        db: AsyncSession,
        pool_id: UUID,
        amount: Decimal,
        policy_id: UUID,
        user_id: UUID,
        tx_hash: str,
        block_number: int,
        from_address: str
    ) -> PoolTransaction:
        """Record a premium deposit to the pool."""
        # Get pool
        result = await db.execute(
            select(InsurancePool).where(InsurancePool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        
        if not pool:
            raise ValueError(f"Pool {pool_id} not found")
        
        # Update pool totals
        pool.total_value_locked += amount
        pool.total_premiums_collected += amount
        pool.stablecoin_reserve += amount
        pool.total_policies_issued += 1
        
        # Create transaction record
        transaction = PoolTransaction(
            pool_id=pool_id,
            transaction_type=PoolTransactionType.PREMIUM_DEPOSIT,
            amount=amount,
            currency="USDT",
            tx_hash=tx_hash,
            block_number=block_number,
            from_address=from_address,
            to_address=pool.contract_address,
            user_id=user_id,
            policy_id=policy_id,
            description=f"Premium payment for policy {policy_id}"
        )
        
        db.add(transaction)
        await db.flush()
        
        logger.info(
            "Premium deposited",
            pool_id=str(pool_id),
            amount=str(amount),
            policy_id=str(policy_id)
        )
        
        return transaction
    
    async def process_payout(
        self,
        db: AsyncSession,
        pool_id: UUID,
        amount: Decimal,
        claim_id: UUID,
        user_id: UUID,
        to_address: str
    ) -> dict:
        """Process a claim payout from the pool."""
        # Get pool
        result = await db.execute(
            select(InsurancePool).where(InsurancePool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        
        if not pool:
            raise ValueError(f"Pool {pool_id} not found")
        
        # Check sufficient funds
        available = pool.stablecoin_reserve
        if amount > available:
            raise InsufficientFundsError(
                required=float(amount),
                available=float(available)
            )
        
        # Update pool totals
        pool.stablecoin_reserve -= amount
        pool.total_value_locked -= amount
        pool.total_payouts_made += amount
        pool.total_claims_paid += 1
        
        # For now, return payout info (actual blockchain tx would be separate)
        payout_info = {
            "pool_id": str(pool_id),
            "claim_id": str(claim_id),
            "amount": float(amount),
            "currency": "USDT",
            "to_address": to_address,
            "status": "pending_tx"
        }
        
        logger.info(
            "Payout processed",
            pool_id=str(pool_id),
            amount=str(amount),
            claim_id=str(claim_id)
        )
        
        return payout_info
    
    async def record_payout_transaction(
        self,
        db: AsyncSession,
        pool_id: UUID,
        amount: Decimal,
        claim_id: UUID,
        user_id: UUID,
        tx_hash: str,
        block_number: int,
        to_address: str
    ) -> PoolTransaction:
        """Record a completed payout transaction."""
        result = await db.execute(
            select(InsurancePool).where(InsurancePool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        
        transaction = PoolTransaction(
            pool_id=pool_id,
            transaction_type=PoolTransactionType.PAYOUT,
            amount=amount,
            currency="USDT",
            tx_hash=tx_hash,
            block_number=block_number,
            from_address=pool.contract_address if pool else "",
            to_address=to_address,
            user_id=user_id,
            claim_id=claim_id,
            description=f"Claim payout for claim {claim_id}"
        )
        
        db.add(transaction)
        await db.flush()
        
        return transaction
    
    async def check_pool_health(self, db: AsyncSession, pool_id: UUID) -> dict:
        """Check the health of the pool."""
        stats = await self.get_pool_stats(db, pool_id)
        
        if not stats:
            return {"healthy": False, "error": "Pool not found"}
        
        warnings = []
        
        # Check collateralization
        if stats["collateralization_ratio"] < float(self.min_collateralization_ratio):
            warnings.append(f"Collateralization below minimum ({self.min_collateralization_ratio}%)")
        
        # Check utilization
        if stats["utilization_rate"] > 80:
            warnings.append(f"High utilization rate ({stats['utilization_rate']:.1f}%)")
        
        # Check reserves
        if stats["stablecoin_reserve"] < 10000:  # Less than $10k
            warnings.append("Low stablecoin reserves")
        
        is_healthy = len(warnings) == 0
        
        risk_level = "low"
        if len(warnings) >= 2:
            risk_level = "high"
        elif len(warnings) == 1:
            risk_level = "medium"
        
        return {
            "is_healthy": is_healthy,
            "collateralization_ratio": stats["collateralization_ratio"],
            "minimum_ratio": float(self.min_collateralization_ratio),
            "available_for_claims": stats["available_for_claims"],
            "pending_claims_value": 0,  # Would track from claims table
            "utilization_rate": stats["utilization_rate"],
            "risk_level": risk_level,
            "warnings": warnings
        }
    
    async def get_tvl_in_usd(self, db: AsyncSession, pool_id: UUID) -> Decimal:
        """Get Total Value Locked in USD terms."""
        result = await db.execute(
            select(InsurancePool).where(InsurancePool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        
        if not pool:
            return Decimal("0")
        
        # Stablecoin is already USD
        tvl = pool.stablecoin_reserve
        
        # Convert FAsset reserve if any
        if pool.fasset_reserve > 0:
            try:
                xrp_price = await ftso_client.get_xrp_usd()
                tvl += pool.fasset_reserve * xrp_price
            except Exception:
                pass  # Skip if price unavailable
        
        return tvl


# Singleton instance
pool_manager = PoolManager()
