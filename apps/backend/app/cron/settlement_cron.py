"""
Cron/Scheduler Module
APScheduler setup for automated settlement, payout, and report generation
"""
import logging
from datetime import datetime, date
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)


class SettlementScheduler:
    """
    Manages automated settlement calculation and payout scheduling
    """
    
    _scheduler = None
    
    @classmethod
    def initialize(cls, db_session_factory) -> None:
        """
        Initialize the scheduler
        
        Args:
            db_session_factory: SQLAlchemy session factory
        """
        if cls._scheduler is not None:
            logger.warning("Scheduler already initialized")
            return
        
        cls._scheduler = BackgroundScheduler()
        cls.db_session_factory = db_session_factory
        
        try:
            # Weekly settlement calculation (Monday at 01:00 UTC)
            cls._scheduler.add_job(
                func=cls._calculate_settlements,
                trigger=CronTrigger(day_of_week=0, hour=1, minute=0),
                id="settlement_calculation",
                name="Weekly Settlement Calculation",
                replace_existing=True,
                misfire_grace_time=300,
            )
            
            # Daily payout processing (every day at 06:00 UTC)
            cls._scheduler.add_job(
                func=cls._process_payouts,
                trigger=CronTrigger(hour=6, minute=0),
                id="payout_processing",
                name="Daily Payout Processing",
                replace_existing=True,
                misfire_grace_time=300,
            )
            
            # Daily report generation (every day at 23:00 UTC)
            cls._scheduler.add_job(
                func=cls._generate_daily_reports,
                trigger=CronTrigger(hour=23, minute=0),
                id="report_generation",
                name="Daily Report Generation",
                replace_existing=True,
                misfire_grace_time=300,
            )
            
            # Daily subscription billing (every day at 09:00 UTC)
            cls._scheduler.add_job(
                func=cls._process_subscription_billing,
                trigger=CronTrigger(hour=9, minute=0),
                id="subscription_billing",
                name="Daily Subscription Billing",
                replace_existing=True,
                misfire_grace_time=300,
            )

            # ── E-Wallet jobs ────────────────────────────────────────────────
            # Daily: expire wallet allocations older than 90 days (01:30 UTC)
            cls._scheduler.add_job(
                func=cls._expire_wallet_allocations,
                trigger=CronTrigger(hour=1, minute=30),
                id="wallet_allocation_expiry",
                name="Daily Wallet Allocation Expiry",
                replace_existing=True,
                misfire_grace_time=300,
            )

            # Every 30 min: auto-cancel orders whose QR pickup expired (> 24h)
            cls._scheduler.add_job(
                func=cls._auto_cancel_expired_orders,
                trigger=CronTrigger(minute="*/30"),
                id="order_auto_cancel",
                name="Auto-Cancel Expired QR Orders",
                replace_existing=True,
                misfire_grace_time=120,
            )

            
            cls._scheduler.start()
            logger.info("Scheduler initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize scheduler: {e}")
            raise
    
    @classmethod
    def shutdown(cls) -> None:
        """Shutdown the scheduler gracefully"""
        if cls._scheduler and cls._scheduler.running:
            cls._scheduler.shutdown(wait=True)
            logger.info("Scheduler shutdown successfully")
    
    @staticmethod
    def _calculate_settlements() -> None:
        """Calculate settlements for all vendors (called by cron)"""
        from app.services.settlement_service import SettlementService
        from datetime import date, timedelta
        
        try:
            db = SettlementScheduler.db_session_factory()
            
            # Calculate for the past week
            today = date.today()
            start_date = today - timedelta(days=7)
            end_date = today
            
            settlements_count, total_amount = SettlementService.calculate_settlements(
                db,
                period_start=start_date,
                period_end=end_date,
            )
            
            logger.info(
                f"Settlement calculation completed: "
                f"{settlements_count} settlements created, "
                f"total amount: Rp {total_amount}"
            )
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error in settlement calculation: {e}", exc_info=True)
    
    @staticmethod
    def _process_payouts() -> None:
        """Process ready settlements for payout (called by cron)"""
        from app.models.nutrition import Settlement, SettlementStatusEnum
        
        try:
            db = SettlementScheduler.db_session_factory()
            
            # Get all settlements in "ready" status
            ready_settlements = (
                db.query(Settlement)
                .filter(Settlement.status == SettlementStatusEnum.ready)
                .all()
            )
            
            if not ready_settlements:
                logger.info("No ready settlements to process")
                db.close()
                return
            
            processed_count = 0
            total_amount = 0
            
            for settlement in ready_settlements:
                try:
                    # Mark as paid (in real system, would integrate with bank API)
                    settlement.status = SettlementStatusEnum.paid
                    settlement.payout_date = date.today()
                    settlement.bank_transfer_reference = f"AUTO-{settlement.id}-{datetime.now().timestamp()}"
                    
                    db.add(settlement)
                    processed_count += 1
                    total_amount += float(settlement.net_amount)
                    
                except Exception as e:
                    logger.error(f"Error processing settlement {settlement.id}: {e}")
                    db.rollback()
                    continue
            
            db.commit()
            
            logger.info(
                f"Payout processing completed: "
                f"{processed_count} settlements processed, "
                f"total: Rp {total_amount}"
            )
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error in payout processing: {e}", exc_info=True)
    
    @staticmethod
    def _generate_daily_reports() -> None:
        """Generate daily reports and cache them (called by cron)"""
        from app.services.report_generator import ReportGenerator
        from app.utils.cache import get_report_cache
        
        try:
            db = SettlementScheduler.db_session_factory()
            cache = get_report_cache()
            
            # Pre-generate regional report
            regional_report = ReportGenerator.generate_regional_report(db)
            cache.set("regional_report", regional_report, ttl_seconds=86400)
            
            logger.info("Daily regional report generated and cached")
            
            # Pre-generate demographics report
            demographics_report = ReportGenerator.generate_demographics_report(db)
            cache.set("demographics_report", demographics_report, ttl_seconds=86400)
            
            logger.info("Daily demographics report generated and cached")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error in daily report generation: {e}", exc_info=True)
    
    @staticmethod
    def _process_subscription_billing() -> None:
        """Process recurring billing for subscriptions due today (called by cron)"""
        from app.services.subscription_service import SubscriptionService
        
        try:
            db = SettlementScheduler.db_session_factory()
            
            # Get all active subscriptions due for billing
            due_subscriptions = SubscriptionService.get_due_subscriptions(db)
            
            logger.info(f"[SUBSCRIPTION_BILLING] Found {len(due_subscriptions)} subscriptions due for billing")
            
            processed = 0
            failed = 0
            
            for subscription in due_subscriptions:
                try:
                    result = SubscriptionService.process_billing(db, subscription)
                    
                    if result.get("success"):
                        processed += 1
                        logger.info(f"[SUBSCRIPTION_BILLING] Successfully processed subscription {subscription.id}")
                    else:
                        failed += 1
                        logger.warning(f"[SUBSCRIPTION_BILLING] Failed to process subscription {subscription.id}: {result.get('error')}")
                
                except Exception as e:
                    logger.error(f"[SUBSCRIPTION_BILLING] Error processing subscription {subscription.id}: {e}")
                    failed += 1
                    continue
            
            logger.info(f"[SUBSCRIPTION_BILLING] Completed: {processed} processed, {failed} failed")
            
            db.close()
            
        except Exception as e:
            logger.error(f"[SUBSCRIPTION_BILLING] Error in subscription billing: {e}", exc_info=True)
    
    @classmethod
    def get_jobs(cls) -> list:
        """Get list of scheduled jobs"""
        if cls._scheduler:
            return cls._scheduler.get_jobs()
        return []
    
    @classmethod
    def add_job(
        cls,
        func,
        trigger,
        job_id: str,
        name: str,
        **kwargs
    ) -> None:
        """
        Add a new job to the scheduler
        
        Args:
            func: Function to schedule
            trigger: APScheduler trigger
            job_id: Unique job ID
            name: Job name
            **kwargs: Additional APScheduler arguments
        """
        if cls._scheduler is None:
            raise RuntimeError("Scheduler not initialized")
        
        cls._scheduler.add_job(
            func=func,
            trigger=trigger,
            id=job_id,
            name=name,
            replace_existing=True,
            **kwargs
        )
        logger.info(f"Job added: {name}")
    
    @classmethod
    def pause_job(cls, job_id: str) -> None:
        """Pause a scheduled job"""
        if cls._scheduler:
            cls._scheduler.pause_job(job_id)
            logger.info(f"Job paused: {job_id}")
    
    @classmethod
    def resume_job(cls, job_id: str) -> None:
        """Resume a paused job"""
        if cls._scheduler:
            cls._scheduler.resume_job(job_id)
            logger.info(f"Job resumed: {job_id}")
    
    @classmethod
    def remove_job(cls, job_id: str) -> None:
        """Remove a scheduled job"""
        if cls._scheduler:
            cls._scheduler.remove_job(job_id)
            logger.info(f"Job removed: {job_id}")

    # ── E-Wallet Cron Methods ─────────────────────────────────────────────────
    @staticmethod
    def _expire_wallet_allocations() -> None:
        """Daily: expire WalletAllocations past their expires_at date."""
        from app.services.wallet_service import WalletService
        try:
            db = SettlementScheduler.db_session_factory()
            result = WalletService.expire_allocations(db)
            logger.info("[WALLET_EXPIRY] %s", result)
            db.close()
        except Exception as e:
            logger.error("[WALLET_EXPIRY] Error: %s", e, exc_info=True)

    @staticmethod
    def _auto_cancel_expired_orders() -> None:
        """Every 30 min: auto-cancel orders whose QR pickup has expired (> 24h)."""
        from app.models.product import Order, OrderStatusEnum
        from app.services.wallet_service import WalletService
        from datetime import datetime
        from sqlalchemy.orm import joinedload
        try:
            db = SettlementScheduler.db_session_factory()
            now_dt = datetime.utcnow()

            # Find pending orders with expired QR
            expired_orders = (
                db.query(Order)
                .options(
                    joinedload(Order.beneficiary_profile),
                    joinedload(Order.vendor_profile),
                    joinedload(Order.items),
                )
                .filter(
                    Order.status == OrderStatusEnum.pending,
                    Order.pickup_expires_at is not None,
                    Order.pickup_expires_at < now_dt,
                    Order.is_active,
                )
                .all()
            )

            cancelled_count = 0
            for order in expired_orders:
                try:
                    # Restore stock
                    for item in order.items:
                        from app.models.product import Product
                        product = db.query(Product).filter(Product.id == item.product_id).first()
                        if product:
                            product.stock_quantity += item.quantity
                    # Refund hold
                    WalletService.refund_hold(db, order)
                    order.status = OrderStatusEnum.cancelled
                    cancelled_count += 1
                except Exception as inner_e:
                    logger.error("[ORDER_AUTO_CANCEL] Failed for order %s: %s", order.id, inner_e)

            if cancelled_count:
                db.commit()
                logger.info("[ORDER_AUTO_CANCEL] Auto-cancelled %s expired orders", cancelled_count)
            db.close()
        except Exception as e:
            logger.error("[ORDER_AUTO_CANCEL] Error: %s", e, exc_info=True)

