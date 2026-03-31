"""
Donation Router
Handles donation creation, listing, and management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from decimal import Decimal

from app.database import get_db
from app.services.donation_service import DonationService
from app.schemas.donation import (
    DonationCreate,
    DonationResponse,
    DonationWithImpact,
    DonationListResponse,
    ImpactMetrics,
    DonationQueryParams,
    DonationTypeEnum,
    DonationStatusEnum
)
from app.models.donation import Donation
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/donations", tags=["donations"])


def get_mock_current_user():
    """Mock authentication - returns fake user data"""
    return {
        "user_id": "mock-donor-123",
        "email": "donor@example.com",
        "roles": ["donor"]
    }


@router.post("/", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
async def create_donation(
    donation_data: DonationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Create new donation"""
    donation = DonationService.create_donation(
        db=db,
        donor_id=current_user["user_id"],
        donation_data=donation_data
    )
    
    logger.info(f"Donation created: {donation.id} by user {current_user['user_id']}")
    
    return donation


@router.get("/", response_model=DonationListResponse)
async def get_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: Optional[DonationStatusEnum] = Query(None, alias="status"),
    type_filter: Optional[DonationTypeEnum] = Query(None, alias="type"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Get user's donations with filtering and pagination"""
    params = DonationQueryParams(
        page=page,
        page_size=page_size,
        status=status_filter,
        type=type_filter,
        start_date=start_date,
        end_date=end_date
    )
    
    donations = DonationService.get_donations(
        db=db,
        donor_id=current_user["user_id"],
        params=params
    )
    
    total = DonationService.get_donations_count(
        db=db,
        donor_id=current_user["user_id"],
        params=params
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return DonationListResponse(
        items=[DonationResponse.model_validate(d) for d in donations],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{donation_id}", response_model=DonationWithImpact)
async def get_donation(
    donation_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Get donation by ID with impact metrics"""
    donation = DonationService.get_donation_by_id(
        db=db,
        donation_id=donation_id,
        donor_id=current_user["user_id"]
    )
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    recipient_name = None
    if donation.recipient_id:
        from app.models.user import BeneficiaryProfile
        beneficiary = db.query(BeneficiaryProfile).filter(
            BeneficiaryProfile.user_id == donation.recipient_id
        ).first()
        if beneficiary:
            recipient_name = beneficiary.user_profile.full_name if beneficiary.user_profile else None
    
    children_helped = 1 if donation.recipient_id else 0
    months_of_support = 0
    if donation.subscription_config:
        months_of_support = donation.subscription_config.get("duration_months", 0)
    
    donation_dict = DonationResponse.model_validate(donation).model_dump()
    donation_dict["recipient_name"] = recipient_name
    donation_dict["children_helped"] = children_helped
    donation_dict["months_of_support"] = months_of_support
    
    return DonationWithImpact(**donation_dict)


@router.get("/impact/{donor_id}", response_model=ImpactMetrics)
async def get_impact_metrics(
    donor_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_mock_current_user)
):
    """Get donor impact metrics"""
    metrics = DonationService.get_impact_metrics(
        db=db,
        donor_id=donor_id
    )
    
    return ImpactMetrics(**metrics)
