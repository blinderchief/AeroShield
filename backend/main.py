"""
AeroShield Backend - AI-Augmented Parametric Travel Insurance on Flare
Main application entry point with FastAPI
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse
from prometheus_client import make_asgi_app

from core.config import settings
from core.database import init_db, close_db
from core.logging import setup_logging
from api.v1 import router as api_v1_router

# Setup structured logging
setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting AeroShield Backend", version=settings.VERSION)
    await init_db()
    logger.info("Database initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AeroShield Backend")
    await close_db()
    logger.info("Database connections closed")


# Create FastAPI application
app = FastAPI(
    title="AeroShield API",
    description="""
    🛡️ **AeroShield** - AI-Augmented Parametric Travel Insurance on Flare Network
    
    ## Features
    - 🎫 **Instant Policy Purchase** - Buy travel insurance in seconds
    - 🤖 **AI-Powered Risk Assessment** - Gemini-powered delay predictions
    - ⛓️ **Blockchain Verified** - FDC attestations for trustless payouts
    - 💨 **Gasless Transactions** - Flare Smart Accounts for seamless UX
    - 💰 **Automatic Payouts** - Triggered by verified flight delays
    
    ## Flare Integration
    - **FDC** - Flare Data Connector for off-chain data verification
    - **FTSO** - Time Series Oracle for real-time pricing
    - **Smart Accounts** - Gasless XRPL → Flare interactions
    - **FAssets** - Cross-chain asset bridging
    """,
    version=settings.VERSION,
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip Middleware for compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include API routers
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API information."""
    return {
        "name": "AeroShield API",
        "version": settings.VERSION,
        "status": "operational",
        "message": "🛡️ AI-Augmented Parametric Travel Insurance on Flare",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to all responses for tracing."""
    import uuid
    request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
    )
