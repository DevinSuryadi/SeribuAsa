"""
Wallet API Router
E-wallet balance, transaction history, and allocation info for beneficiaries.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.database import get_db
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.models.wallet import WalletAllocation, WalletTransaction
from app.models.user import BeneficiaryProfile
from app.services.wallet_service import WalletService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wallet", tags=["wallet"])


def _require_beneficiary_role(current_user: AuthenticatedUser) -> None:
    if current_user.role != "beneficiary":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya penerima manfaat yang dapat mengakses fitur ini",
        )


@router.get("/balance")
async def get_wallet_balance(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Get beneficiary wallet balance summary:
    - wallet_balance    : total (available + held)
    - wallet_held       : locked for pending orders
    - wallet_available  : spendable right now
    - expiring_soon     : amount expiring within 7 days
    - earliest_expiry   : ISO date of earliest expiry
    """
    _require_beneficiary_role(current_user)
    try:
        summary = WalletService.get_balance_summary(db, current_user.user_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/transactions")
async def get_wallet_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    transaction_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Paginated wallet transaction history for beneficiary.
    Types: credit | hold | unhold | debit | expired
    """
    _require_beneficiary_role(current_user)
    from uuid import UUID

    user_uuid = UUID(str(current_user.user_id))
    query = db.query(WalletTransaction).filter(
        WalletTransaction.beneficiary_id == user_uuid,
        WalletTransaction.is_active,
    )
    if transaction_type:
        query = query.filter(WalletTransaction.transaction_type == transaction_type)

    total = query.count()
    txs = query.order_by(WalletTransaction.created_at.desc()) \
               .offset((page - 1) * page_size) \
               .limit(page_size) \
               .all()

    items = [
        {
            "id": str(tx.id),
            "transaction_type": tx.transaction_type,
            "amount": float(tx.amount),
            "balance_after": float(tx.balance_after) if tx.balance_after is not None else None,
            "description": tx.description,
            "order_id": str(tx.order_id) if tx.order_id else None,
            "allocation_id": str(tx.allocation_id) if tx.allocation_id else None,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
        }
        for tx in txs
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


@router.get("/allocations")
async def get_wallet_allocations(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    List wallet allocations (per-donation credits) with expiry info.
    Used for showing FIFO expiry details to beneficiary.
    """
    _require_beneficiary_role(current_user)
    from uuid import UUID
    from datetime import datetime

    user_uuid = UUID(str(current_user.user_id))
    query = db.query(WalletAllocation).filter(
        WalletAllocation.beneficiary_id == user_uuid,
        WalletAllocation.is_active,
    )
    if status_filter:
        query = query.filter(WalletAllocation.status == status_filter)

    allocations = query.order_by(WalletAllocation.expires_at.asc()).all()
    now = datetime.utcnow()

    items = [
        {
            "id": str(alloc.id),
            "donation_id": str(alloc.donation_id) if alloc.donation_id else None,
            "original_amount": float(alloc.original_amount),
            "remaining_amount": float(alloc.remaining_amount),
            "allocated_at": alloc.allocated_at.isoformat() if alloc.allocated_at else None,
            "expires_at": alloc.expires_at.isoformat() if alloc.expires_at else None,
            "status": alloc.status,
            "is_expired": alloc.expires_at < now if alloc.expires_at else False,
            "days_until_expiry": max(0, (alloc.expires_at - now).days) if alloc.expires_at else None,
        }
        for alloc in allocations
    ]

    return {"items": items, "total": len(items)}
