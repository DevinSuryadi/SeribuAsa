"""
Settlement Schemas
Pydantic schemas for settlement management
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


# ============================================
# Pagination Schema
# ============================================
class PaginationMeta(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)


# ============================================
# Settlement Schemas
# ============================================
class SettlementResponse(BaseModel):
    id: UUID
    vendor_id: UUID
    vendor_store_name: Optional[str] = None
    period_start: date
    period_end: date
    total_redemptions: Decimal = Field(ge=0, decimal_places=2)
    admin_fee: Decimal = Field(ge=0, decimal_places=2)
    net_amount: Decimal = Field(ge=0, decimal_places=2)
    status: Literal["calculating", "ready", "paid", "cancelled"] = "calculating"
    payout_date: Optional[date] = None
    bank_transfer_reference: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("net_amount", mode="before")
    @classmethod
    def validate_net_amount(cls, v, info):
        if info.data.get("total_redemptions") is not None and info.data.get("admin_fee") is not None:
            expected = info.data["total_redemptions"] - info.data["admin_fee"]
            if Decimal(str(v)) != expected:
                raise ValueError("net_amount must equal total_redemptions - admin_fee")
        return v


class SettlementDetailResponse(SettlementResponse):
    vendor_bank_name: Optional[str] = Field(default=None, max_length=100)
    vendor_bank_account: Optional[str] = Field(default=None, max_length=20)
    vendor_account_holder: Optional[str] = Field(default=None, max_length=255)
    admin_fee_percentage: float = Field(default=1.0, ge=0, le=100)
    breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None, max_length=500)


class SettlementListResponse(BaseModel):
    items: List[SettlementResponse] = Field(default_factory=list)
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_pages: int = Field(ge=0)

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Settlement Calculation
# ============================================
class SettlementCalculateRequest(BaseModel):
    period_start: date
    period_end: date
    vendor_id: Optional[UUID] = None

    @field_validator("period_end")
    @classmethod
    def validate_period(cls, v, info):
        if info.data.get("period_start") and v <= info.data["period_start"]:
            raise ValueError("period_end must be after period_start")
        return v


class SettlementCalculateResponse(BaseModel):
    settlements_created: int = Field(ge=0)
    total_amount: Decimal = Field(ge=0, decimal_places=2)


# ============================================
# Settlement Mark As Paid
# ============================================
class SettlementMarkPaidRequest(BaseModel):
    bank_transfer_reference: str = Field(min_length=1, max_length=100)
    payout_date: Optional[date] = None

    @field_validator("payout_date")
    @classmethod
    def validate_payout_date(cls, v):
        if v and v > date.today():
            raise ValueError("payout_date cannot be in the future")
        return v


class SettlementMarkPaidResponse(SettlementResponse):
    """Response after marking settlement as paid"""
    pass


# ============================================
# Settlement Export
# ============================================
class SettlementExportRequest(BaseModel):
    format: Literal["pdf", "csv"] = "pdf"
    include_breakdown: bool = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SettlementExportResponse(BaseModel):
    success: bool = True
    file_url: str = Field(min_length=1)
    filename: str = Field(min_length=1)
    format: Literal["pdf", "csv"]
    generated_at: datetime


# ============================================
# Query Parameters
# ============================================
class SettlementQueryParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    status: Optional[Literal["calculating", "ready", "paid", "cancelled"]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v, info):
        if v and info.data.get("start_date") and v < info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


# ============================================
# Error Response Schema
# ============================================
class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class SettlementErrorResponse(BaseModel):
    success: bool = False
    errors: List[ErrorDetail]
    timestamp: Optional[str] = None
