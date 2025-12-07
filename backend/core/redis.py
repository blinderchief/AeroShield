"""
AeroShield Redis Configuration
Caching and rate limiting
"""

from typing import Optional

import redis.asyncio as redis
from redis.asyncio import Redis

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

# Global Redis connection
_redis_client: Optional[Redis] = None


async def get_redis() -> Redis:
    """Get Redis client instance."""
    global _redis_client
    
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        logger.info("Redis connection established")
    
    return _redis_client


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client
    
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")


class CacheManager:
    """Redis-based cache manager."""
    
    def __init__(self, prefix: str = "aeroshield"):
        self.prefix = prefix
    
    def _make_key(self, key: str) -> str:
        """Create prefixed cache key."""
        return f"{self.prefix}:{key}"
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        client = await get_redis()
        return await client.get(self._make_key(key))
    
    async def set(
        self,
        key: str,
        value: str,
        expire: int = 300,  # 5 minutes default
    ) -> None:
        """Set value in cache with expiration."""
        client = await get_redis()
        await client.set(self._make_key(key), value, ex=expire)
    
    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        client = await get_redis()
        await client.delete(self._make_key(key))
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        client = await get_redis()
        return bool(await client.exists(self._make_key(key)))


# Global cache manager instance
cache = CacheManager()
