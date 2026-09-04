"""
Vendor Wallet API
Handles vendor e-wallet balance and withdrawal requests
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from app.database import get_db
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.models.user import VendorProfile
from app.models.nutrition import Withdrawal, WithdrawalStatusEnum
from app.schemas.vendor_wallet import (
    QrWithdrawalRedeemRequest,
    VendorWalletBalanceResponse,
    WithdrawalAmountRequest,
    WithdrawalHistoryResponse,
    WithdrawalResponse,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vendor-wallet", tags=["vendor-wallet"])

MIN_WITHDRAWAL_AMOUNT = Decimal("50000")
QR_WITHDRAWAL_PREFIX = "QRW-"
QR_WITHDRAWAL_PAYLOAD_PREFIX = "VENDOR-WITHDRAWAL:"
QR_WITHDRAWAL_EXPIRY_HOURS = 24
QR_WITHDRAWAL_NOTE = "qr_cashout"


def _ensure_vendor_can_withdraw(vendor: VendorProfile) -> None:
    if vendor.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor must be verified before withdrawing funds.",
        )


def _build_qr_reference() -> str:
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
    suffix = uuid4().hex[:6].upper()
    return f"{QR_WITHDRAWAL_PREFIX}{timestamp}-{suffix}"


def _build_qr_payload(reference: str) -> str:
    return f"{QR_WITHDRAWAL_PAYLOAD_PREFIX}{reference}"


def _extract_qr_reference(raw_value: str) -> str:
    value = raw_value.strip().upper()
    if value.startswith(QR_WITHDRAWAL_PAYLOAD_PREFIX):
        return value.replace(QR_WITHDRAWAL_PAYLOAD_PREFIX, "", 1).strip()
    return value


def _is_qr_withdrawal(withdrawal: Withdrawal) -> bool:
    reference = str(withdrawal.transfer_reference or "")
    return reference.startswith(QR_WITHDRAWAL_PREFIX) or withdrawal.notes == QR_WITHDRAWAL_NOTE


def _serialize_withdrawal(withdrawal: Withdrawal) -> dict:
    is_qr = _is_qr_withdrawal(withdrawal)
    qr_payload = _build_qr_payload(withdrawal.transfer_reference) if is_qr and withdrawal.transfer_reference else None
    qr_expires_at = None
    if is_qr and withdrawal.status in {WithdrawalStatusEnum.pending, WithdrawalStatusEnum.processing}:
        qr_expires_at = withdrawal.created_at + timedelta(hours=QR_WITHDRAWAL_EXPIRY_HOURS)

    return {
        "id": str(withdrawal.id),
        "amount": float(withdrawal.amount),
        "status": withdrawal.status,
        "withdrawal_method": "qr" if is_qr else "bank",
        "bank_name": withdrawal.bank_name,
        "bank_account_number": withdrawal.bank_account_number,
        "bank_account_holder": withdrawal.bank_account_holder,
        "transfer_reference": withdrawal.transfer_reference,
        "qr_payload": qr_payload,
        "qr_expires_at": qr_expires_at.isoformat() if qr_expires_at else None,
        "completed_at": withdrawal.completed_at.isoformat() if withdrawal.completed_at else None,
        "created_at": withdrawal.created_at.isoformat(),
    }


@router.get("/balance", response_model=VendorWalletBalanceResponse)
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

    pending_withdrawals = (
        db.query(func.coalesce(func.sum(Withdrawal.amount), 0))
        .filter(
            Withdrawal.vendor_id == current_user.user_id,
            Withdrawal.status.in_([WithdrawalStatusEnum.pending, WithdrawalStatusEnum.processing]),
        )
        .scalar()
        or Decimal("0")
    )

    return {
        "balance": float(vendor.wallet_balance or 0),
        "bank_name": vendor.bank_name,
        "bank_account_number": vendor.bank_account_number,
        "bank_account_holder": vendor.bank_account_holder,
        "pending_withdrawals": float(pending_withdrawals),
        "minimum_withdrawal_amount": float(MIN_WITHDRAWAL_AMOUNT),
    }


@router.post("/withdraw", response_model=WithdrawalResponse)
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

    _ensure_vendor_can_withdraw(vendor)

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
        completed_at=datetime.now(UTC).replace(tzinfo=None),
    )
    
    vendor.wallet_balance -= withdraw_amount
    
    db.add(withdrawal)
    db.add(vendor)
    db.commit()
    db.refresh(withdrawal)
    db.refresh(vendor)

    logger.info(f"Withdrawal completed: {withdrawal.id} - {withdraw_amount} for vendor {current_user.user_id}")

    return _serialize_withdrawal(withdrawal)


@router.post("/withdraw/qr", response_model=WithdrawalResponse)
async def request_qr_withdrawal(
    data: WithdrawalAmountRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Create a QR-based withdrawal request and reserve vendor balance."""
    vendor = db.query(VendorProfile).filter(
        VendorProfile.user_id == current_user.user_id
    ).first()

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found",
        )

    _ensure_vendor_can_withdraw(vendor)

    withdraw_amount = Decimal(str(data.amount))

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
        status=WithdrawalStatusEnum.pending,
        transfer_reference=_build_qr_reference(),
        notes=QR_WITHDRAWAL_NOTE,
    )

    vendor.wallet_balance -= withdraw_amount

    db.add(withdrawal)
    db.add(vendor)
    db.commit()
    db.refresh(withdrawal)
    db.refresh(vendor)

    logger.info(
        "QR withdrawal created: %s - %s for vendor %s",
        withdrawal.id,
        withdraw_amount,
        current_user.user_id,
    )

    return _serialize_withdrawal(withdrawal)


@router.post("/withdraw/qr/redeem", response_model=WithdrawalResponse)
async def redeem_qr_withdrawal(
    data: QrWithdrawalRedeemRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Redeem a vendor QR withdrawal request. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can redeem vendor withdrawal QR codes.",
        )

    reference = _extract_qr_reference(data.qr_payload)
    if not reference.startswith(QR_WITHDRAWAL_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vendor withdrawal QR payload.",
        )

    withdrawal = db.query(Withdrawal).filter(
        Withdrawal.transfer_reference == reference,
        Withdrawal.is_active,
    ).first()

    if not withdrawal or not _is_qr_withdrawal(withdrawal):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Withdrawal QR request not found.",
        )

    if withdrawal.status == WithdrawalStatusEnum.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Withdrawal QR request has already been redeemed.",
        )

    if withdrawal.status in {WithdrawalStatusEnum.failed, WithdrawalStatusEnum.cancelled}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Withdrawal QR request is no longer active.",
        )

    withdrawal.status = WithdrawalStatusEnum.completed
    withdrawal.completed_at = datetime.now(UTC).replace(tzinfo=None)
    if not withdrawal.notes:
        withdrawal.notes = QR_WITHDRAWAL_NOTE

    db.add(withdrawal)
    db.commit()
    db.refresh(withdrawal)

    logger.info(
        "QR withdrawal redeemed: %s with reference %s by admin %s",
        withdrawal.id,
        reference,
        current_user.user_id,
    )

    return _serialize_withdrawal(withdrawal)


@router.get("/withdrawals", response_model=WithdrawalHistoryResponse)
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
        "items": [_serialize_withdrawal(w) for w in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
