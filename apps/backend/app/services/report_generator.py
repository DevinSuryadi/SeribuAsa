"""
Report Generator Service
Generates analytics reports for donors, vendors, and government
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, timedelta, datetime
from decimal import Decimal
from typing import Dict, Any, Optional, List
import logging

from app.models.donation import Donation, DonationStatusEnum, Voucher
from app.models.product import Order, OrderItem, Product
from app.models.user import BeneficiaryProfile, VendorProfile, Child
from app.models.nutrition import FIESSurvey, NutritionMeasurement, Settlement

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

        # Donation trend (monthly)
        trend_data = (
            db.query(
                func.to_date(func.concat(extract("year", Donation.created_at), "-", extract("month", Donation.created_at), "-01"), "YYYY-MM-DD").label("month"),
                func.sum(Donation.amount).label("total"),
            )
            .filter(
                Donation.donor_id == donor_id,
                Donation.status == DonationStatusEnum.success,
            )
            .group_by(
                extract("year", Donation.created_at),
                extract("month", Donation.created_at),
            )
            .order_by(extract("year", Donation.created_at), extract("month", Donation.created_at))
            .all()
        )
        donation_trend = [
            {"month": str(t.month.strftime("%Y-%m")), "total": float(t.total or 0)}
            for t in trend_data
        ]

        # Geographic distribution by province
        geo_data = (
            db.query(
                BeneficiaryProfile.province,
                func.count(Donation.id).label("donation_count"),
                func.sum(Donation.amount).label("total_amount"),
            )
            .join(Donation, Donation.recipient_id == BeneficiaryProfile.user_id)
            .filter(
                Donation.donor_id == donor_id,
                Donation.status == DonationStatusEnum.success,
            )
            .group_by(BeneficiaryProfile.province)
            .order_by(func.sum(Donation.amount).desc())
            .limit(10)
            .all()
        )
        geographic_distribution = [
            {
                "province": g.province or "Unknown",
                "donation_count": g.donation_count,
                "total_amount": float(g.total_amount or 0),
            }
            for g in geo_data
        ]

        return {
            "donor_id": donor_id,
            "period": {
                "start_date": start_date or (date.today() - timedelta(days=90)),
                "end_date": end_date or date.today(),
            },
            "summary": {
                "total_donated": total_donated,
                "total_children_helped": children_helped,
                "total_vouchers_allocated": vouchers_allocated,
                "total_families_impacted": children_helped,
            },
            "donation_trend": donation_trend,
            "geographic_distribution": geographic_distribution,
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

        # Daily sales breakdown
        daily_data = (
            db.query(
                func.date(Order.created_at).label("date"),
                func.count(Order.id).label("order_count"),
                func.sum(Order.total_amount).label("total"),
            )
            .filter(Order.vendor_id == vendor_id, Order.is_active)
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at).desc())
            .limit(30)
            .all()
        )
        daily_sales = [
            {
                "date": str(d.date),
                "order_count": d.order_count,
                "total": float(d.total or 0),
            }
            for d in daily_data
        ]

        return {
            "vendor_id": vendor_id,
            "period": {
                "start_date": start_date or (date.today() - timedelta(days=30)),
                "end_date": end_date or date.today(),
            },
            "summary": {
                "total_orders": len(orders),
                "total_sales": total_sales,
                "total_voucher_redemptions": total_voucher,
                "total_cash_received": total_cash,
                "pending_settlement": Decimal("0"),
                "paid_settlement": Decimal("0"),
            },
            "daily_sales": daily_sales,
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
                "start_date": start_date or (date.today() - timedelta(days=90)),
                "end_date": end_date or date.today(),
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
        # Age distribution
        age_bins = [(0, 5), (5, 10), (10, 15), (15, 18)]
        age_dist = []
        for min_age, max_age in age_bins:
            count = (
                db.query(func.count(Child.id))
                .filter(
                    Child.date_of_birth.isnot(None),
                    func.extract("year", func.now()) - func.extract("year", Child.date_of_birth) >= min_age,
                    func.extract("year", func.now()) - func.extract("year", Child.date_of_birth) < max_age,
                )
                .scalar() or 0
            )
            age_dist.append({"range": f"{min_age}-{max_age}", "count": count})

        # Gender distribution
        gender_dist = (
            db.query(
                Child.gender,
                func.count(Child.id).label("count"),
            )
            .filter(Child.gender.isnot(None))
            .group_by(Child.gender)
            .all()
        )
        gender_distribution = [
            {"gender": g.gender or "Unknown", "count": g.count}
            for g in gender_dist
        ]

        # Nutrition status distribution
        latest_measurements = (
            db.query(
                NutritionMeasurement.classification,
                func.count(NutritionMeasurement.id).label("count"),
            )
            .filter(
                NutritionMeasurement.classification.isnot(None),
                NutritionMeasurement.measurement_date == (
                    db.query(func.max(NutritionMeasurement.measurement_date))
                    .filter(NutritionMeasurement.child_id == NutritionMeasurement.child_id)
                    .correlate(NutritionMeasurement)
                    .scalar_subquery()
                ),
            )
            .group_by(NutritionMeasurement.classification)
            .all()
        )
        nutrition_status = [
            {"status": n.classification or "Unknown", "count": n.count}
            for n in latest_measurements
        ]

        # FIES classification
        fies_dist = (
            db.query(
                FIESSurvey.classification,
                func.count(FIESSurvey.id).label("count"),
            )
            .filter(
                FIESSurvey.classification.isnot(None),
                FIESSurvey.survey_date == (
                    db.query(func.max(FIESSurvey.survey_date))
                    .filter(FIESSurvey.beneficiary_id == FIESSurvey.beneficiary_id)
                    .correlate(FIESSurvey)
                    .scalar_subquery()
                ),
            )
            .group_by(FIESSurvey.classification)
            .all()
        )
        fies_classification = [
            {"classification": f.classification or "Unknown", "count": f.count}
            for f in fies_dist
        ]

        return {
            "age_distribution": age_dist,
            "gender_distribution": gender_distribution,
            "nutrition_status": nutrition_status,
            "fies_classification": fies_classification,
        }

    @staticmethod
    def generate_settlement_report(
        db: Session,
        vendor_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Generate settlement report for vendor"""
        query = db.query(Settlement).filter(Settlement.vendor_id == vendor_id)

        if start_date:
            query = query.filter(Settlement.period_end >= start_date)
        if end_date:
            query = query.filter(Settlement.period_start <= end_date)

        settlements = query.order_by(Settlement.period_start).all()

        # Calculate summary metrics
        total_revenue = sum(s.total_redemptions for s in settlements) if settlements else Decimal("0")
        settled_amount = sum(
            s.net_amount for s in settlements if s.status in ["paid", "ready"]
        ) if settlements else Decimal("0")
        pending_amount = sum(
            s.net_amount for s in settlements if s.status in ["calculating", "pending"]
        ) if settlements else Decimal("0")
        pending_count = len([s for s in settlements if s.status in ["calculating", "pending"]])
        
        # Calculate average settlement time (days from period_end to payout_date)
        settlement_times = []
        for s in settlements:
            if s.payout_date and s.status == "paid":
                days = (s.payout_date - s.period_end).days
                settlement_times.append(days)
        
        average_settlement_days = (
            sum(settlement_times) / len(settlement_times)
            if settlement_times
            else 0.0
        )

        # Calculate trends
        paid_settlements = [s for s in settlements if s.status == "paid"]
        month_over_month_growth = 0.0
        if len(paid_settlements) >= 2:
            first_month = sum(s.net_amount for s in paid_settlements[:len(paid_settlements)//2])
            second_month = sum(s.net_amount for s in paid_settlements[len(paid_settlements)//2:])
            if first_month > 0:
                month_over_month_growth = float((second_month - first_month) / first_month * 100)
        
        settlement_success_rate = (
            (len(paid_settlements) / len(settlements) * 100)
            if settlements
            else 0.0
        )

        return {
            "vendor_id": vendor_id,
            "period": {
                "start_date": start_date or (date.today() - timedelta(days=90)),
                "end_date": end_date or date.today(),
            },
            "summary": {
                "total_revenue": total_revenue,
                "total_settlements": len(settlements),
                "settled_amount": settled_amount,
                "pending_amount": pending_amount,
                "pending_count": pending_count,
                "average_settlement_days": average_settlement_days,
            },
            "daily_settlements": [
                {
                    "date": s.period_end,
                    "amount": s.net_amount,
                    "status": s.status,
                }
                for s in settlements
            ],
            "trends": {
                "month_over_month_growth": month_over_month_growth,
                "average_settlement_time": average_settlement_days,
                "settlement_success_rate": settlement_success_rate,
            },
        }
