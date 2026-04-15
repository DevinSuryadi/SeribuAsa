"""
In-memory Cache Utility
Simple cache with TTL support for expensive queries
"""
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ReportCache:
    """In-memory cache for reports with TTL support"""
    
    def __init__(self, default_ttl_seconds: int = 86400):
        """
        Initialize cache
        
        Args:
            default_ttl_seconds: Default time-to-live in seconds (default: 24 hours)
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds
    
    def _generate_key(self, report_type: str, **kwargs) -> str:
        """Generate cache key from report type and parameters"""
        params_str = "_".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return f"{report_type}:{params_str}" if params_str else report_type
    
    def get(self, report_type: str, **kwargs) -> Optional[Any]:
        """
        Get value from cache if it exists and hasn't expired
        
        Args:
            report_type: Type of report
            **kwargs: Cache key parameters
        
        Returns:
            Cached value or None if expired/not found
        """
        key = self._generate_key(report_type, **kwargs)
        
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if datetime.utcnow() > entry["expires_at"]:
            del self._cache[key]
            logger.debug(f"Cache key {key} expired")
            return None
        
        logger.debug(f"Cache hit for {key}")
        return entry["value"]
    
    def set(
        self,
        report_type: str,
        value: Any,
        ttl_seconds: Optional[int] = None,
        **kwargs
    ) -> None:
        """
        Set value in cache with TTL
        
        Args:
            report_type: Type of report
            value: Value to cache
            ttl_seconds: Time-to-live in seconds (uses default if None)
            **kwargs: Cache key parameters
        """
        key = self._generate_key(report_type, **kwargs)
        ttl = ttl_seconds or self.default_ttl
        
        self._cache[key] = {
            "value": value,
            "expires_at": datetime.utcnow() + timedelta(seconds=ttl),
            "created_at": datetime.utcnow(),
        }
        
        logger.debug(f"Cached {key} with TTL {ttl}s")
    
    def invalidate(self, report_type: str, **kwargs) -> bool:
        """
        Invalidate cache entry
        
        Args:
            report_type: Type of report
            **kwargs: Cache key parameters
        
        Returns:
            True if entry was removed, False if not found
        """
        key = self._generate_key(report_type, **kwargs)
        
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Invalidated cache key {key}")
            return True
        
        return False
    
    def invalidate_all(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
        logger.debug("Cleared all cache")
    
    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all cache entries matching pattern
        
        Args:
            pattern: Pattern to match (e.g., "impact_report:*")
        
        Returns:
            Number of entries removed
        """
        import fnmatch
        
        keys_to_remove = [k for k in self._cache.keys() if fnmatch.fnmatch(k, pattern)]
        for key in keys_to_remove:
            del self._cache[key]
        
        if keys_to_remove:
            logger.debug(f"Invalidated {len(keys_to_remove)} cache entries matching {pattern}")
        
        return len(keys_to_remove)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_entries = len(self._cache)
        expired_entries = sum(
            1 for entry in self._cache.values()
            if datetime.utcnow() > entry["expires_at"]
        )
        
        return {
            "total_entries": total_entries,
            "expired_entries": expired_entries,
            "active_entries": total_entries - expired_entries,
        }


# Global cache instance
_cache_instance = None


def get_report_cache() -> ReportCache:
    """Get or create global report cache instance"""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = ReportCache()
    return _cache_instance
