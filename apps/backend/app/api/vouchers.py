"""
Voucher Router
Handles voucher allocation, balance checking, and redemption
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from decimal import Decimal

from app.database import get_db
from app.services.voucher_service import VoucherService
from app.services.donation_service import DonationService
from app.schemas.voucher import (
    VoucherAllocationCreate,
    VoucherAllocationResponse,
    VoucherBalanceResponse,
    VoucherResponse,
    VoucherHistoryResponse,
    VoucherTransaction,
    VoucherRedemptionRequest,
    VoucherQueryParams
)
from app.models.donation import Donation, DonationStatusEnum
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vouchers", tags=["vouchers"])


def get_mock_current_user():
    """Mock authentication - returns fake user data"""
    return {
        "user_id": "mock-user-123",
        "email": "user@example.com",
        "roles": ["admin"]
    }


@router.post("/allocate", response_model=VoucherAllocationResponse, status_code=status.HTTP_201_CREATED)
async def allocate_vouchers(
    allocation_data: VoucherAllocationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Allocate vouchers to beneficiary after successful donation"""
    # Get donation
    donation = db.query(Donation).filter(
        Donation.id == allocation_data.donation_id
    ).first()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    if donation.status != DonationStatusEnum.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Donation status is {donation.status.value}, must be 'success'"
        )
    
    # Allocate vouchers
    vouchers = VoucherService.allocate_vouchers(
        db=db,
        donation=donation
    )
    
    if not vouchers:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to allocate vouchers"
        )
    
    # Get updated beneficiary balance
    from app.models.user import BeneficiaryProfile
    beneficiary = db.query(BeneficiaryProfile).filter(
        BeneficiaryProfile.user_id == allocation_data.beneficiary_id
    ).first()
    
    return VoucherAllocationResponse(
        vouchers=[VoucherResponse.model_validate(v) for v in vouchers],
        total_allocated=sum(v.balance for v in vouchers),
        beneficiary_id=allocation_data.beneficiary_id,
        new_balance=beneficiary.vouchers_balance if beneficiary else Decimal(0)
    )


@router.get("/balance/{beneficiary_id}", response_model=VoucherBalanceResponse)
async def get_balance(
    beneficiary_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Get voucher balance for beneficiary"""
    balance_data = VoucherService.get_balance(
        db=db,
        beneficiary_id=beneficiary_id
    )
    
    return VoucherBalanceResponse(
        beneficiary_id=beneficiary_id,
        total_balance=balance_data["total_balance"],
        active_vouchers=[VoucherResponse.model_validate(v) for v in balance_data["active_vouchers"]],
        expiring_soon=balance_data["expiring_soon"]
    )


@router.get("/history", response_model=VoucherHistoryResponse)
async def get_history(
    beneficiary_id: str = Query(..., description="Beneficiary ID to filter by"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Get voucher transaction history"""
    params = VoucherQueryParams(
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date
    )
    
    transactions = VoucherService.get_transaction_history(
        db=db,
        beneficiary_id=beneficiary_id,
        params=params
    )
    
    return VoucherHistoryResponse(
        items=[VoucherTransaction(**t) for t in transactions],
        total=len(transactions),
        page=page,
        page_size=page_size
    )


@router.post("/redeem")
async def redeem_voucher(
    redemption_data: VoucherRedemptionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Redeem vouchers for order payment"""
    try:
        result = VoucherService.redeem_voucher(
            db=db,
            voucher_codes=redemption_data.voucher_codes,
            amount=redemption_data.amount,
            order_id=redemption_data.order_id
        )
        
        return {
            "success": True,
            "data": result,
            "message": "Vouchers redeemed successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
