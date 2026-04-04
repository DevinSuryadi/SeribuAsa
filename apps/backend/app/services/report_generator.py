"""
Report Generator Service
Generates analytics reports for donors, vendors, and government
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional
import logging

from app.models.donation import Donation, DonationStatusEnum, Voucher
from app.models.product import Order, OrderItem, Product
from app.models.user import BeneficiaryProfile, VendorProfile, Child
from app.models.nutrition import FIESSurvey, NutritionMeasurement

logger = logging.getLogger(__name__)


class ReportGenerator:
    @staticmethod
    def generate_impact_report(
        db: Session,
        donor_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Generate impact report for donor"""
        query = db.query(Donation).filter(
            Donation.donor_id == donor_id,
            Donation.status == DonationStatusEnum.success,
        )

        if start_date:
            query = query.filter(Donation.created_at >= start_date)
        if end_date:
            query = query.filter(Donation.created_at <= end_date)

        donations = query.all()
        total_donated = sum(d.amount for d in donations) if donations else Decimal("0")

        children_helped = len(set(d.recipient_id for d in donations if d.recipient_id))
        vouchers_allocated = (
            db.query(func.count(Voucher.id))
            .join(Donation, Voucher.donation_id == Donation.id)
            .filter(Donation.donor_id == donor_id)
            .scalar()
        ) or 0

        return {
            "donor_id": donor_id,
            "period": {
                "start": start_date or (date.today() - timedelta(days=90)),
                "end": end_date or date.today(),
            },
            "summary": {
                "total_donated": total_donated,
                "total_children_helped": children_helped,
                "total_vouchers_allocated": vouchers_allocated,
                "total_families_impacted": children_helped,
            },
            "donation_trend": [],
            "geographic_distribution": [],
        }

    @staticmethod
    def generate_sales_report(
        db: Session,
        vendor_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Generate sales report for vendor"""
        query = db.query(Order).filter(
            Order.vendor_id == vendor_id,
            Order.is_active,
        )

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        orders = query.all()
        total_sales = sum(o.total_amount for o in orders) if orders else Decimal("0")
        total_voucher = sum(o.voucher_used for o in orders) if orders else Decimal("0")
        total_cash = sum(o.cash_paid for o in orders) if orders else Decimal("0")

        # Top products
        top_products = (
            db.query(
                Product.name,
                func.sum(OrderItem.quantity).label("qty"),
                func.sum(OrderItem.subtotal).label("revenue"),
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.vendor_id == vendor_id)
            .group_by(Product.name)
            .order_by(func.sum(OrderItem.subtotal).desc())
            .limit(10)
            .all()
        )

        return {
            "vendor_id": vendor_id,
            "period": {
                "start": start_date or (date.today() - timedelta(days=30)),
                "end": end_date or date.today(),
            },
            "summary": {
                "total_orders": len(orders),
                "total_sales": total_sales,
                "total_voucher_redemptions": total_voucher,
                "total_cash_received": total_cash,
                "pending_settlement": Decimal("0"),
                "paid_settlement": Decimal("0"),
            },
            "daily_sales": [],
            "top_products": [
                {
                    "product_name": p.name,
                    "quantity_sold": int(p.qty),
                    "revenue": float(p.revenue),
                }
                for p in top_products
            ],
        }

    @staticmethod
    def generate_regional_report(
        db: Session,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Generate regional analytics for government"""
        total_beneficiaries = db.query(func.count(BeneficiaryProfile.id)).scalar() or 0
        total_children = db.query(func.count(Child.id)).scalar() or 0
        total_vendors = db.query(func.count(VendorProfile.id)).scalar() or 0

        return {
            "region": "National",
            "period": {
                "start": start_date or (date.today() - timedelta(days=90)),
                "end": end_date or date.today(),
            },
            "coverage": {
                "total_beneficiaries": total_beneficiaries,
                "total_children": total_children,
                "total_vendors": total_vendors,
                "districts_covered": 0,
            },
            "stunting_rate": {
                "current": 0.0,
                "previous": 0.0,
                "change_percentage": 0.0,
                "trend": "stable",
            },
            "budget_utilization": {
                "allocated": Decimal("0"),
                "utilized": Decimal("0"),
                "percentage": 0.0,
            },
            "district_breakdown": [],
        }

    @staticmethod
    def generate_demographics_report(db: Session) -> Dict[str, Any]:
        """Generate demographic breakdown"""
        db.query(func.count(Child.id)).scalar() or 0
        db.query(func.count(FIESSurvey.id)).scalar() or 0
        db.query(func.count(NutritionMeasurement.id)).scalar() or 0

        return {
            "age_distribution": [],
            "gender_distribution": [],
            "nutrition_status": [],
            "fies_classification": [],
        }
