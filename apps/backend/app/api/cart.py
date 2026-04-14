"""
Cart Router
Handles shopping cart operations for beneficiaries
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.services.cart_service import CartService
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.schemas.cart import (
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
    CartSummaryResponse,
    StockValidationRequest,
    StockValidationResponse
)
from app.models.user import BeneficiaryProfile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cart", tags=["cart"])


@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Add item to cart or update quantity if already exists"""
    try:
        # Get beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Add to cart
        cart_item = CartService.add_to_cart(
            db=db,
            beneficiary_id=beneficiary.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        
        return CartItemResponse.model_validate(cart_item)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error adding to cart: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add item to cart"
        )


@router.get("", response_model=CartResponse)
async def get_cart(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get all items in beneficiary's cart"""
    try:
        # Get beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Get cart
        cart_items = CartService.get_cart(
            db=db,
            beneficiary_id=beneficiary.id
        )
        
        total_amount = sum(item.price * item.quantity for item in cart_items)
        
        return CartResponse(
            beneficiary_id=beneficiary.id,
            items=[CartItemResponse.model_validate(item) for item in cart_items],
            total_items=len(cart_items),
            total_amount=total_amount,
            created_at=beneficiary.created_at,
            updated_at=beneficiary.updated_at
        )
    
    except Exception as e:
        logger.error(f"Error getting cart: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cart"
        )


@router.get("/summary", response_model=CartSummaryResponse)
async def get_cart_summary(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get cart summary with voucher eligibility breakdown"""
    try:
        # Get beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Get cart summary
        summary = CartService.get_cart_summary(
            db=db,
            beneficiary_id=beneficiary.id
        )
        
        return CartSummaryResponse(
            beneficiary_id=beneficiary.id,
            items=[CartItemResponse.model_validate(item) for item in summary["items"]],
            total_items=len(summary["items"]),
            total_amount=summary["total_amount"],
            eligible_amount=summary["eligible_amount"],
            ineligible_amount=summary["ineligible_amount"],
            voucher_balance=beneficiary.vouchers_balance,
            max_voucher_applicable=min(summary["eligible_amount"], beneficiary.vouchers_balance),
            created_at=beneficiary.created_at,
            updated_at=beneficiary.updated_at
        )
    
    except Exception as e:
        logger.error(f"Error getting cart summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve cart summary"
        )


@router.put("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: str,
    update_data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Update quantity of cart item"""
    try:
        # Get beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Update quantity
        cart_item = CartService.update_quantity(
            db=db,
            item_id=item_id,
            quantity=update_data.quantity,
            beneficiary_id=beneficiary.id
        )
        
        return CartItemResponse.model_validate(cart_item)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating cart item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update cart item"
        )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cart_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Remove item from cart"""
    try:
        # Get beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Remove item
        CartService.remove_item(
            db=db,
            item_id=item_id,
            beneficiary_id=beneficiary.id
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error removing cart item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove item from cart"
        )


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Clear all items from cart"""
    try:
        # Get beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Clear cart
        CartService.clear_cart(
            db=db,
            beneficiary_id=beneficiary.id
        )
    
    except Exception as e:
        logger.error(f"Error clearing cart: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear cart"
        )


@router.post("/validate-stock", response_model=StockValidationResponse)
async def validate_stock_for_checkout(
    validation_data: StockValidationRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Validate stock availability for checkout"""
    try:
        # Get beneficiary profile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == current_user.user_id
        ).first()
        
        if not beneficiary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary profile not found"
            )
        
        # Validate stock
        validation_result = CartService.validate_stock_for_checkout(
            db=db,
            product_ids=validation_data.product_ids,
            beneficiary_id=beneficiary.id
        )
        
        return StockValidationResponse(
            all_in_stock=validation_result["all_in_stock"],
            unavailable_products=validation_result["unavailable_products"],
            low_stock_products=validation_result["low_stock_products"]
        )
    
    except Exception as e:
        logger.error(f"Error validating stock: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate stock"
        )
