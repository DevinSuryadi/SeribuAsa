"""
Settlement Service
Business logic for settlement management
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional, List, Dict, Any
from decimal import Decimal
import logging

from app.models.nutrition import Settlement, SettlementStatusEnum
from app.models.product import Order, OrderStatusEnum
from app.models.donation import VoucherRedemption
from app.models.user import VendorProfile
from app.schemas.settlement import SettlementQueryParams

logger = logging.getLogger(__name__)

ADMIN_FEE_PERCENTAGE = Decimal("0.01")  # 1%


class SettlementService:
    @staticmethod
    def get_settlements(
        db: Session,
        vendor_id: str,
        is_admin: bool,
        params: SettlementQueryParams,
    ) -> List[Settlement]:
        query = db.query(Settlement).filter(Settlement.is_active)

        if not is_admin:
            query = query.filter(Settlement.vendor_id == vendor_id)

        if params.status:
            query = query.filter(Settlement.status == params.status)
        if params.start_date:
            query = query.filter(Settlement.period_end >= params.start_date)
        if params.end_date:
            query = query.filter(Settlement.period_start <= params.end_date)

        return query.order_by(Settlement.period_end.desc()).all()

    @staticmethod
    def get_settlements_count(
        db: Session,
        vendor_id: str,
        is_admin: bool,
        params: SettlementQueryParams,
    ) -> int:
        query = db.query(Settlement).filter(Settlement.is_active)

        if not is_admin:
            query = query.filter(Settlement.vendor_id == vendor_id)
        if params.status:
            query = query.filter(Settlement.status == params.status)
        if params.start_date:
            query = query.filter(Settlement.period_end >= params.start_date)
        if params.end_date:
            query = query.filter(Settlement.period_start <= params.end_date)

        return query.count()

    @staticmethod
    def get_settlement_by_id(db: Session, settlement_id: str, vendor_id: str, is_admin: bool) -> Optional[Settlement]:
        query = db.query(Settlement).filter(
            Settlement.id == settlement_id,
            Settlement.is_active,
        )

        if not is_admin:
            query = query.filter(Settlement.vendor_id == vendor_id)

        return query.first()

    @staticmethod
    def calculate_settlements(
        db: Session,
        period_start: date,
        period_end: date,
        vendor_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Calculate settlements for vendors in a given period"""
        query = db.query(VendorProfile).filter(
            VendorProfile.settlement_status == "active",
            VendorProfile.is_active,
        )

        if vendor_id:
            query = query.filter(VendorProfile.user_id == vendor_id)

        vendors = query.all()
        settlements_created = 0
        total_amount = Decimal("0")

        for vendor in vendors:
            # Calculate total redemptions for period
            redemptions = (
                db.query(func.sum(VoucherRedemption.amount))
                .join(Order, VoucherRedemption.order_id == Order.id)
                .filter(
                    Order.vendor_id == vendor.user_id,
                    Order.status == OrderStatusEnum.completed,
                    Order.created_at >= period_start,
                    Order.created_at <= period_end,
                )
                .scalar()
            )

            total_redemptions = redemptions or Decimal("0")
            if total_redemptions == 0:
                continue

            admin_fee = total_redemptions * ADMIN_FEE_PERCENTAGE
            net_amount = total_redemptions - admin_fee

            settlement = Settlement(
                vendor_id=vendor.user_id,
                period_start=period_start,
                period_end=period_end,
                total_redemptions=total_redemptions,
                admin_fee=admin_fee,
                net_amount=net_amount,
                status=SettlementStatusEnum.ready,
            )
            db.add(settlement)
            
            # Update vendor wallet balance
            vendor.wallet_balance += net_amount
            db.add(vendor)
            
            settlements_created += 1
            total_amount += net_amount

        db.commit()
        logger.info(f"Created {settlements_created} settlements, total: {total_amount}")
        return {
            "settlements_created": settlements_created,
            "total_amount": total_amount,
        }

    @staticmethod
    def get_settlement_breakdown(db: Session, settlement: Settlement) -> List[Dict[str, Any]]:
        """Get daily breakdown for a settlement period"""
        results = (
            db.query(
                func.date(Order.created_at).label("date"),
                func.count(Order.id).label("orders_count"),
                func.sum(VoucherRedemption.amount).label("redemptions_amount"),
            )
            .join(VoucherRedemption, VoucherRedemption.order_id == Order.id)
            .filter(
                Order.vendor_id == settlement.vendor_id,
                Order.status == OrderStatusEnum.completed,
                Order.created_at >= settlement.period_start,
                Order.created_at <= settlement.period_end,
            )
            .group_by(func.date(Order.created_at))
            .all()
        )

        return [
            {
                "date": str(r.date),
                "orders_count": r.orders_count,
                "redemptions_amount": float(r.redemptions_amount),
            }
            for r in results
        ]
