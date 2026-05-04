"""
Subscription Router
Handles subscription management for donors
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.database import get_db
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.models.subscription import (
    Subscription, SubscriptionPlan, BillingHistory,
    SubscriptionStatusEnum
)
from app.models.user import DonorProfile
from app.schemas.subscription import (
    SubscriptionResponse,
    SubscriptionDetailResponse,
    SubscriptionCreate,
    SubscriptionPlanResponse,
    BillingHistoryResponse,
    BillingHistoryListResponse,
    SubscriptionListResponse,
    SubscriptionActionResponse,
    PauseSubscriptionRequest,
    ResumeSubscriptionRequest,
    CancelSubscriptionRequest,
    UpgradeSubscriptionRequest,
    ChangePaymentMethodRequest,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def get_or_create_donor_profile(user_id: str, db: Session) -> DonorProfile:
    """Get or create donor profile for user"""
    donor = db.query(DonorProfile).filter(DonorProfile.user_id == user_id).first()
    if not donor:
        donor = DonorProfile(user_id=user_id)
        db.add(donor)
        db.commit()
        db.refresh(donor)
    return donor


# ============================================
# Subscription CRUD
# ============================================
@router.get("/", response_model=SubscriptionListResponse)
async def list_subscriptions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get all subscriptions for current donor"""
    donor = get_or_create_donor_profile(current_user.user_id, db)
    
    query = db.query(Subscription).filter(Subscription.donor_id == donor.user_id)
    
    if status:
        query = query.filter(Subscription.status == status)
    
    subscriptions = query.order_by(Subscription.created_at.desc()).all()
    
    return SubscriptionListResponse(
        subscriptions=[SubscriptionResponse.model_validate(s) for s in subscriptions],
        total=len(subscriptions)
    )


@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Create new subscription"""
    donor = get_or_create_donor_profile(current_user.user_id, db)
    
    # Get plan details
    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == data.plan_id,
        SubscriptionPlan.is_active == "true"
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found or inactive"
        )
    
    # Check if donor already has active subscription
    existing = db.query(Subscription).filter(
        Subscription.donor_id == donor.user_id,
        Subscription.status.in_([SubscriptionStatusEnum.active, SubscriptionStatusEnum.paused])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription. Please cancel it first."
        )
    
    # Create subscription
    subscription = Subscription(
        donor_id=donor.user_id,
        plan_id=plan.id,
        plan_name=plan.name,
        amount=data.amount or plan.price,
        currency=plan.currency,
        frequency=plan.frequency,
        status=SubscriptionStatusEnum.active,
        payment_method=data.payment_method,
        next_billing_date=date.today() + timedelta(days=30),
        metadata={"plan_features": plan.features or []}
    )
    
    db.add(subscription)
    
    # Update donor profile
    donor.subscription_status = "active"
    
    db.commit()
    db.refresh(subscription)
    
    logger.info(f"[SUBSCRIPTION] Created subscription {subscription.id} for donor {donor.user_id}")
    
    return SubscriptionResponse.model_validate(subscription)


# ============================================
# Subscription Plans (Public) - MUST be before /{subscription_id}
# ============================================
@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def list_subscription_plans(
    db: Session = Depends(get_db)
):
    """Get all active subscription plans"""
    plans = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.is_active == "true"
    ).all()
    
    return [SubscriptionPlanResponse.model_validate(p) for p in plans]


@router.get("/{subscription_id}", response_model=SubscriptionDetailResponse)
async def get_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get subscription details"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return SubscriptionDetailResponse.model_validate(subscription)


# ============================================
# Subscription Actions
# ============================================
@router.post("/{subscription_id}/pause", response_model=SubscriptionActionResponse)
async def pause_subscription(
    subscription_id: str,
    data: Optional[PauseSubscriptionRequest] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Pause active subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if not subscription.can_pause():
        raise HTTPException(
            status_code=400,
            detail="Subscription cannot be paused. Must be active."
        )
    
    subscription.status = SubscriptionStatusEnum.paused
    subscription.paused_at = datetime.utcnow()
    if data and data.reason:
        subscription.metadata["pause_reason"] = data.reason
    
    db.commit()
    db.refresh(subscription)
    
    return SubscriptionActionResponse(
        success=True,
        message="Subscription paused successfully",
        subscription=SubscriptionResponse.model_validate(subscription)
    )


@router.post("/{subscription_id}/resume", response_model=SubscriptionActionResponse)
async def resume_subscription(
    subscription_id: str,
    data: Optional[ResumeSubscriptionRequest] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Resume paused subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if not subscription.can_resume():
        raise HTTPException(
            status_code=400,
            detail="Subscription cannot be resumed. Must be paused."
        )
    
    subscription.status = SubscriptionStatusEnum.active
    subscription.paused_at = None
    
    # Update next billing date if provided
    if data and data.next_billing_date:
        subscription.next_billing_date = data.next_billing_date
    
    db.commit()
    db.refresh(subscription)
    
    return SubscriptionActionResponse(
        success=True,
        message="Subscription resumed successfully",
        subscription=SubscriptionResponse.model_validate(subscription)
    )


@router.post("/{subscription_id}/cancel", response_model=SubscriptionActionResponse)
async def cancel_subscription(
    subscription_id: str,
    data: Optional[CancelSubscriptionRequest] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Cancel subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if not subscription.can_cancel():
        raise HTTPException(
            status_code=400,
            detail="Subscription cannot be cancelled. Must be active or paused."
        )
    
    subscription.status = SubscriptionStatusEnum.cancelled
    subscription.cancelled_at = datetime.utcnow()
    if data and data.reason:
        subscription.metadata["cancel_reason"] = data.reason
    
    # Update donor profile
    donor = db.query(DonorProfile).filter(DonorProfile.user_id == current_user.user_id).first()
    if donor:
        donor.subscription_status = "cancelled"
    
    db.commit()
    db.refresh(subscription)
    
    return SubscriptionActionResponse(
        success=True,
        message="Subscription cancelled successfully. It will remain active until the end of current billing period.",
        subscription=SubscriptionResponse.model_validate(subscription)
    )


@router.post("/{subscription_id}/reactivate", response_model=SubscriptionActionResponse)
async def reactivate_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Reactivate cancelled subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if not subscription.can_reactivate():
        raise HTTPException(
            status_code=400,
            detail="Subscription cannot be reactivated. Must be cancelled."
        )
    
    subscription.status = SubscriptionStatusEnum.active
    subscription.cancelled_at = None
    subscription.next_billing_date = date.today() + timedelta(days=30)
    
    # Update donor profile
    donor = db.query(DonorProfile).filter(DonorProfile.user_id == current_user.user_id).first()
    if donor:
        donor.subscription_status = "active"
    
    db.commit()
    db.refresh(subscription)
    
    return SubscriptionActionResponse(
        success=True,
        message="Subscription reactivated successfully",
        subscription=SubscriptionResponse.model_validate(subscription)
    )


@router.post("/{subscription_id}/upgrade", response_model=SubscriptionActionResponse)
async def upgrade_subscription(
    subscription_id: str,
    data: UpgradeSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Upgrade subscription plan"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.status not in [SubscriptionStatusEnum.active, SubscriptionStatusEnum.paused]:
        raise HTTPException(
            status_code=400,
            detail="Cannot upgrade inactive subscription"
        )
    
    # Get new plan
    new_plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == data.plan_id,
        SubscriptionPlan.is_active == "true"
    ).first()
    
    if not new_plan:
        raise HTTPException(status_code=404, detail="New plan not found")
    
    # Update subscription
    subscription.plan_id = new_plan.id
    subscription.plan_name = new_plan.name
    subscription.amount = new_plan.price
    subscription.frequency = new_plan.frequency
    subscription.metadata["upgraded_from"] = {
        "plan_id": str(subscription.plan_id),
        "plan_name": subscription.plan_name,
        "amount": str(subscription.amount),
        "upgraded_at": datetime.utcnow().isoformat()
    }
    
    db.commit()
    db.refresh(subscription)
    
    return SubscriptionActionResponse(
        success=True,
        message=f"Subscription upgraded to {new_plan.name}",
        subscription=SubscriptionResponse.model_validate(subscription)
    )


@router.put("/{subscription_id}/payment-method", response_model=SubscriptionActionResponse)
async def change_payment_method(
    subscription_id: str,
    data: ChangePaymentMethodRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Change subscription payment method"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if subscription.status == SubscriptionStatusEnum.cancelled:
        raise HTTPException(
            status_code=400,
            detail="Cannot change payment method for cancelled subscription"
        )
    
    subscription.payment_method = data.payment_method
    db.commit()
    db.refresh(subscription)
    
    return SubscriptionActionResponse(
        success=True,
        message=f"Payment method changed to {data.payment_method}",
        subscription=SubscriptionResponse.model_validate(subscription)
    )


# ============================================
# Billing History
# ============================================
@router.get("/{subscription_id}/billing-history", response_model=BillingHistoryListResponse)
async def get_billing_history(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get billing history for subscription"""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.donor_id == current_user.user_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    history = db.query(BillingHistory).filter(
        BillingHistory.subscription_id == subscription_id
    ).order_by(BillingHistory.billing_date.desc()).all()
    
    return BillingHistoryListResponse(
        items=[BillingHistoryResponse.model_validate(h) for h in history],
        total=len(history)
    )
