"""Facility food orders and evidence-backed family distribution."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.facility_families import current_facility, owned_family
from app.database import get_db
from app.middleware.auth import AuthenticatedUser, get_current_user
from app.models.facility import (
    AidDistribution,
    AidDistributionItem,
    FacilityOrderReceipt,
    HealthFacility,
    OrderFundingAllocation,
)
from app.models.product import Order, OrderItem, Product
from app.models.user import VendorProfile
from app.services.facility_funding import (
    InsufficientPoolFunds,
    order_funding,
    release_order_funding,
    reserve_order_funding,
    spend_order_funding,
)

facility_router = APIRouter(prefix="/facilities/orders", tags=["facility orders"])
vendor_router = APIRouter(prefix="/vendor/facility-orders", tags=["vendor facility orders"])


class OrderLineInput(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=1000)


class FacilityOrderInput(BaseModel):
    family_id: UUID
    items: list[OrderLineInput] = Field(min_length=1, max_length=50)
    client_request_id: UUID


class DistributionInput(BaseModel):
    recipient_name: str = Field(min_length=1, max_length=255)
    recipient_relation: str | None = Field(default=None, max_length=100)
    evidence_url: str = Field(min_length=1, max_length=8_000_000)
    items_complete: bool = True
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("evidence_url")
    @classmethod
    def valid_evidence_url(cls, value: str) -> str:
        value = value.strip()
        allowed = (
            "https://",
            "http://",
            "data:image/jpeg;base64,",
            "data:image/png;base64,",
            "data:image/webp;base64,",
        )
        if not value.startswith(allowed):
            raise ValueError("Foto bukti tidak valid")
        return value


def _funding_payload(total_amount: Decimal, amounts: dict[str, Decimal]) -> dict:
    reserved = Decimal(amounts.get("reserved") or 0)
    spent = Decimal(amounts.get("spent") or 0)
    total = Decimal(total_amount)
    funding_status = "not_connected"
    if spent == total:
        funding_status = "spent"
    elif reserved + spent == total:
        funding_status = "reserved"
    elif reserved + spent > 0:
        funding_status = "partial"
    return {
        "funding_status": funding_status,
        "funded_amount": reserved + spent,
        "spent_amount": spent,
    }


def _order_payload_context(db: Session, orders: list[Order]) -> dict:
    """Load list-only relations in batches instead of querying for every order."""
    order_ids = [order.id for order in orders]
    facility_ids = {order.health_facility_id for order in orders if order.health_facility_id}
    if not order_ids:
        return {"facilities": {}, "receipts": {}, "distributions": {}, "funding": {}}

    facilities = {
        row.id: row
        for row in db.query(HealthFacility).filter(HealthFacility.id.in_(facility_ids)).all()
    } if facility_ids else {}
    receipts = {
        row.order_id: row
        for row in db.query(FacilityOrderReceipt)
        .filter(FacilityOrderReceipt.order_id.in_(order_ids), FacilityOrderReceipt.is_active.is_(True))
        .all()
    }
    distributions = {
        row.order_id: row
        for row in db.query(AidDistribution)
        .filter(AidDistribution.order_id.in_(order_ids), AidDistribution.is_active.is_(True))
        .all()
    }
    amounts_by_order: dict[UUID, dict[str, Decimal]] = {}
    funding_rows = (
        db.query(
            OrderFundingAllocation.order_id,
            OrderFundingAllocation.status,
            func.sum(OrderFundingAllocation.amount),
        )
        .filter(
            OrderFundingAllocation.order_id.in_(order_ids),
            OrderFundingAllocation.is_active.is_(True),
        )
        .group_by(OrderFundingAllocation.order_id, OrderFundingAllocation.status)
        .all()
    )
    for order_id, allocation_status, amount in funding_rows:
        amounts_by_order.setdefault(order_id, {})[allocation_status] = Decimal(amount)
    funding = {
        order.id: _funding_payload(order.total_amount, amounts_by_order.get(order.id, {}))
        for order in orders
    }
    return {"facilities": facilities, "receipts": receipts, "distributions": distributions, "funding": funding}


def order_payload(
    db: Session,
    order: Order,
    *,
    vendor_view: bool = False,
    context: dict | None = None,
) -> dict:
    if context is None:
        facility = db.query(HealthFacility).filter_by(id=order.health_facility_id).first()
        receipt = db.query(FacilityOrderReceipt).filter_by(order_id=order.id, is_active=True).first()
        distribution = db.query(AidDistribution).filter_by(order_id=order.id, is_active=True).first()
        funding = order_funding(db, order)
    else:
        facility = context["facilities"].get(order.health_facility_id)
        receipt = context["receipts"].get(order.id)
        distribution = context["distributions"].get(order.id)
        funding = context["funding"][order.id]
    return {
        "id": order.id,
        "family_id": order.family_id,
        "family_name": None
        if vendor_view
        else (order.recipient_family.head_name if order.recipient_family else None),
        "health_facility_name": facility.name if facility else None,
        "delivery_address": order.delivery_address_snapshot,
        "vendor_id": order.vendor_id,
        "vendor_name": order.vendor_profile.store_name if order.vendor_profile else None,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Produk",
                "quantity": item.quantity,
                "price": item.price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
        "total_amount": order.total_amount,
        "status": order.status,
        "payment_status": order.payment_status,
        **funding,
        "created_at": order.created_at.replace(tzinfo=timezone.utc) if order.created_at else None,
        "received_at": receipt.received_at.replace(tzinfo=timezone.utc) if receipt else None,
        "receipt_notes": receipt.notes if receipt else None,
        "distribution": {
            "id": distribution.id,
            "recipient_name": distribution.recipient_name,
            "recipient_relation": distribution.recipient_relation,
            "evidence_url": distribution.evidence_url,
            "items_complete": distribution.items_complete,
            "notes": distribution.notes,
            "distributed_at": distribution.distributed_at.replace(tzinfo=timezone.utc),
        }
        if distribution
        else None,
    }


def order_payloads(db: Session, orders: list[Order], *, vendor_view: bool = False) -> list[dict]:
    context = _order_payload_context(db, orders)
    return [order_payload(db, order, vendor_view=vendor_view, context=context) for order in orders]


def _order_list_options():
    return (
        joinedload(Order.recipient_family),
        joinedload(Order.vendor_profile),
        selectinload(Order.items).joinedload(OrderItem.product),
    )


def vendor_account(db: Session, user: AuthenticatedUser) -> VendorProfile:
    if user.role != "vendor":
        raise HTTPException(status_code=403, detail="Khusus akun vendor")
    vendor = db.query(VendorProfile).filter_by(user_id=user.user_id, is_active=True).first()
    if not vendor:
        raise HTTPException(status_code=403, detail="Profil vendor tidak ditemukan")
    return vendor


@facility_router.get("")
def list_facility_orders(
    family_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db), facility: HealthFacility = Depends(current_facility)
):
    if family_id is not None:
        owned_family(family_id, facility, db)
    query = (
        db.query(Order)
        .options(*_order_list_options())
        .filter_by(order_flow="facility_delivery", health_facility_id=facility.id, is_active=True)
    )
    if family_id is not None:
        query = query.filter(Order.family_id == family_id)
    orders = query.order_by(Order.created_at.desc()).all()
    return order_payloads(db, orders)


@facility_router.get("/history")
def list_facility_redemptions(
    family_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    """Orders already handed to a family, optionally scoped to one family."""
    if family_id is not None:
        owned_family(family_id, facility, db)
    query = (
        db.query(Order)
        .options(*_order_list_options())
        .join(AidDistribution, AidDistribution.order_id == Order.id)
        .filter(
            Order.order_flow == "facility_delivery",
            Order.health_facility_id == facility.id,
            Order.status == "completed",
            Order.is_active.is_(True),
            AidDistribution.is_active.is_(True),
        )
    )
    if family_id is not None:
        query = query.filter(Order.family_id == family_id)
    orders = query.order_by(AidDistribution.distributed_at.desc(), Order.id.desc()).all()
    return order_payloads(db, orders)


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
            raise HTTPException(
                status_code=409, detail="Identitas permintaan sudah dipakai untuk isi berbeda"
            )
        return order_payload(db, existing)

    quantities: dict[UUID, int] = {}
    for line in data.items:
        if line.product_id in quantities:
            raise HTTPException(
                status_code=422, detail="Produk tidak boleh diduplikasi dalam satu pesanan"
            )
        quantities[line.product_id] = line.quantity

    products = (
        db.query(Product)
        .filter(Product.id.in_(quantities))
        .order_by(Product.id)
        .with_for_update()
        .all()
    )
    if len(products) != len(quantities):
        raise HTTPException(status_code=400, detail="Ada produk yang tidak ditemukan")
    if len({product.vendor_id for product in products}) != 1:
        raise HTTPException(
            status_code=400, detail="Satu pesanan hanya boleh berisi produk dari satu vendor"
        )
    for product in products:
        if not product.is_active or product.approval_status != "approved":
            raise HTTPException(status_code=400, detail=f"Produk {product.name} belum tersedia")
        if product.stock_quantity < quantities[product.id]:
            raise HTTPException(status_code=400, detail=f"Stok {product.name} tidak mencukupi")

    total = sum(
        (Decimal(product.price) * quantities[product.id] for product in products), Decimal("0")
    )
    if total <= 0:
        raise HTTPException(status_code=400, detail="Total pesanan harus lebih dari nol")
    order = Order(
        order_flow="facility_delivery",
        client_request_id=data.client_request_id,
        family_id=family.id,
        health_facility_id=facility.id,
        placed_by_user_id=facility.account_user_id,
        vendor_id=products[0].vendor_id,
        delivery_address_snapshot=facility.address,
        total_amount=total,
        voucher_used=0,
        cash_paid=0,
        status="pending",
        payment_status="pending",
    )
    db.add(order)
    db.flush()
    for product in products:
        quantity = quantities[product.id]
        product.stock_quantity -= quantity
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price=product.price,
                subtotal=Decimal(product.price) * quantity,
            )
        )
    try:
        reserve_order_funding(db, order)
        db.commit()
    except InsufficientPoolFunds as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except IntegrityError:
        db.rollback()
        existing = (
            db.query(Order)
            .filter_by(
                client_request_id=data.client_request_id,
                health_facility_id=facility.id,
                family_id=family.id,
            )
            .first()
        )
        if existing:
            return order_payload(db, existing)
        raise HTTPException(status_code=409, detail="Pesanan bersamaan tidak dapat diproses")
    db.refresh(order)
    return order_payload(db, order)


@facility_router.post("/{order_id}/cancel")
def cancel_facility_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    order = (
        db.query(Order)
        .filter_by(id=order_id, order_flow="facility_delivery", health_facility_id=facility.id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    if order.status != "pending":
        raise HTTPException(
            status_code=409, detail="Hanya pesanan yang belum diproses dapat dibatalkan"
        )
    for item in order.items:
        product = db.query(Product).filter_by(id=item.product_id).with_for_update().first()
        product.stock_quantity += item.quantity
    order.status = "cancelled"
    release_order_funding(db, order)
    order.payment_status = "refunded"
    db.commit()
    return order_payload(db, order)


@facility_router.post("/{order_id}/distribute")
def distribute_order_to_family(
    order_id: UUID,
    data: DistributionInput,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    order = (
        db.query(Order)
        .filter_by(
            id=order_id,
            order_flow="facility_delivery",
            health_facility_id=facility.id,
            is_active=True,
        )
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    existing = db.query(AidDistribution).filter_by(order_id=order.id, is_active=True).first()
    if existing:
        return order_payload(db, order)
    if order.status not in {"processing", "completed"}:
        raise HTTPException(
            status_code=409,
            detail="Bukti penerimaan hanya dapat diunggah setelah vendor mengirim pesanan",
        )
    if not data.items_complete:
        raise HTTPException(
            status_code=422,
            detail="Barang yang belum lengkap tidak dapat dicatat sebagai tersalurkan",
        )

    recipient_name = data.recipient_name.strip()
    evidence_url = data.evidence_url.strip()
    if not recipient_name or not evidence_url:
        raise HTTPException(status_code=422, detail="Nama penerima dan foto bukti wajib diisi")

    try:
        receipt = (
            db.query(FacilityOrderReceipt)
            .filter_by(order_id=order.id, is_active=True)
            .first()
        )
        if not receipt:
            db.add(
                FacilityOrderReceipt(
                    order_id=order.id,
                    handover_token_id=None,
                    received_by_user_id=facility.account_user_id,
                    received_at=datetime.utcnow(),
                    notes="Tercatat otomatis saat bukti penerimaan keluarga diunggah",
                )
            )
        order.status = "completed"
        funding_status = order_funding(db, order)["funding_status"]
        if funding_status == "not_connected":
            reserve_order_funding(db, order)
            funding_status = "reserved"
        if funding_status == "reserved":
            spend_order_funding(db, order)
        elif funding_status != "spent":
            raise InsufficientPoolFunds("Pendanaan pesanan belum lengkap.")
        distribution = AidDistribution(
            order_id=order.id,
            family_id=order.family_id,
            recorded_by_user_id=facility.account_user_id,
            distributed_at=datetime.utcnow(),
            recipient_name=recipient_name,
            recipient_relation=data.recipient_relation.strip()
            if data.recipient_relation and data.recipient_relation.strip()
            else None,
            evidence_url=evidence_url,
            items_complete=True,
            notes=data.notes.strip() if data.notes and data.notes.strip() else None,
        )
        db.add(distribution)
        db.flush()
        db.add_all(
            [
                AidDistributionItem(
                    distribution_id=distribution.id,
                    order_item_id=item.id,
                    order_id=order.id,
                    quantity=item.quantity,
                )
                for item in order.items
            ]
        )
        order.payment_status = "paid"
        db.commit()
    except InsufficientPoolFunds as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except IntegrityError:
        db.rollback()
        existing = db.query(AidDistribution).filter_by(order_id=order.id, is_active=True).first()
        if existing:
            return order_payload(db, order)
        raise HTTPException(status_code=409, detail="Penyaluran bersamaan tidak dapat diproses")
    return order_payload(db, order)


@vendor_router.get("")
def list_vendor_facility_orders(
    db: Session = Depends(get_db), user: AuthenticatedUser = Depends(get_current_user)
):
    vendor = vendor_account(db, user)
    orders = (
        db.query(Order)
        .options(*_order_list_options())
        .filter_by(order_flow="facility_delivery", vendor_id=vendor.user_id, is_active=True)
        .order_by(Order.created_at.desc())
        .all()
    )
    return order_payloads(db, orders, vendor_view=True)


@vendor_router.post("/{order_id}/dispatch")
def dispatch_facility_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    vendor = vendor_account(db, user)
    order = (
        db.query(Order)
        .filter_by(id=order_id, order_flow="facility_delivery", vendor_id=vendor.user_id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    if order.status != "pending":
        raise HTTPException(status_code=409, detail="Pesanan tidak dapat diproses pada status ini")
    if order_funding(db, order)["funding_status"] == "not_connected":
        try:
            reserve_order_funding(db, order)
        except InsufficientPoolFunds as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail=str(exc)) from exc
    if order_funding(db, order)["funding_status"] != "reserved":
        raise HTTPException(
            status_code=409, detail="Pesanan belum didanai sepenuhnya oleh pool donasi"
        )
    order.status = "processing"
    db.commit()
    return order_payload(db, order, vendor_view=True)
