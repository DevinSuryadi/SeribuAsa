"""Shared transitions that end a facility order before it reaches a family."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.product import Order, Product
from app.services.facility_funding import release_order_funding

PENDING_ORDER_TTL = timedelta(days=3)


def cancel_facility_order_record(
    db: Session, order: Order, reason: str, *, restore_stock: bool = True
) -> None:
    """Close an order and return its reserved funds; the caller commits."""
    if restore_stock:
        for item in order.items:
            product = db.query(Product).filter_by(id=item.product_id).with_for_update().first()
            product.stock_quantity += item.quantity
    order.status = "cancelled"
    if order.allocation_status in {"requested", "automatic"}:
        order.allocation_status = "cancelled"
    order.allocation_reason = reason
    release_order_funding(db, order)


def expire_unprocessed_facility_orders(db: Session) -> int:
    """Cancel orders the vendor left unprocessed so funds and stock are not held forever."""
    cutoff = datetime.utcnow() - PENDING_ORDER_TTL
    orders = (
        db.query(Order)
        .filter(
            Order.order_flow == "facility_delivery",
            Order.status == "pending",
            Order.is_active.is_(True),
            Order.created_at < cutoff,
        )
        .with_for_update()
        .all()
    )
    for order in orders:
        cancel_facility_order_record(
            db, order, f"Dibatalkan otomatis: vendor tidak memproses dalam {PENDING_ORDER_TTL.days} hari."
        )
    db.commit()
    return len(orders)
