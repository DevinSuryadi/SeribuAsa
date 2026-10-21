"""Facility food orders and evidence-backed family distribution."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.facility_families import current_facility, owned_family
from app.database import get_db
from app.middleware.auth import AuthenticatedUser, RequireRole, get_current_user
from app.models.facility import (
    AidDistribution,
    AidDistributionItem,
    FacilityOrderReceipt,
    FacilityVendorPayout,
    HealthFacility,
    OrderFundingAllocation,
)
from app.models.product import Order, OrderItem, Product
from app.models.user import VendorProfile
from app.services.regions import valid_area
from app.services.facility_funding import (
    InsufficientPoolFunds,
    order_funding,
    release_order_funding,
    reserve_order_funding,
)

facility_router = APIRouter(prefix="/facilities/orders", tags=["facility orders"])
catalog_router = APIRouter(prefix="/facilities/catalog", tags=["facility catalog"])
vendor_router = APIRouter(prefix="/vendor/facility-orders", tags=["vendor facility orders"])
admin_router = APIRouter(prefix="/admin/facility-orders", tags=["admin facility orders"])


class OrderLineInput(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=1000)


class FacilityOrderInput(BaseModel):
    family_id: UUID
    vendor_id: UUID
    service_province_code: str = Field(min_length=2, max_length=2)
    service_regency_code: str = Field(min_length=5, max_length=5)
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


class ReceiptInput(BaseModel):
    arrived_at: datetime
    items_complete: bool
    evidence_url: str | None = Field(default=None, max_length=8_000_000)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("evidence_url")
    @classmethod
    def valid_evidence_url(cls, value: str | None) -> str | None:
        return DistributionInput.valid_evidence_url(value) if value else None


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
        return {"facilities": {}, "receipts": {}, "distributions": {}, "funding": {}, "payouts": {}}

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
    payouts = {
        row.order_id: row
        for row in db.query(FacilityVendorPayout)
        .filter(FacilityVendorPayout.order_id.in_(order_ids), FacilityVendorPayout.is_active.is_(True))
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
    return {"facilities": facilities, "receipts": receipts, "distributions": distributions, "funding": funding, "payouts": payouts}


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
        payout = db.query(FacilityVendorPayout).filter_by(order_id=order.id, is_active=True).first()
        funding = order_funding(db, order)
    else:
        facility = context["facilities"].get(order.health_facility_id)
        receipt = context["receipts"].get(order.id)
        distribution = context["distributions"].get(order.id)
        payout = context["payouts"].get(order.id)
        funding = context["funding"][order.id]
    return {
        "id": order.id,
        "family_id": order.family_id,
        "family_name": None
        if vendor_view
        else (order.recipient_family.head_name if order.recipient_family else None),
        "health_facility_name": facility.name if facility else None,
        "delivery_address": order.delivery_address_snapshot,
        "service_province_code": order.service_province_code,
        "service_regency_code": order.service_regency_code,
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
        "allocation_status": order.allocation_status,
        "allocation_decided_at": order.allocation_decided_at.replace(tzinfo=timezone.utc) if order.allocation_decided_at else None,
        "allocation_reason": order.allocation_reason,
        **funding,
        "created_at": order.created_at.replace(tzinfo=timezone.utc) if order.created_at else None,
        "dispatched_at": order.dispatched_at.replace(tzinfo=timezone.utc) if order.dispatched_at else None,
        "received_at": receipt.received_at.replace(tzinfo=timezone.utc) if receipt else None,
        "arrived_at": receipt.arrived_at.replace(tzinfo=timezone.utc) if receipt and receipt.arrived_at else None,
        "receipt_status": receipt.status if receipt else None,
        "receipt_evidence_url": receipt.evidence_url if receipt else None,
        "discrepancy_notes": receipt.discrepancy_notes if receipt else None,
        "receipt_notes": receipt.notes if receipt else None,
        "payout_status": payout.status if payout else None,
        "payout_due_at": payout.due_at.replace(tzinfo=timezone.utc) if payout else None,
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


@catalog_router.get("/vendors")
def list_eligible_vendors(
    province_code: str = Query(min_length=2, max_length=2),
    regency_code: str = Query(min_length=5, max_length=5),
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    if not valid_area(province_code, regency_code):
        raise HTTPException(status_code=422, detail="Kota/kabupaten tidak sesuai dengan provinsi")
    rows = (
        db.query(VendorProfile.user_id, VendorProfile.store_name, func.count(Product.id))
        .join(Product, Product.vendor_id == VendorProfile.user_id)
        .filter(
            VendorProfile.approval_status == "approved",
            VendorProfile.settlement_status == "active",
            VendorProfile.is_active.is_(True),
            Product.approval_status == "approved",
            Product.is_active.is_(True),
            Product.stock_quantity > 0,
            Product.service_province_code == province_code,
            Product.service_regency_code == regency_code,
        )
        .group_by(VendorProfile.user_id, VendorProfile.store_name)
        .order_by(VendorProfile.store_name)
        .all()
    )
    return [{"id": vendor_id, "store_name": store_name, "product_count": count} for vendor_id, store_name, count in rows]


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


def _existing_facility_order(
    db: Session, data: FacilityOrderInput, facility: HealthFacility
) -> Order | None:
    existing = db.query(Order).filter_by(client_request_id=data.client_request_id).first()
    if existing:
        if (
            existing.order_flow != "facility_delivery"
            or existing.health_facility_id != facility.id
            or existing.family_id != data.family_id
            or existing.vendor_id != data.vendor_id
            or existing.service_province_code != data.service_province_code
            or existing.service_regency_code != data.service_regency_code
        ):
            raise HTTPException(status_code=409, detail="Identitas permintaan sudah dipakai")
        existing_lines = {item.product_id: item.quantity for item in existing.items}
        submitted_lines = {item.product_id: item.quantity for item in data.items}
        if len(submitted_lines) != len(data.items) or existing_lines != submitted_lines:
            raise HTTPException(
                status_code=409, detail="Identitas permintaan sudah dipakai untuk isi berbeda"
            )
    return existing


@facility_router.post("", status_code=status.HTTP_201_CREATED)
def create_facility_order(
    data: FacilityOrderInput,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    family = owned_family(data.family_id, facility, db)
    if not valid_area(data.service_province_code, data.service_regency_code):
        raise HTTPException(status_code=422, detail="Kota/kabupaten tidak sesuai dengan provinsi")
    existing = _existing_facility_order(db, data, facility)
    if existing:
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
    # A concurrent retry can finish while this request waits for the product locks.
    existing = _existing_facility_order(db, data, facility)
    if existing:
        return order_payload(db, existing)
    if len(products) != len(quantities):
        raise HTTPException(status_code=400, detail="Ada produk yang tidak ditemukan")
    if any(product.vendor_id != data.vendor_id for product in products):
        raise HTTPException(
            status_code=400, detail="Semua produk harus berasal dari vendor yang dipilih"
        )
    vendor = db.query(VendorProfile).filter_by(user_id=data.vendor_id, is_active=True).first()
    if not vendor or vendor.approval_status != "approved" or vendor.settlement_status != "active":
        raise HTTPException(status_code=409, detail="Vendor belum disetujui atau sedang tidak aktif")
    for product in products:
        if not product.is_active or product.approval_status != "approved":
            raise HTTPException(status_code=400, detail=f"Produk {product.name} belum tersedia")
        if product.stock_quantity < quantities[product.id]:
            raise HTTPException(status_code=400, detail=f"Stok {product.name} tidak mencukupi")
        if (
            product.service_province_code != data.service_province_code
            or product.service_regency_code != data.service_regency_code
        ):
            raise HTTPException(status_code=400, detail=f"Produk {product.name} tidak melayani daerah terpilih")

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
        vendor_id=data.vendor_id,
        service_province_code=data.service_province_code,
        service_regency_code=data.service_regency_code,
        delivery_address_snapshot=facility.address,
        total_amount=total,
        voucher_used=0,
        cash_paid=0,
        status="pending",
        allocation_status="automatic",
        allocation_decided_at=datetime.utcnow(),
        payment_status="pending",
    )
    try:
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
        # Stock, order, and FIFO funding are committed together. The vendor only
        # receives an order after its full amount has been reserved from the pool.
        reserve_order_funding(db, order)
        db.commit()
    except InsufficientPoolFunds as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except IntegrityError:
        db.rollback()
        existing = _existing_facility_order(db, data, facility)
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
    if order.status not in {"pending_approval", "pending"}:
        raise HTTPException(
            status_code=409, detail="Hanya pesanan yang belum diproses dapat dibatalkan"
        )
    for item in order.items:
        product = db.query(Product).filter_by(id=item.product_id).with_for_update().first()
        product.stock_quantity += item.quantity
    order.status = "cancelled"
    if order.allocation_status in {"requested", "automatic"}:
        order.allocation_status = "cancelled"
    release_order_funding(db, order)
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
    receipt = db.query(FacilityOrderReceipt).filter_by(order_id=order.id, is_active=True).first()
    if not receipt or receipt.status != "accepted":
        raise HTTPException(
            status_code=409,
            detail="Faskes harus mengonfirmasi penerimaan barang lengkap lebih dulu",
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
        order.status = "completed"
        if order_funding(db, order)["funding_status"] not in {"reserved", "spent"}:
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


@facility_router.post("/{order_id}/receipt")
def confirm_facility_receipt(
    order_id: UUID,
    data: ReceiptInput,
    db: Session = Depends(get_db),
    facility: HealthFacility = Depends(current_facility),
):
    order = (
        db.query(Order)
        .filter_by(id=order_id, order_flow="facility_delivery", health_facility_id=facility.id, is_active=True)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    if order.status not in {"processing", "received"}:
        raise HTTPException(status_code=409, detail="Vendor harus mengirim pesanan lebih dulu")
    now = datetime.utcnow()
    arrival = data.arrived_at.astimezone(timezone.utc).replace(tzinfo=None) if data.arrived_at.tzinfo else data.arrived_at
    earliest = order.dispatched_at or order.created_at
    if arrival > now or (earliest and arrival < earliest - timedelta(seconds=1)):
        raise HTTPException(status_code=422, detail="Waktu kedatangan harus setelah pesanan dikirim dan tidak di masa depan")
    if not data.items_complete and not (data.notes and data.notes.strip()):
        raise HTTPException(status_code=422, detail="Jelaskan barang yang rusak, kurang, atau tidak sesuai")
    receipt = db.query(FacilityOrderReceipt).filter_by(order_id=order.id, is_active=True).with_for_update().first()
    if receipt and receipt.status == "accepted":
        return order_payload(db, order)
    if receipt and receipt.status == "discrepancy" and not data.items_complete:
        return order_payload(db, order)
    if receipt and arrival != receipt.arrived_at:
        raise HTTPException(status_code=409, detail="Waktu kedatangan awal tidak dapat diubah")
    if not receipt:
        receipt = FacilityOrderReceipt(
            order_id=order.id,
            handover_token_id=None,
            received_by_user_id=facility.account_user_id,
            arrived_at=arrival,
            received_at=now,
            status="accepted" if data.items_complete else "discrepancy",
            evidence_url=data.evidence_url,
            notes=data.notes.strip() if data.notes else None,
            discrepancy_notes=data.notes.strip() if not data.items_complete and data.notes else None,
        )
        db.add(receipt)
    else:
        receipt.status = "accepted"
        receipt.received_at = now
        receipt.received_by_user_id = facility.account_user_id
        receipt.notes = data.notes.strip() if data.notes else None
        receipt.evidence_url = data.evidence_url or receipt.evidence_url
    if data.items_complete:
        order.status = "received"
        db.add(FacilityVendorPayout(
            order_id=order.id,
            vendor_id=order.vendor_id,
            amount=order.total_amount,
            status="pending_approval",
            due_at=arrival + timedelta(days=3),
        ))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Konfirmasi bersamaan, perbarui pesanan") from exc
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
        .filter(Order.status.notin_(["pending_approval", "rejected"]))
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
    order.dispatched_at = datetime.utcnow()
    db.commit()
    return order_payload(db, order, vendor_view=True)


@admin_router.get("")
def list_admin_facility_orders(
    pending_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    query = db.query(Order).options(*_order_list_options()).filter_by(
        order_flow="facility_delivery", is_active=True
    )
    if pending_only:
        query = query.filter(Order.status == "pending")
    orders = query.order_by(Order.created_at.desc()).all()
    return order_payloads(db, orders)
