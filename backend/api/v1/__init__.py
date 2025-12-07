"""
AeroShield API v1
Main router aggregating all endpoints
"""

from fastapi import APIRouter

from api.v1.users import router as users_router
from api.v1.policies import router as policies_router
from api.v1.claims import router as claims_router
from api.v1.ai import router as ai_router
from api.v1.triggers import router as triggers_router
from api.v1.pool import router as pool_router
from api.v1.blockchain import router as blockchain_router
from api.v1.webhooks import router as webhooks_router

router = APIRouter()

# Include all sub-routers
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(policies_router, prefix="/policies", tags=["Policies"])
router.include_router(claims_router, prefix="/claims", tags=["Claims"])
router.include_router(ai_router, prefix="/ai", tags=["AI"])
router.include_router(triggers_router, prefix="/triggers", tags=["Triggers"])
router.include_router(pool_router, prefix="/pool", tags=["Pool"])
router.include_router(blockchain_router, prefix="/blockchain", tags=["Blockchain"])
router.include_router(webhooks_router, tags=["Webhooks"])

