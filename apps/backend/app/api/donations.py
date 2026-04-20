"""
Donation Router
Handles donation creation, listing, and management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.services.donation_service import DonationService
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.schemas.donation import (
    DonationCreate,
    DonationResponse,
    DonationWithImpact,
    DonationListResponse,
    ImpactMetrics,
    DonationQueryParams,
    DonationTypeEnum,
    DonationStatusEnum,
    DashboardMetrics
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/donations", tags=["donations"])


@router.post("/", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
async def create_donation(
    donation_data: DonationCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Create new donation"""
    logger.info(f"[DONATION] Attempting to create donation for user {current_user.user_id}")
    
    # Validate that donor profile exists
    from app.models.user import DonorProfile
    donor_profile = db.query(DonorProfile).filter(
        DonorProfile.user_id == current_user.user_id
    ).first()
    
    if not donor_profile:
        logger.error(f"[DONATION] Donor profile not found for user {current_user.user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your donor profile before creating a donation"
        )
    
    logger.info(f"[DONATION] Donor profile verified for user {current_user.user_id}")
    
    donation = DonationService.create_donation(
        db=db,
        donor_id=current_user.user_id,
        donation_data=donation_data
    )
    
    logger.info(f"[DONATION] ✓ Donation created: {donation.id} by user {current_user.user_id}")
    
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
    current_user: AuthenticatedUser = Depends(get_current_user)
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
        donor_id=current_user.user_id,
        params=params
    )
    
    total = DonationService.get_donations_count(
        db=db,
        donor_id=current_user.user_id,
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
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get donation by ID with impact metrics"""
    donation = DonationService.get_donation_by_id(
        db=db,
        donation_id=donation_id,
        donor_id=current_user.user_id
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
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get donor impact metrics"""
    metrics = DonationService.get_impact_metrics(
        db=db,
        donor_id=donor_id
    )
    
    return ImpactMetrics(**metrics)


@router.get("/dashboard-metrics/{donor_id}", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    donor_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Get dashboard metrics for donor - for dashboard display"""
    metrics = DonationService.get_dashboard_metrics(
        db=db,
        donor_id=donor_id
    )
    
    return DashboardMetrics(**metrics)


@router.get("/{donation_id}/receipt")
async def download_donation_receipt(
    donation_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Download donation receipt as PDF.
    Returns PDF file for successful donations.
    """
    donation = db.query(Donation).filter(
        Donation.id == donation_id,
        Donation.donor_id == current_user.user_id
    ).first()
    
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found"
        )
    
    if donation.status != DonationStatusEnum.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt only available for successful donations"
        )
    
    # For now, return a simple JSON response
    # In production, generate actual PDF
    from fastapi.responses import JSONResponse
    return JSONResponse({
        "message": "Receipt generation endpoint",
        "donation_id": donation_id,
        "amount": str(donation.amount),
        "date": donation.created_at.isoformat() if donation.created_at else None,
        "status": donation.status.value,
        "note": "PDF generation to be implemented with library like WeasyPrint or ReportLab"
    })


@router.get("/export")
async def export_donation_history(
    format: str = "csv",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Export donation history as CSV or PDF.
    """
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    # Build query
    query = db.query(Donation).filter(Donation.donor_id == current_user.user_id)
    
    if status:
        query = query.filter(Donation.status == status)
    if date_from:
        query = query.filter(Donation.created_at >= date_from)
    if date_to:
        query = query.filter(Donation.created_at <= date_to)
    
    donations = query.order_by(Donation.created_at.desc()).all()
    
    if format.lower() == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["ID", "Amount", "Currency", "Type", "Status", "Payment Method", "Date"])
        
        # Data
        for d in donations:
            writer.writerow([
                str(d.id),
                str(d.amount),
                "IDR",
                d.type.value,
                d.status.value,
                d.payment_method,
                d.created_at.isoformat() if d.created_at else ""
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=donation_history.csv"}
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format '{format}' not supported. Use 'csv'."
        )


@router.post("/{donation_id}/simulate-payment")
async def simulate_payment(
    donation_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Simulate successful payment (DEMO ONLY).
    In production, this will be replaced by Midtrans webhook.
    """
    try:
        from app.services.mock_payment_service import MockPaymentService
        
        result = MockPaymentService.simulate_payment_success(
            db=db,
            donation_id=donation_id
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Payment simulation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to simulate payment"
        )
