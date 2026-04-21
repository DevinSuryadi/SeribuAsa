"""
Settlement Router
Handles settlement listing, detail, and calculation
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime

from app.database import get_db
from app.services.settlement_service import SettlementService
from app.middleware.auth import get_current_user, AuthenticatedUser, RequireRole
from app.schemas.settlement import (
    SettlementResponse,
    SettlementDetailResponse,
    SettlementListResponse,
    SettlementCalculateRequest,
    SettlementCalculateResponse,
    SettlementQueryParams,
    SettlementMarkPaidRequest,
    SettlementMarkPaidResponse,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settlements", tags=["settlements"])


@router.get("/", response_model=SettlementListResponse)
async def list_settlements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List settlements for vendor (own) or admin (all)"""
    is_admin = current_user.role == "admin"
    params = SettlementQueryParams(
        page=page,
        page_size=page_size,
        status=status_filter,
        start_date=start_date,
        end_date=end_date,
    )

    settlements = SettlementService.get_settlements(
        db, current_user.user_id, is_admin, params
    )
    total = SettlementService.get_settlements_count(
        db, current_user.user_id, is_admin, params
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    items = []
    for s in settlements:
        s_dict = SettlementResponse.model_validate(s).model_dump()
        if s.vendor_profile:
            s_dict["vendor_store_name"] = s.vendor_profile.store_name
        items.append(SettlementResponse(**s_dict))

    return SettlementListResponse(
        items=items, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


@router.get("/{settlement_id}", response_model=SettlementDetailResponse)
async def get_settlement(
    settlement_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Get settlement detail with breakdown"""
    is_admin = current_user.role == "admin"
    settlement = SettlementService.get_settlement_by_id(
        db, settlement_id, current_user.user_id, is_admin
    )

    if not settlement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settlement not found",
        )

    s_dict = SettlementDetailResponse.model_validate(settlement).model_dump()
    if settlement.vendor_profile:
        s_dict["vendor_store_name"] = settlement.vendor_profile.store_name
        s_dict["vendor_bank_name"] = settlement.vendor_profile.bank_name
        s_dict["vendor_bank_account"] = settlement.vendor_profile.bank_account_number
        s_dict["vendor_account_holder"] = settlement.vendor_profile.bank_account_holder

    s_dict["breakdown"] = SettlementService.get_settlement_breakdown(db, settlement)
    s_dict["admin_fee_percentage"] = 1.0

    return SettlementDetailResponse(**s_dict)


@router.post("/calculate", response_model=SettlementCalculateResponse)
async def calculate_settlements(
    data: SettlementCalculateRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Trigger settlement calculation (admin only)"""
    result = SettlementService.calculate_settlements(
        db,
        period_start=data.period_start,
        period_end=data.period_end,
        vendor_id=data.vendor_id,
    )
    return SettlementCalculateResponse(**result)


@router.post("/{settlement_id}/request-payout", response_model=SettlementMarkPaidResponse)
async def request_settlement_payout(
    settlement_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Request payout for a settlement (vendor requests payout)"""
    is_admin = current_user.role == "admin"
    settlement = SettlementService.get_settlement_by_id(
        db, settlement_id, current_user.user_id, is_admin
    )

    if not settlement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settlement not found",
        )

    if settlement.status not in ["ready"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request payout for settlement with status: {settlement.status}",
        )

    settlement.status = "processing"
    settlement.updated_at = datetime.now()
    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    logger.info(f"Settlement {settlement_id} payout requested by vendor")

    s_dict = SettlementMarkPaidResponse.model_validate(settlement).model_dump()
    if settlement.vendor_profile:
        s_dict["vendor_store_name"] = settlement.vendor_profile.store_name

    return SettlementMarkPaidResponse(**s_dict)


@router.post("/{settlement_id}/mark-paid", response_model=SettlementMarkPaidResponse)
async def mark_settlement_paid(
    settlement_id: str,
    data: SettlementMarkPaidRequest,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RequireRole(["admin"])),
):
    """Mark settlement as paid (admin only)"""
    is_admin = current_user.role == "admin"
    settlement = SettlementService.get_settlement_by_id(
        db, settlement_id, current_user.user_id, is_admin
    )

    if not settlement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settlement not found",
        )

    if settlement.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Settlement must be in 'ready' status, current status: {settlement.status}",
        )

    # Update settlement status
    settlement.status = "paid"
    settlement.payout_date = data.payout_date or date.today()
    settlement.bank_transfer_reference = data.bank_transfer_reference
    settlement.updated_at = datetime.now()

    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    logger.info(
        f"Settlement {settlement_id} marked as paid with reference: {data.bank_transfer_reference}"
    )

    s_dict = SettlementMarkPaidResponse.model_validate(settlement).model_dump()
    if settlement.vendor_profile:
        s_dict["vendor_store_name"] = settlement.vendor_profile.store_name

    return SettlementMarkPaidResponse(**s_dict)


@router.get("/export")
async def export_settlements(
    format: str = Query("csv", regex="^(csv|pdf)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Export settlements as CSV or PDF"""
    from fastapi.responses import StreamingResponse
    import csv
    import io
    
    # Get settlements for current user
    is_admin = current_user.role == "admin"
    params = SettlementQueryParams(
        page=1,
        page_size=1000,  # Get all for export
        start_date=start_date,
        end_date=end_date,
    )
    
    settlements = SettlementService.get_settlements(
        db, current_user.user_id, is_admin, params
    )
    
    if format.lower() == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "ID", "Period Start", "Period End", "Total Orders", "Total Amount",
            "Admin Fee", "Net Amount", "Status", "Created At"
        ])
        
        # Data
        for s in settlements:
            writer.writerow([
                str(s.id),
                s.period_start.isoformat() if s.period_start else "",
                s.period_end.isoformat() if s.period_end else "",
                s.total_orders,
                str(s.total_amount),
                str(s.admin_fee),
                str(s.net_amount),
                s.status,
                s.created_at.isoformat() if s.created_at else "",
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=settlements.csv"}
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF format not yet implemented. Use 'csv'."
        )
