"""
Voucher Router
Handles voucher allocation, balance checking, and redemption
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from decimal import Decimal
import hashlib
import json

from app.database import get_db
from app.services.voucher_service import VoucherService
from app.services.idempotency_service import IdempotencyService
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.schemas.voucher import (
    VoucherAllocationCreate,
    VoucherAllocationResponse,
    VoucherBalanceResponse,
    VoucherResponse,
    VoucherHistoryResponse,
    VoucherTransaction,
    VoucherRedemptionRequest,
    VoucherQueryParams,
    VoucherValidationRequest,
    VoucherValidationResponse,
    VoucherEligibilityRequest,
    VoucherEligibilityResponse,
    VoucherSingleRedemptionRequest,
    VoucherSingleRedemptionResponse,
    VoucherTransactionHistoryResponse
)
from app.models.donation import Donation, DonationStatusEnum
from app.models.product import Product
from app.models.donation import Voucher
from app.models.user import BeneficiaryProfile
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vouchers", tags=["vouchers"])


@router.post("/allocate", response_model=VoucherAllocationResponse, status_code=status.HTTP_201_CREATED)
async def allocate_vouchers(
    allocation_data: VoucherAllocationCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
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
    current_user: AuthenticatedUser = Depends(get_current_user)
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
    current_user: AuthenticatedUser = Depends(get_current_user)
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
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Redeem vouchers for order payment"""
    try:
        if current_user.role not in ["vendor", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voucher redemption is only available for vendor and admin users"
            )

        if not idempotency_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Idempotency-Key header",
            )

        request_hash = hashlib.sha256(
            json.dumps(redemption_data.model_dump(mode="json"), sort_keys=True).encode("utf-8")
        ).hexdigest()

        idem_state, idem_record = IdempotencyService.begin(
            endpoint="vouchers:redeem",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
        )

        if idem_state == "replay" and idem_record:
            return idem_record.response_body

        if idem_state == "processing":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Voucher redemption request is already being processed",
            )

        if idem_state == "conflict":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Idempotency key already used with different payload",
            )

        result = VoucherService.redeem_voucher(
            db=db,
            voucher_codes=redemption_data.voucher_codes,
            amount=redemption_data.amount,
            order_id=redemption_data.order_id
        )

        response_payload = {
            "success": True,
            "data": result,
            "message": "Vouchers redeemed successfully"
        }

        IdempotencyService.complete(
            endpoint="vouchers:redeem",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            status_code=status.HTTP_200_OK,
            response_body=response_payload,
        )

        return response_payload
    except HTTPException:
        raise
    except ValueError as e:
        if idempotency_key:
            IdempotencyService.abort(
                endpoint="vouchers:redeem",
                user_id=current_user.user_id,
                idempotency_key=idempotency_key,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        if idempotency_key:
            IdempotencyService.abort(
                endpoint="vouchers:redeem",
                user_id=current_user.user_id,
                idempotency_key=idempotency_key,
            )
        logger.error(f"Error redeeming vouchers: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to redeem vouchers"
        )


# ============================================
# NEW ENDPOINTS
# ============================================

@router.post("/validate", response_model=VoucherValidationResponse)
async def validate_voucher(
    validation_data: VoucherValidationRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Validate voucher code for use in checkout"""
    try:
        # Get beneficiary profile
        from app.models.user import BeneficiaryProfile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Validate voucher
        validation_result = VoucherService.validate_voucher(
            db=db,
            code=validation_data.code,
            beneficiary_id=beneficiary.user_id,
            amount=validation_data.amount
        )
        
        return VoucherValidationResponse(**validation_result)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error validating voucher: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate voucher"
        )


@router.post("/check-eligibility", response_model=VoucherEligibilityResponse)
async def check_product_eligibility(
    eligibility_data: VoucherEligibilityRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Check which products in cart are eligible for voucher redemption"""
    try:
        # Get beneficiary profile
        from app.models.user import BeneficiaryProfile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Check eligibility
        eligibility_result = VoucherService.check_product_eligibility(
            db=db,
            product_ids=eligibility_data.product_ids
        )
        
        return VoucherEligibilityResponse(**eligibility_result)
    
    except Exception as e:
        logger.error(f"Error checking eligibility: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check product eligibility"
        )


@router.post("/redeem-single", response_model=VoucherSingleRedemptionResponse)
async def redeem_single_voucher(
    redemption_data: VoucherSingleRedemptionRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Redeem a single voucher code with atomic locking"""
    try:
        if current_user.role not in ["vendor", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voucher redemption is only available for vendor and admin users"
            )

        if not idempotency_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Idempotency-Key header",
            )

        request_hash = hashlib.sha256(
            json.dumps(redemption_data.model_dump(mode="json"), sort_keys=True).encode("utf-8")
        ).hexdigest()

        idem_state, idem_record = IdempotencyService.begin(
            endpoint="vouchers:redeem-single",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
        )

        if idem_state == "replay" and idem_record:
            return VoucherSingleRedemptionResponse(**idem_record.response_body)

        if idem_state == "processing":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Voucher redemption request is already being processed",
            )

        if idem_state == "conflict":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Idempotency key already used with different payload",
            )

        # Get beneficiary profile
        # Redeem voucher with transaction
        redemption_result = VoucherService.redeem_voucher_with_transaction(
            db=db,
            beneficiary_id=None,
            voucher_code=redemption_data.code,
            amount=redemption_data.amount,
            order_id=redemption_data.order_id
        )

        response_payload = VoucherSingleRedemptionResponse(**redemption_result).model_dump(mode="json")

        IdempotencyService.complete(
            endpoint="vouchers:redeem-single",
            user_id=current_user.user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            status_code=status.HTTP_200_OK,
            response_body=response_payload,
        )

        return VoucherSingleRedemptionResponse(**response_payload)
     
    except HTTPException:
        raise
    except ValueError as e:
        if idempotency_key:
            IdempotencyService.abort(
                endpoint="vouchers:redeem-single",
                user_id=current_user.user_id,
                idempotency_key=idempotency_key,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        if idempotency_key:
            IdempotencyService.abort(
                endpoint="vouchers:redeem-single",
                user_id=current_user.user_id,
                idempotency_key=idempotency_key,
            )
        logger.error(f"Error redeeming voucher: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to redeem voucher"
        )


@router.get("/transactions")
async def get_transaction_history(
    beneficiary_id: Optional[str] = Query(None, description="Beneficiary ID to filter by"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    transaction_type: Optional[str] = Query(None, description="Filter by type: allocation, redeemed, expired, adjusted, revoked"),
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get voucher transaction history with optional type filter"""
    try:
        # Get beneficiary profile
        if current_user.role != "beneficiary":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voucher transaction history is only available for beneficiary users"
            )

        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )

        requested_beneficiary_id = str(beneficiary_id) if beneficiary_id else str(beneficiary.user_id)

        if str(beneficiary.user_id) != requested_beneficiary_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own voucher transaction history"
            )
        
        # Get transaction history
        from app.models.cart import VoucherTransaction
        query = db.query(VoucherTransaction).join(
            Voucher,
            Voucher.id == VoucherTransaction.voucher_id
        ).filter(
            Voucher.beneficiary_id == beneficiary.user_id
        )
        
        if transaction_type:
            query = query.filter(VoucherTransaction.transaction_type == transaction_type)
        
        # Pagination
        total = query.count()
        transactions = query.order_by(VoucherTransaction.created_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        items = [
            VoucherTransactionHistoryResponse(
                id=str(t.id),
                voucher_id=str(t.voucher_id),
                order_id=str(t.order_id) if t.order_id else None,
                transaction_type=t.transaction_type,
                amount=t.amount,
                created_at=t.created_at
            ).model_dump()
            for t in transactions
        ]

        total_pages = (total + page_size - 1) // page_size if total > 0 else 0

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions without catching them
        raise
    except Exception as e:
        logger.error(f"Error getting transaction history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction history"
        )


@router.get("/allowed-categories")
async def get_allowed_voucher_categories(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get list of product categories allowed for voucher redemption"""
    try:
        from app.models.cart import VoucherAllowedCategory
        
        # Get all allowed categories
        allowed_categories = db.query(VoucherAllowedCategory).filter(
            VoucherAllowedCategory.is_active == True
        ).all()
        
        return {
            "total": len(allowed_categories),
            "categories": [
                {
                    "id": cat.id,
                    "category_id": cat.category_id,
                    "category_name": cat.category.name if cat.category else None,
                    "created_at": cat.created_at
                }
                for cat in allowed_categories
            ]
        }
    
    except Exception as e:
        logger.error(f"Error getting allowed categories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve allowed categories"
        )
