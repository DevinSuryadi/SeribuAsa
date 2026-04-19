"""
Admin API
Handles admin dashboard stats and data exports
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import csv
import io
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.middleware.auth import AuthenticatedUser, RequireRole
from app.models.user import UserProfile, DonorProfile, BeneficiaryProfile, VendorProfile
from app.models.donation import Donation, Voucher, VoucherRedemption
from app.models.product import Order
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Get admin dashboard statistics"""
    # User counts by role
    total_users = db.query(UserProfile).count()
    total_donors = db.query(DonorProfile).count()
    total_beneficiaries = db.query(BeneficiaryProfile).count()
    total_vendors = db.query(VendorProfile).count()
    
    # Active vouchers (balance > 0)
    active_vouchers = db.query(func.count(Voucher.id)).filter(
        Voucher.balance > 0, Voucher.status == "active"
    ).scalar() or 0
    
    total_voucher_balance = db.query(func.sum(Voucher.balance)).filter(
        Voucher.balance > 0
    ).scalar() or 0
    
    # Orders
    total_orders = db.query(Order).count()
    completed_orders = db.query(Order).filter(Order.status == "completed").count()
    
    # Redemptions
    total_redemptions = db.query(VoucherRedemption).count()
    total_redemption_amount = db.query(func.sum(VoucherRedemption.amount)).scalar() or 0
    
    # Donations
    total_donations = db.query(func.sum(Donation.amount)).filter(
        Donation.status == "success"
    ).scalar() or 0
    
    return {
        "users": {
            "total": total_users,
            "donors": total_donors,
            "beneficiaries": total_beneficiaries,
            "vendors": total_vendors,
        },
        "vouchers": {
            "active_count": active_vouchers,
            "total_balance": float(total_voucher_balance or 0),
        },
        "orders": {
            "total": total_orders,
            "completed": completed_orders,
        },
        "redemptions": {
            "total_count": total_redemptions,
            "total_amount": float(total_redemption_amount or 0),
        },
        "donations": {
            "total_amount": float(total_donations or 0),
        },
    }


@router.get("/export/users")
async def export_users(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export users to CSV"""
    users = db.query(UserProfile).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["user_id", "full_name", "nik", "phone", "address", "role", "created_at"])
    
    for u in users:
        role = "unknown"
        if u.donor_profile:
            role = "donor"
        elif u.beneficiary_profile:
            role = "beneficiary"
        elif u.vendor_profile:
            role = "vendor"
        
        writer.writerow([
            str(u.user_id),
            u.full_name,
            u.nik or "",
            u.phone or "",
            u.address or "",
            role,
            u.created_at.isoformat() if u.created_at else "",
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )


@router.get("/export/orders")
async def export_orders(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export orders to CSV"""
    query = db.query(Order)
    
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    orders = query.order_by(Order.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["order_id", "beneficiary_id", "vendor_id", "total_amount", "status", "created_at"])
    
    for o in orders:
        writer.writerow([
            str(o.id),
            str(o.beneficiary_id),
            str(o.vendor_id),
            float(o.total_amount or 0),
            o.status,
            o.created_at.isoformat() if o.created_at else "",
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@router.get("/export/vouchers")
async def export_vouchers(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export vouchers to CSV"""
    vouchers = db.query(Voucher).order_by(Voucher.created_at.desc()).limit(1000).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["voucher_id", "code", "beneficiary_id", "balance", "status", "expiry_date", "created_at"])
    
    for v in vouchers:
        writer.writerow([
            str(v.id),
            v.code,
            str(v.beneficiary_id),
            float(v.balance or 0),
            v.status,
            v.expiry_date.isoformat() if v.expiry_date else "",
            v.created_at.isoformat() if v.created_at else "",
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vouchers.csv"},
    )


@router.get("/export/redemptions")
async def export_redemptions(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Export voucher redemptions to CSV"""
    query = db.query(VoucherRedemption)
    
    if start_date:
        query = query.filter(VoucherRedemption.created_at >= start_date)
    if end_date:
        query = query.filter(VoucherRedemption.created_at <= end_date)
    
    redemptions = query.order_by(VoucherRedemption.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["redemption_id", "voucher_code", "order_id", "vendor_id", "amount", "created_at"])
    
    for r in redemptions:
        writer.writerow([
            str(r.id),
            r.voucher.code if r.voucher else "",
            str(r.order_id),
            str(r.vendor_id),
            float(r.amount or 0),
            r.created_at.isoformat() if r.created_at else "",
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=redemptions.csv"},
    )