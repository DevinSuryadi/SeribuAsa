"""Auditable impact of a donation cohort, using the facility funding ledger.

Dates select donations, not downstream events: balances and delivery progress are
their current state. Family reach is shared reach, never exclusive attribution.
"""
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.donation import Donation, DonationStatusEnum
from app.models.facility import AidDistribution, AidDistributionItem, HealthFacility, OrderFundingAllocation
from app.models.product import Order, OrderItem
from app.services.regions import REGENCIES

ZERO = Decimal("0")


def generate_dashboard(db: Session, start: date | None, end: date, donor_id: str | None):
    jakarta = ZoneInfo("Asia/Jakarta")

    def boundary(day):
        return datetime.combine(day, time.min, jakarta).astimezone(timezone.utc).replace(tzinfo=None)

    filters = [Donation.is_active.is_(True), Donation.status == DonationStatusEnum.success,
               Donation.created_at < boundary(end + timedelta(days=1))]
    if start:
        filters.append(Donation.created_at >= boundary(start))
    if donor_id:
        filters.append(Donation.donor_id == UUID(str(donor_id)))
    query = db.query(Donation).filter(*filters)
    # SQL aggregation keeps monetary totals exact and avoids per-donation queries.
    total, count = query.with_entities(func.coalesce(func.sum(Donation.amount), 0), func.count(Donation.id)).one()
    pooled = query.filter(Donation.funding_flow == "pooled")
    pooled_total = pooled.with_entities(func.coalesce(func.sum(Donation.amount), 0)).scalar()
    cohort = pooled.with_entities(Donation.id).subquery()
    allocation_query = db.query(OrderFundingAllocation).filter(
        OrderFundingAllocation.donation_id.in_(db.query(cohort.c.id)),
        OrderFundingAllocation.is_active.is_(True),
        OrderFundingAllocation.status.in_(("reserved", "spent")),
    )
    reserved = allocation_query.filter(OrderFundingAllocation.status == "reserved").with_entities(
        func.coalesce(func.sum(OrderFundingAllocation.amount), 0)).scalar()
    spent = allocation_query.filter(OrderFundingAllocation.status == "spent").with_entities(
        func.coalesce(func.sum(OrderFundingAllocation.amount), 0)).scalar()
    # Collapse multiple donations funding one order before joining delivery records.
    funded = allocation_query.filter(OrderFundingAllocation.status == "spent").with_entities(
        OrderFundingAllocation.order_id.label("order_id"),
        func.sum(OrderFundingAllocation.amount).label("amount"),
    ).group_by(OrderFundingAllocation.order_id).subquery()
    delivered_value = db.query(
        AidDistributionItem.distribution_id,
        func.sum(AidDistributionItem.quantity * OrderItem.price).label("value"),
    ).join(OrderItem, OrderItem.id == AidDistributionItem.order_item_id).filter(
        AidDistributionItem.is_active.is_(True), OrderItem.is_active.is_(True),
    ).group_by(AidDistributionItem.distribution_id).subquery()
    rows = db.query(Order, funded.c.amount, AidDistribution, delivered_value.c.value, HealthFacility).join(
        funded, funded.c.order_id == Order.id,
    ).outerjoin(AidDistribution, (AidDistribution.order_id == Order.id) & AidDistribution.is_active.is_(True)).outerjoin(
        delivered_value, delivered_value.c.distribution_id == AidDistribution.id,
    ).join(HealthFacility, HealthFacility.id == Order.health_facility_id).filter(
        Order.is_active.is_(True), Order.order_flow == "facility_delivery",
    ).all()
    families, facilities = set(), set()
    distributed = ZERO
    regions = defaultdict(lambda: {"amount": ZERO, "families": set(), "distributions": 0})
    distributions = 0
    for order, amount, delivery, value, facility in rows:
        if not delivery or not value or not order.total_amount:
            continue
        # Attribute only this cohort's share of items actually handed to families.
        attributed = (Decimal(amount) * min(Decimal(value) / Decimal(order.total_amount), Decimal("1")))
        distributed += attributed
        families.add(order.family_id)
        facilities.add(facility.id)
        distributions += 1
        region = regions[facility.regency_code or "Belum tercatat"]
        region["amount"] += attributed
        region["families"].add(order.family_id)
        region["distributions"] += 1

    month = func.to_char(func.timezone("Asia/Jakarta", func.timezone("UTC", Donation.created_at)), "YYYY-MM")
    if db.bind.dialect.name == "sqlite":
        month = func.strftime("%Y-%m", Donation.created_at, "+7 hours")
    trend = query.with_entities(month.label("month"), func.sum(Donation.amount).label("amount"),
                                func.count(Donation.id).label("count")).group_by(month).order_by(month).all()
    # Recent donation audit trail is bounded; summary always includes the whole cohort.
    recent = query.order_by(Donation.created_at.desc(), Donation.id.desc()).limit(50).all()
    ids = [d.id for d in recent]
    usage = defaultdict(lambda: {"reserved": ZERO, "spent": ZERO})
    if ids:
        for did, status, amount in allocation_query.filter(OrderFundingAllocation.donation_id.in_(ids)).with_entities(
            OrderFundingAllocation.donation_id, OrderFundingAllocation.status,
            func.sum(OrderFundingAllocation.amount),
        ).group_by(OrderFundingAllocation.donation_id, OrderFundingAllocation.status).all():
            usage[did][status] = amount
    money = lambda value: Decimal(value).quantize(Decimal("0.01"))
    return {
        "scope": "personal" if donor_id else "platform",
        "period": {"start_date": start, "end_date": end},
        "generated_at": datetime.now(timezone.utc),
        "summary": {"received": total, "pooled_received": pooled_total, "legacy_received": total - pooled_total,
                    "reserved": reserved, "spent": spent, "available": pooled_total - reserved - spent,
                    "distributed": money(distributed), "donations": count, "families": len(families),
                    "facilities": len(facilities), "distributions": distributions},
        "trend": [{"month": r.month, "amount": r.amount, "count": r.count} for r in trend],
        "regions": [{"code": code, "name": REGENCIES.get(code, {}).get("name", code), "amount": money(r["amount"]), "families": len(r["families"]),
                     "distributions": r["distributions"]} for code, r in sorted(regions.items())],
        "recent_donations": [{"id": str(d.id), "created_at": d.created_at.replace(tzinfo=timezone.utc),
                              "amount": d.amount, "flow": d.funding_flow,
                              "reserved": usage[d.id]["reserved"], "spent": usage[d.id]["spent"]} for d in recent],
    }
