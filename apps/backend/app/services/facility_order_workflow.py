"""Facility order transitions; callers lock the order and commit the transaction."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.product import Order, Product
from app.services.facility_funding import (
    InsufficientPoolFunds,
    order_funding,
    release_order_funding,
    reserve_order_funding,
)


class InvalidOrderTransition(ValueError):
    pass


def restore_order_stock(db: Session, order: Order) -> None:
    quantities = {item.product_id: item.quantity for item in order.items}
    products = (
        db.query(Product)
        .filter(Product.id.in_(quantities))
        .order_by(Product.id)
        .with_for_update()
        .all()
    )
    for product in products:
        product.stock_quantity += quantities[product.id]


def _require_reserved_funding(db: Session, order: Order) -> None:
    funding = order_funding(db, order)
    if funding["funding_status"] == "not_connected":
        reserve_order_funding(db, order)
        funding = order_funding(db, order)
    if funding["funding_status"] != "reserved":
        raise InsufficientPoolFunds("Pesanan belum didanai sepenuhnya oleh pool donasi")


def confirm_vendor_order(db: Session, order: Order) -> None:
    if order.status in {"processing", "shipped", "received", "completed"}:
        return
    if order.status != "pending":
        raise InvalidOrderTransition("Hanya pesanan yang menunggu konfirmasi dapat dikonfirmasi")
    _require_reserved_funding(db, order)
    order.status = "processing"
    order.vendor_confirmed_at = datetime.utcnow()


def dispatch_vendor_order(db: Session, order: Order) -> None:
    if order.status in {"shipped", "received", "completed"}:
        return
    if order.status != "processing":
        raise InvalidOrderTransition("Vendor harus mengonfirmasi pesanan sebelum mengirim")
    _require_reserved_funding(db, order)
    order.status = "shipped"
    order.dispatched_at = datetime.utcnow()


def reject_vendor_order(db: Session, order: Order, reason: str) -> None:
    if order.status == "rejected" and order.vendor_rejected_at:
        if order.vendor_rejection_reason == reason:
            return
        raise InvalidOrderTransition("Pesanan sudah ditolak dengan alasan lain")
    if order.status != "pending":
        raise InvalidOrderTransition("Hanya pesanan yang menunggu konfirmasi dapat ditolak")
    restore_order_stock(db, order)
    release_order_funding(db, order)
    order.status = "rejected"
    order.vendor_rejected_at = datetime.utcnow()
    order.vendor_rejection_reason = reason
