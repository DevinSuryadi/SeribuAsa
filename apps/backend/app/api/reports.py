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
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/impact")
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
    return {"success": True, "data": ImpactReportResponse(**result).model_dump()}


@router.get("/sales")
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
    return {"success": True, "data": SalesReportResponse(**result).model_dump()}


@router.get("/regional")
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
    return {"success": True, "data": RegionalReportResponse(**result).model_dump()}


@router.get("/demographics")
async def get_demographics_report(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["government", "admin"])),
):
    """Get demographic breakdown reports"""
    result = ReportGenerator.generate_demographics_report(db)
    return {"success": True, "data": DemographicsReportResponse(**result).model_dump()}
