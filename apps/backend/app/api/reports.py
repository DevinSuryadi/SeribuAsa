"""
Reports Router
Handles analytics reports for donors, vendors, and government
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.services.report_generator import ReportGenerator
from app.middleware.auth import get_current_user, AuthenticatedUser, RequireRole
from app.schemas.reports import (
    ImpactReportResponse,
    SalesReportResponse,
    RegionalReportResponse,
    DemographicsReportResponse,
    SettlementReportResponse,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/impact", response_model=ImpactReportResponse)
async def get_impact_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get impact report for donor dashboard"""
    result = ReportGenerator.generate_impact_report(
        db,
        donor_id=current_user.user_id,
        start_date=start_date,
        end_date=end_date,
    )
    return ImpactReportResponse(**result)


@router.get("/sales", response_model=SalesReportResponse)
async def get_sales_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get sales report for vendor dashboard"""
    result = ReportGenerator.generate_sales_report(
        db,
        vendor_id=current_user.user_id,
        start_date=start_date,
        end_date=end_date,
    )
    return SalesReportResponse(**result)


@router.get("/regional", response_model=RegionalReportResponse)
async def get_regional_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["government", "admin"])),
):
    """Get regional analytics for government dashboard"""
    result = ReportGenerator.generate_regional_report(
        db,
        start_date=start_date,
        end_date=end_date,
    )
    return RegionalReportResponse(**result)


@router.get("/demographics", response_model=DemographicsReportResponse)
async def get_demographics_report(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["government", "admin"])),
):
    """Get demographic breakdown reports"""
    result = ReportGenerator.generate_demographics_report(db)
    return DemographicsReportResponse(**result)


@router.get("/settlements", response_model=SettlementReportResponse)
async def get_settlement_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get settlement report for vendor dashboard"""
    result = ReportGenerator.generate_settlement_report(
        db,
        vendor_id=current_user.user_id,
        start_date=start_date,
        end_date=end_date,
    )
    return SettlementReportResponse(**result)
