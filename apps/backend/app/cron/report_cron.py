"""
Report Caching and Generation Cron Jobs
Pre-generates and caches frequently accessed reports
"""
import logging
from datetime import date
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)


class ReportCachingScheduler:
    """
    Manages report generation and caching
    """
    
    _scheduler = None
    
    @classmethod
    def initialize(cls, db_session_factory) -> None:
        """
        Initialize report caching scheduler
        
        Args:
            db_session_factory: SQLAlchemy session factory
        """
        if cls._scheduler is not None:
            logger.warning("Report caching scheduler already initialized")
            return
        
        cls._scheduler = BackgroundScheduler()
        cls.db_session_factory = db_session_factory
        logger.info("Report caching scheduler initialized")
    
    @classmethod
    def shutdown(cls) -> None:
        """Shutdown the scheduler"""
        if cls._scheduler and cls._scheduler.running:
            cls._scheduler.shutdown(wait=True)
            logger.info("Report caching scheduler shutdown")
    
    @staticmethod
    def invalidate_report_cache(report_type: str, **kwargs) -> None:
        """
        Invalidate cache for specific report
        
        Args:
            report_type: Type of report (impact, sales, regional, etc.)
            **kwargs: Cache key parameters
        """
        from app.utils.cache import get_report_cache
        
        cache = get_report_cache()
        cache.invalidate(report_type, **kwargs)
        logger.debug(f"Invalidated cache for {report_type}")
    
    @staticmethod
    def invalidate_all_report_caches() -> None:
        """Invalidate all report caches"""
        from app.utils.cache import get_report_cache
        
        cache = get_report_cache()
        cache.invalidate_all()
        logger.info("Invalidated all report caches")
    
    @staticmethod
    def get_cache_stats() -> dict:
        """Get report cache statistics"""
        from app.utils.cache import get_report_cache
        
        cache = get_report_cache()
        return cache.get_stats()


# Convenience functions for cache management
def clear_report_cache() -> None:
    """Clear all cached reports"""
    ReportCachingScheduler.invalidate_all_report_caches()


def clear_specific_cache(report_type: str, **kwargs) -> None:
    """Clear specific cached report"""
    ReportCachingScheduler.invalidate_report_cache(report_type, **kwargs)
