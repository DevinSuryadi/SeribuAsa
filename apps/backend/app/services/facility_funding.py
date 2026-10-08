"""Allocate pooled donations to facility orders without touching legacy wallets."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.donation import Donation, DonationStatusEnum
from app.models.facility import OrderFundingAllocation
from app.models.product import Order

ACTIVE_STATUSES = ("reserved", "spent")


class InsufficientPoolFunds(Exception):
    pass


def reserve_order_funding(db: Session, order: Order) -> None:
    """Reserve FIFO donor balances while locking every eligible donation row."""
    donations = (
        db.query(Donation)
        .filter(
            Donation.status == DonationStatusEnum.success,
            Donation.funding_flow == "pooled",
            Donation.is_active.is_(True),
        )
        .order_by(Donation.created_at, Donation.id)
        .with_for_update()
        .all()
    )
    used_rows = (
        db.query(OrderFundingAllocation.donation_id, func.sum(OrderFundingAllocation.amount))
        .filter(
            OrderFundingAllocation.donation_id.in_([donation.id for donation in donations]),
            OrderFundingAllocation.status.in_(ACTIVE_STATUSES),
            OrderFundingAllocation.is_active.is_(True),
        )
        .group_by(OrderFundingAllocation.donation_id)
        .all()
    ) if donations else []
    used = {donation_id: Decimal(amount) for donation_id, amount in used_rows}
    remaining = Decimal(order.total_amount)
    planned: list[tuple[UUID, Decimal]] = []
    for donation in donations:
        available = max(Decimal("0"), Decimal(donation.amount) - used.get(donation.id, Decimal("0")))
        amount = min(available, remaining)
        if amount > 0:
            planned.append((donation.id, amount))
            remaining -= amount
        if remaining == 0:
            break
    if remaining > 0:
        raise InsufficientPoolFunds("Dana pool belum mencukupi untuk pesanan ini.")
    db.add_all([
        OrderFundingAllocation(donation_id=donation_id, order_id=order.id, amount=amount, status="reserved")
        for donation_id, amount in planned
    ])
    db.flush()


def order_funding(db: Session, order: Order) -> dict:
    amounts = dict(
        db.query(OrderFundingAllocation.status, func.sum(OrderFundingAllocation.amount))
        .filter_by(order_id=order.id, is_active=True)
        .group_by(OrderFundingAllocation.status)
        .all()
    )
    reserved = Decimal(amounts.get("reserved") or 0)
    spent = Decimal(amounts.get("spent") or 0)
    total = Decimal(order.total_amount)
    funding_status = "not_connected"
    if spent == total:
        funding_status = "spent"
    elif reserved + spent == total:
        funding_status = "reserved"
    elif reserved + spent > 0:
        funding_status = "partial"
    return {"funding_status": funding_status, "funded_amount": reserved + spent, "spent_amount": spent}


def release_order_funding(db: Session, order: Order) -> None:
    now = datetime.utcnow()
    for allocation in db.query(OrderFundingAllocation).filter_by(order_id=order.id, status="reserved", is_active=True).all():
        allocation.status = "released"
        allocation.released_at = now


def spend_order_funding(db: Session, order: Order) -> None:
    funding = order_funding(db, order)
    if funding["funding_status"] != "reserved":
        raise InsufficientPoolFunds("Pesanan belum didanai sepenuhnya oleh pool donasi.")
    now = datetime.utcnow()
    for allocation in db.query(OrderFundingAllocation).filter_by(order_id=order.id, status="reserved", is_active=True).all():
        allocation.status = "spent"
        allocation.spent_at = now
