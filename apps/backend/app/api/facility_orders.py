"""Facility food orders and vendor-to-facility QR handover."""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.facilities import verified_facility_identity
from app.api.facility_families import current_facility, owned_family
from app.database import get_db
from app.middleware.auth import AuthenticatedUser, get_current_user
from app.models.facility import FacilityOrderReceipt, HealthFacility, OrderHandoverToken
from app.models.product import Order, OrderItem, Product
from app.models.user import VendorProfile

facility_router = APIRouter(prefix="/facilities/orders", tags=["facility orders"])
vendor_router = APIRouter(prefix="/vendor/facility-orders", tags=["vendor facility orders"])


class OrderLineInput(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=1000)


class FacilityOrderInput(BaseModel):
    family_id: UUID
    items: list[OrderLineInput] = Field(min_length=1, max_length=50)
    client_request_id: UUID


class ReceiveInput(BaseModel):
    token: str = Field(min_length=30, max_length=200)
    notes: str | None = Field(default=None, max_length=1000)


def order_payload(db: Session, order: Order, *, vendor_view: bool = False) -> dict:
    facility = db.query(HealthFacility).filter_by(id=order.health_facility_id).first()
    receipt = db.query(FacilityOrderReceipt).filter_by(order_id=order.id).first()
    return {
        "id": order.id,
        "family_id": order.family_id,
        "family_name": None if vendor_view else (order.recipient_family.head_name if order.recipient_family else None),
        "health_facility_name": facility.name if facility else None,
        "delivery_address": order.delivery_address_snapshot,
        "vendor_id": order.vendor_id,
        "vendor_name": order.vendor_profile.store_name if order.vendor_profile else None,
        "items": [
            {"product_id": item.product_id, "product_name": item.product.name if item.product else "Produk",
             "quantity": item.quantity, "price": item.price, "subtotal": item.subtotal}
            for item in order.items
        ],
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_status": order.payment_status,
        "funding_status": "not_connected",
        "created_at": order.created_at,
        "received_at": receipt.received_at if receipt else None,
        "receipt_notes": receipt.notes if receipt else None,
    }


def vendor_account(db: Session, user: AuthenticatedUser) -> VendorProfile:
    if user.role != "vendor":
        raise HTTPException(status_code=403, detail="Khusus akun vendor")
    vendor = db.query(VendorProfile).filter_by(user_id=user.user_id, is_active=True).first()
    if not vendor:
        raise HTTPException(status_code=403, detail="Profil vendor tidak ditemukan")
    return vendor


@facility_router.get("")
def list_facility_orders(db: Session = Depends(get_db), facility: HealthFacility = Depends(current_facility)):
    orders = db.query(Order).filter_by(order_flow="facility_delivery", health_facility_id=facility.id, is_active=True).order_by(Order.created_at.desc()).all()
    return [order_payload(db, order) for order in orders]


@facility_router.post("", status_code=status.HTTP_201_CREATED)
def create_facility_order(
    data: FacilityOrderInput,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(data.family_id, facility, db)
    existing = db.query(Order).filter_by(client_request_id=data.client_request_id).first()
    if existing:
        if existing.health_facility_id != facility.id or existing.family_id != family.id:
            raise HTTPException(status_code=409, detail="Identitas permintaan sudah dipakai")
        existing_lines = {item.product_id: item.quantity for item in existing.items}
        submitted_lines = {item.product_id: item.quantity for item in data.items}
        if len(submitted_lines) != len(data.items) or existing_lines != submitted_lines:
            raise HTTPException(status_code=409, detail="Identitas permintaan sudah dipakai untuk isi berbeda")
        return order_payload(db, existing)

    quantities: dict[UUID, int] = {}
    for line in data.items:
        if line.product_id in quantities:
            raise HTTPException(status_code=422, detail="Produk tidak boleh diduplikasi dalam satu pesanan")
        quantities[line.product_id] = line.quantity

    products = db.query(Product).filter(Product.id.in_(quantities)).order_by(Product.id).with_for_update().all()
    if len(products) != len(quantities):
        raise HTTPException(status_code=400, detail="Ada produk yang tidak ditemukan")
    if len({product.vendor_id for product in products}) != 1:
        raise HTTPException(status_code=400, detail="Satu pesanan hanya boleh berisi produk dari satu vendor")
    for product in products:
        if not product.is_active or product.approval_status != "approved":
            raise HTTPException(status_code=400, detail=f"Produk {product.name} belum tersedia")
        if product.stock_quantity < quantities[product.id]:
            raise HTTPException(status_code=400, detail=f"Stok {product.name} tidak mencukupi")

    total = sum((Decimal(product.price) * quantities[product.id] for product in products), Decimal("0"))
    order = Order(
        order_flow="facility_delivery", client_request_id=data.client_request_id,
        family_id=family.id, health_facility_id=facility.id, placed_by_user_id=facility.account_user_id,
        vendor_id=products[0].vendor_id, delivery_address_snapshot=facility.address,
        total_amount=total, voucher_used=0, cash_paid=0, status="pending", payment_status="pending",
    )
    db.add(order)
    db.flush()
    for product in products:
        quantity = quantities[product.id]
        product.stock_quantity -= quantity
        db.add(OrderItem(order_id=order.id, product_id=product.id, quantity=quantity,
                         price=product.price, subtotal=Decimal(product.price) * quantity))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(Order).filter_by(client_request_id=data.client_request_id, health_facility_id=facility.id, family_id=family.id).first()
        if existing:
            return order_payload(db, existing)
        raise HTTPException(status_code=409, detail="Pesanan bersamaan tidak dapat diproses")
    db.refresh(order)
    return order_payload(db, order)


@facility_router.post("/{order_id}/cancel")
def cancel_facility_order(order_id: UUID, db: Session = Depends(get_db), facility: HealthFacility = Depends(current_facility)):
    order = db.query(Order).filter_by(id=order_id, order_flow="facility_delivery", health_facility_id=facility.id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    if order.status != "pending":
        raise HTTPException(status_code=409, detail="Hanya pesanan yang belum diproses dapat dibatalkan")
    for item in order.items:
        product = db.query(Product).filter_by(id=item.product_id).with_for_update().first()
        product.stock_quantity += item.quantity
    order.status = "cancelled"
    db.commit()
    return order_payload(db, order)


@facility_router.post("/receive")
def receive_order(
    data: ReceiveInput,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
    identity: dict = Depends(verified_facility_identity),
):
    token_hash = hashlib.sha256(data.token.encode("utf-8")).hexdigest()
    handover = db.query(OrderHandoverToken).filter_by(token_hash=token_hash).first()
    if not handover:
        raise HTTPException(status_code=400, detail="QR tidak valid, sudah dipakai, atau kedaluwarsa")
    order = db.query(Order).filter_by(id=handover.order_id, order_flow="facility_delivery", health_facility_id=facility.id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan untuk faskes ini tidak ditemukan")
    handover = db.query(OrderHandoverToken).filter_by(id=handover.id).populate_existing().with_for_update().first()
    if handover.consumed_at or handover.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="QR tidak valid, sudah dipakai, atau kedaluwarsa")
    if order.status != "processing":
        raise HTTPException(status_code=409, detail="Pesanan belum siap diserahterimakan")
    now = datetime.utcnow()
    handover.consumed_at = now
    handover.consumed_by_user_id = UUID(str(identity["id"]))
    db.add(FacilityOrderReceipt(order_id=order.id, handover_token_id=handover.id,
                                received_by_user_id=UUID(str(identity["id"])), received_at=now,
                                notes=data.notes))
    order.status = "completed"
    db.commit()
    return order_payload(db, order)


@vendor_router.get("")
def list_vendor_facility_orders(db: Session = Depends(get_db), user: AuthenticatedUser = Depends(get_current_user)):
    vendor = vendor_account(db, user)
    orders = db.query(Order).filter_by(order_flow="facility_delivery", vendor_id=vendor.user_id, is_active=True).order_by(Order.created_at.desc()).all()
    return [order_payload(db, order, vendor_view=True) for order in orders]


@vendor_router.post("/{order_id}/dispatch")
def dispatch_facility_order(order_id: UUID, db: Session = Depends(get_db), user: AuthenticatedUser = Depends(get_current_user)):
    vendor = vendor_account(db, user)
    order = db.query(Order).filter_by(id=order_id, order_flow="facility_delivery", vendor_id=vendor.user_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    if order.status != "pending":
        raise HTTPException(status_code=409, detail="Pesanan tidak dapat diproses pada status ini")
    order.status = "processing"
    db.commit()
    return order_payload(db, order, vendor_view=True)


@vendor_router.post("/{order_id}/handover-token")
def create_handover_token(order_id: UUID, db: Session = Depends(get_db), user: AuthenticatedUser = Depends(get_current_user)):
    vendor = vendor_account(db, user)
    order = db.query(Order).filter_by(id=order_id, order_flow="facility_delivery", vendor_id=vendor.user_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    if order.status != "processing":
        raise HTTPException(status_code=409, detail="QR tersedia setelah pesanan diproses")
    now = datetime.utcnow()
    db.query(OrderHandoverToken).filter_by(order_id=order.id, consumed_at=None).update({"expires_at": now})
    raw_token = f"SA-HANDOVER:{secrets.token_urlsafe(32)}"
    expires_at = now + timedelta(minutes=15)
    db.add(OrderHandoverToken(order_id=order.id, token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(), expires_at=expires_at))
    db.commit()
    return {"token": raw_token, "expires_at": expires_at.replace(tzinfo=timezone.utc), "order_id": order.id}
