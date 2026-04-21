"""
Vendor Wallet API
Handles vendor e-wallet balance and withdrawal requests
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.database import get_db
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.models.user import VendorProfile
from app.models.nutrition import Withdrawal, WithdrawalStatusEnum
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vendor-wallet", tags=["vendor-wallet"])

MIN_WITHDRAWAL_AMOUNT = Decimal("50000")


@router.get("/balance")
async def get_wallet_balance(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get vendor wallet balance"""
    vendor = db.query(VendorProfile).filter(
        VendorProfile.user_id == current_user.user_id
    ).first()
    
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found",
        )
    
    return {
        "balance": float(vendor.wallet_balance or 0),
        "bank_name": vendor.bank_name,
        "bank_account_number": vendor.bank_account_number,
        "bank_account_holder": vendor.bank_account_holder,
    }


@router.post("/withdraw")
async def request_withdrawal(
    amount: float,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Request withdrawal from wallet to bank (auto-approve if min met)"""
    vendor = db.query(VendorProfile).filter(
        VendorProfile.user_id == current_user.user_id
    ).first()
    
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found",
        )
    
    if not vendor.bank_name or not vendor.bank_account_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bank account not configured. Please update your profile first.",
        )
    
    withdraw_amount = Decimal(str(amount))
    
    if withdraw_amount < MIN_WITHDRAWAL_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum withdrawal amount is {int(MIN_WITHDRAWAL_AMOUNT):,}",
        )
    
    if vendor.wallet_balance < withdraw_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance",
        )
    
    withdrawal = Withdrawal(
        vendor_id=current_user.user_id,
        amount=withdraw_amount,
        bank_name=vendor.bank_name,
        bank_account_number=vendor.bank_account_number,
        bank_account_holder=vendor.bank_account_holder,
        status=WithdrawalStatusEnum.completed,
        transfer_reference=f"WTH-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        completed_at=datetime.utcnow(),
    )
    
    vendor.wallet_balance -= withdraw_amount
    
    db.add(withdrawal)
    db.add(vendor)
    db.commit()
    db.refresh(withdrawal)
    db.refresh(vendor)
    
    logger.info(f"Withdrawal completed: {withdrawal.id} - {withdraw_amount} for vendor {current_user.user_id}")
    
    return {
        "id": str(withdrawal.id),
        "amount": float(withdrawal.amount),
        "status": withdrawal.status,
        "bank_name": withdrawal.bank_name,
        "bank_account_number": withdrawal.bank_account_number,
        "completed_at": withdrawal.completed_at.isoformat() if withdrawal.completed_at else None,
    }


@router.get("/withdrawals")
async def get_withdrawal_history(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get vendor withdrawal history"""
    query = db.query(Withdrawal).filter(
        Withdrawal.vendor_id == current_user.user_id
    ).order_by(Withdrawal.created_at.desc())
    
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "items": [
            {
                "id": str(w.id),
                "amount": float(w.amount),
                "status": w.status,
                "bank_name": w.bank_name,
                "bank_account_number": w.bank_account_number,
                "transfer_reference": w.transfer_reference,
                "completed_at": w.completed_at.isoformat() if w.completed_at else None,
                "created_at": w.created_at.isoformat(),
            }
            for w in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }