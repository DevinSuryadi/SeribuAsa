"""Manual, approved payout ledger for facility delivery orders."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import AuthenticatedUser, RequireRole
from app.models.facility import FacilityOrderReceipt, FacilityVendorPayout
from app.models.product import Order
from app.models.user import VendorProfile
from app.services.facility_funding import InsufficientPoolFunds, order_funding, spend_order_funding

admin_router = APIRouter(prefix="/admin/facility-payouts", tags=["facility payouts"])
vendor_router = APIRouter(prefix="/vendor/facility-payouts", tags=["facility payouts"])


class TransferInput(BaseModel):
    transfer_reference: str = Field(min_length=4, max_length=120)
    transferred_at: datetime


def payout_payload(db: Session, payout: FacilityVendorPayout) -> dict:
    order = db.query(Order).filter_by(id=payout.order_id).first()
    receipt = db.query(FacilityOrderReceipt).filter_by(order_id=payout.order_id).first()
    vendor = db.query(VendorProfile).filter_by(user_id=payout.vendor_id).first()
    now = datetime.utcnow()
    return {
        "id": payout.id,
        "order_id": payout.order_id,
        "vendor_id": payout.vendor_id,
        "vendor_name": vendor.store_name if vendor else None,
        "amount": payout.amount,
        "status": payout.status,
        "arrived_at": receipt.arrived_at.replace(tzinfo=timezone.utc) if receipt and receipt.arrived_at else None,
        "confirmed_at": receipt.received_at.replace(tzinfo=timezone.utc) if receipt else None,
        "receipt_evidence_url": receipt.evidence_url if receipt else None,
        "receipt_notes": receipt.notes if receipt else None,
        "order_status": order.status if order else None,
        "due_at": payout.due_at.replace(tzinfo=timezone.utc),
        "overdue": payout.status != "paid" and now > payout.due_at,
        "late": bool(payout.paid_at and payout.paid_at > payout.due_at),
        "approved_at": payout.approved_at.replace(tzinfo=timezone.utc) if payout.approved_at else None,
        "approved_by_user_id": payout.approved_by_user_id,
        "paid_at": payout.paid_at.replace(tzinfo=timezone.utc) if payout.paid_at else None,
        "recorded_at": payout.recorded_at.replace(tzinfo=timezone.utc) if payout.recorded_at else None,
        "paid_by_user_id": payout.paid_by_user_id,
        "transfer_reference": payout.transfer_reference,
        "bank_name": payout.bank_name if payout.status != "pending_approval" else (vendor.bank_name if vendor else None),
        "bank_account_number": payout.bank_account_number if payout.status != "pending_approval" else (vendor.bank_account_number if vendor else None),
        "bank_account_holder": payout.bank_account_holder if payout.status != "pending_approval" else (vendor.bank_account_holder if vendor else None),
    }


@admin_router.get("")
def list_admin_payouts(
    unpaid_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    query = db.query(FacilityVendorPayout).filter_by(is_active=True)
    if unpaid_only:
        query = query.filter(FacilityVendorPayout.status != "paid")
    payouts = query.order_by(
        FacilityVendorPayout.due_at.asc(), FacilityVendorPayout.id.asc()
    ).all()
    return [payout_payload(db, payout) for payout in payouts]


@vendor_router.get("")
def list_vendor_payouts(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(RequireRole(["vendor"])),
):
    payouts = db.query(FacilityVendorPayout).filter_by(
        vendor_id=user.user_id, is_active=True
    ).order_by(FacilityVendorPayout.due_at.desc()).all()
    return [payout_payload(db, payout) for payout in payouts]


@admin_router.post("/{payout_id}/approve")
def approve_payout(
    payout_id: UUID,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    payout = db.query(FacilityVendorPayout).filter_by(id=payout_id, is_active=True).with_for_update().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Pencairan tidak ditemukan")
    if payout.status == "approved":
        return payout_payload(db, payout)
    if payout.status != "pending_approval":
        raise HTTPException(status_code=409, detail="Pencairan sudah dibayar")
    order = db.query(Order).filter_by(id=payout.order_id, order_flow="facility_delivery").first()
    receipt = db.query(FacilityOrderReceipt).filter_by(order_id=payout.order_id, status="accepted").first()
    vendor = db.query(VendorProfile).filter_by(user_id=payout.vendor_id, is_active=True).first()
    if not order or not receipt or not receipt.arrived_at or order.status not in {"received", "completed"}:
        raise HTTPException(status_code=409, detail="Penerimaan barang belum sah")
    if not vendor or vendor.approval_status != "approved" or vendor.settlement_status != "active":
        raise HTTPException(status_code=409, detail="Vendor tidak memenuhi syarat pencairan")
    if order_funding(db, order)["funding_status"] != "reserved":
        raise HTTPException(status_code=409, detail="Dana pesanan belum dicadangkan penuh")
    if not all((vendor.bank_name, vendor.bank_account_number, vendor.bank_account_holder)):
        raise HTTPException(status_code=409, detail="Rekening vendor belum lengkap")
    payout.bank_name = vendor.bank_name
    payout.bank_account_number = vendor.bank_account_number
    payout.bank_account_holder = vendor.bank_account_holder
    payout.status = "approved"
    payout.approved_by_user_id = user.user_id
    payout.approved_at = datetime.utcnow()
    db.commit()
    return payout_payload(db, payout)


@admin_router.post("/{payout_id}/record-transfer")
def record_transfer(
    payout_id: UUID,
    data: TransferInput,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    payout = db.query(FacilityVendorPayout).filter_by(id=payout_id, is_active=True).with_for_update().first()
    if not payout:
        raise HTTPException(status_code=404, detail="Pencairan tidak ditemukan")
    reference = data.transfer_reference.strip()
    if not reference:
        raise HTTPException(status_code=422, detail="Referensi transfer wajib diisi")
    if payout.status == "paid":
        if payout.transfer_reference == reference:
            return payout_payload(db, payout)
        raise HTTPException(status_code=409, detail="Pencairan sudah dibayar dengan referensi lain")
    if payout.status != "approved":
        raise HTTPException(status_code=409, detail="Pencairan harus disetujui lebih dulu")
    transferred_at = data.transferred_at.astimezone(timezone.utc).replace(tzinfo=None) if data.transferred_at.tzinfo else data.transferred_at
    if transferred_at > datetime.utcnow() or transferred_at < payout.approved_at:
        raise HTTPException(status_code=422, detail="Waktu transfer harus setelah persetujuan dan tidak di masa depan")
    vendor = db.query(VendorProfile).filter_by(user_id=payout.vendor_id, is_active=True).first()
    if not vendor or vendor.approval_status != "approved" or vendor.settlement_status != "active":
        raise HTTPException(status_code=409, detail="Vendor tidak memenuhi syarat pencairan")
    order = db.query(Order).filter_by(id=payout.order_id, order_flow="facility_delivery").with_for_update().first()
    if not order or order.payment_status == "paid":
        raise HTTPException(status_code=409, detail="Status pembayaran pesanan tidak sesuai")
    try:
        spend_order_funding(db, order)
    except InsufficientPoolFunds as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    payout.status = "paid"
    payout.transfer_reference = reference
    payout.paid_by_user_id = user.user_id
    payout.paid_at = transferred_at
    payout.recorded_at = datetime.utcnow()
    order.payment_status = "paid"
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Referensi transfer sudah digunakan") from exc
    return payout_payload(db, payout)
