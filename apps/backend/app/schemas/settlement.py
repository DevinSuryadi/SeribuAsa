"""
Settlement Schemas
Pydantic schemas for settlement management
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


# ============================================
# Settlement Schemas
# ============================================
class SettlementResponse(BaseModel):
    id: UUID
    vendor_id: UUID
    vendor_store_name: Optional[str] = None
    period_start: date
    period_end: date
    total_redemptions: Decimal
    admin_fee: Decimal
    net_amount: Decimal
    status: str
    payout_date: Optional[date] = None
    bank_transfer_reference: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SettlementDetailResponse(SettlementResponse):
    vendor_bank_name: Optional[str] = None
    vendor_bank_account: Optional[str] = None
    vendor_account_holder: Optional[str] = None
    admin_fee_percentage: float = 1.0
    breakdown: List[Dict[str, Any]] = []
    notes: Optional[str] = None


class SettlementListResponse(BaseModel):
    items: List[SettlementResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# Settlement Calculation
# ============================================
class SettlementCalculateRequest(BaseModel):
    period_start: date
    period_end: date
    vendor_id: Optional[UUID] = None


class SettlementCalculateResponse(BaseModel):
    settlements_created: int
    total_amount: Decimal


# ============================================
# Query Parameters
# ============================================
class SettlementQueryParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
