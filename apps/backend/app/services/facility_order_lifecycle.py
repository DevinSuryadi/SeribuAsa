"""Shared transitions that end a facility order before it reaches a family."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.product import Order
from app.services.facility_funding import release_order_funding
from app.services.facility_order_workflow import restore_order_stock

PENDING_ORDER_TTL = timedelta(days=3)


def cancel_facility_order_record(
    db: Session, order: Order, reason: str, *, restore_stock: bool = True
) -> None:
    """Close an order and return its reserved funds; the caller locks the order and commits."""
    if restore_stock:
        # Products are locked in id order, like order creation, so concurrent orders cannot deadlock.
        restore_order_stock(db, order)
    order.status = "cancelled"
    if order.allocation_status in {"requested", "automatic"}:
        order.allocation_status = "cancelled"
    order.allocation_reason = reason
    release_order_funding(db, order)


def expire_unprocessed_facility_orders(db: Session) -> int:
    """Cancel orders the vendor left unprocessed so funds and stock are not held forever."""
    cutoff = datetime.utcnow() - PENDING_ORDER_TTL
    candidate_ids = [
        order_id
        for (order_id,) in db.query(Order.id).filter(
            Order.order_flow == "facility_delivery",
            Order.status == "pending",
            Order.is_active.is_(True),
            Order.created_at < cutoff,
        )
    ]
    expired = 0
    for order_id in candidate_ids:
        # Lock one order at a time and re-check it: the vendor may have confirmed it,
        # or the facility may have cancelled it, while this job was running.
        order = db.query(Order).filter_by(id=order_id).with_for_update().populate_existing().first()
        if order is None or order.status != "pending" or not order.is_active:
            db.rollback()
            continue
        cancel_facility_order_record(
            db, order, f"Dibatalkan otomatis: vendor tidak memproses dalam {PENDING_ORDER_TTL.days} hari."
        )
        db.commit()
        expired += 1
    return expired
