"""
AeroShield Configuration Management
Centralized settings using Pydantic Settings
"""

from functools import lru_cache
from typing import List, Union

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # Application
    APP_NAME: str = "AeroShield"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", alias="ENV")
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # CORS - stored as comma-separated string
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000,https://aeroshield.vercel.app"
    )
    
    @computed_field
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS into a list."""
        if not self.CORS_ORIGINS:
            return ["http://localhost:3000"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    # Database - Neon PostgreSQL
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/aeroshield",
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Clerk Authentication
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_JWT_ISSUER: str = ""
    
    # Flare Network Configuration
    FLARE_RPC_URL: str = "https://coston2-api.flare.network/ext/C/rpc"
    FLARE_CHAIN_ID: int = 114  # Coston2 Testnet
    FLARE_EXPLORER_URL: str = "https://coston2-explorer.flare.network"
    
    # Flare Contract Addresses (Coston2 Testnet)
    FLARE_FDC_HUB_ADDRESS: str = "0xF9e57EC0c8a1462dd6b7e1a3C8a3B5c2D8d3e4F5"
    FLARE_FTSO_V2_ADDRESS: str = "0xA1b2C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8A9B0"
    FLARE_REGISTRY_ADDRESS: str = "0x1234567890AbCdEf1234567890AbCdEf12345678"
    
    # AeroShield Contract Addresses
    AEROSHIELD_POOL_ADDRESS: str = ""
    AEROSHIELD_POLICY_MANAGER_ADDRESS: str = ""
    
    # Wallet Configuration
    OPERATOR_PRIVATE_KEY: str = ""
    OPERATOR_ADDRESS: str = ""
    
    # Google Gemini AI
    GOOGLE_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GEMINI_TEMPERATURE: float = 0.3
    GEMINI_MAX_TOKENS: int = 2048
    
    # Flight Data APIs
    FLIGHTSTATS_APP_ID: str = ""
    FLIGHTSTATS_APP_KEY: str = ""
    AVIATIONSTACK_API_KEY: str = ""
    
    # External APIs
    WEATHER_API_KEY: str = ""
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Sentry Error Tracking
    SENTRY_DSN: str = ""
    
    @computed_field
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @computed_field
    @property
    def flare_network_name(self) -> str:
        chain_names = {
            14: "Flare Mainnet",
            114: "Coston2 Testnet",
            19: "Songbird",
            16: "Coston",
        }
        return chain_names.get(self.FLARE_CHAIN_ID, f"Unknown ({self.FLARE_CHAIN_ID})")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
