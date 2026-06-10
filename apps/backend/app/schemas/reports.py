"""
Report Schemas
Pydantic schemas for reporting and analytics
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Dict, Optional, Literal
from datetime import date
from decimal import Decimal
import enum


# ============================================
# Enums
# ============================================
class ExportFormatEnum(str, enum.Enum):
    json = "json"
    csv = "csv"
    pdf = "pdf"


# ============================================
# Pagination Schema
# ============================================
class PaginationMetadata(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)


# ============================================
# Error Response Schema
# ============================================
class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    errors: List[ErrorDetail]
    timestamp: Optional[str] = None


# ============================================
# Impact Report (Donor)
# ============================================
class ImpactSummary(BaseModel):
    total_donated: Decimal = Field(ge=0, decimal_places=2)
    total_children_helped: int = Field(ge=0)
    total_vouchers_allocated: int = Field(ge=0)
    total_families_impacted: int = Field(ge=0)
    total_vouchers_redeemed: int = Field(ge=0, default=0)
    nutrition_improvement_rate: float = Field(ge=0, le=100, default=0)

    @field_validator("total_donated", mode="before")
    @classmethod
    def validate_decimal(cls, v):
        if v is None:
            return Decimal("0")
        return Decimal(str(v))


class VoucherCategoryItem(BaseModel):
    category: str = Field(min_length=1, max_length=255)
    total: int = Field(ge=0)


class DonationTrendItem(BaseModel):
    month: str = Field(pattern=r"^\d{4}-\d{2}$")  # YYYY-MM format
    amount: Decimal = Field(ge=0, decimal_places=2)
    donations_count: int = Field(ge=0)


class GeographicItem(BaseModel):
    province: str = Field(min_length=1, max_length=255)
    children: int = Field(ge=0)
    amount: Decimal = Field(ge=0, decimal_places=2)


class ImpactReportResponse(BaseModel):
    donor_id: str
    period: Dict[str, date]
    summary: ImpactSummary
    donation_trend: List[DonationTrendItem] = Field(default_factory=list)
    geographic_distribution: List[GeographicItem] = Field(default_factory=list)
    voucher_category_usage: List[VoucherCategoryItem] = Field(default_factory=list)
    top_products: List["TopProductItem"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Sales Report (Vendor)
# ============================================
class SalesSummary(BaseModel):
    total_orders: int = Field(ge=0)
    total_sales: Decimal = Field(ge=0, decimal_places=2)
    total_voucher_redemptions: Decimal = Field(ge=0, decimal_places=2)
    total_cash_received: Decimal = Field(ge=0, decimal_places=2)
    pending_settlement: Decimal = Field(ge=0, decimal_places=2)
    paid_settlement: Decimal = Field(ge=0, decimal_places=2)


class DailySalesItem(BaseModel):
    date: date
    order_count: int = Field(ge=0)
    total: Decimal = Field(ge=0, decimal_places=2)


class TopProductItem(BaseModel):
    product_name: str = Field(min_length=1, max_length=255)
    quantity_sold: int = Field(ge=0)
    revenue: Decimal = Field(ge=0, decimal_places=2)


class SalesReportResponse(BaseModel):
    vendor_id: str
    period: Dict[str, date]
    summary: SalesSummary
    daily_sales: List[DailySalesItem] = Field(default_factory=list)
    top_products: List[TopProductItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Regional Report (Government)
# ============================================
class CoverageStats(BaseModel):
    total_beneficiaries: int = Field(ge=0)
    total_children: int = Field(ge=0)
    total_vendors: int = Field(ge=0)
    districts_covered: int = Field(ge=0)


class StuntingRate(BaseModel):
    current: float = Field(ge=0, le=100)
    previous: float = Field(ge=0, le=100)
    change_percentage: float = Field(ge=-100, le=100)
    trend: Literal["improving", "stable", "worsening"] = "stable"


class BudgetUtilization(BaseModel):
    allocated: Decimal = Field(ge=0, decimal_places=2)
    utilized: Decimal = Field(ge=0, decimal_places=2)
    percentage: float = Field(ge=0, le=100)

    @field_validator("percentage")
    @classmethod
    def validate_percentage(cls, v, info):
        if info.data.get("allocated") and info.data.get("allocated") > 0:
            expected = float(info.data["utilized"]) / float(info.data["allocated"]) * 100
            if abs(v - expected) > 0.01:  # Allow small floating point differences
                raise ValueError("Percentage must match utilized/allocated calculation")
        return v


class DistrictItem(BaseModel):
    district: str = Field(min_length=1, max_length=255)
    beneficiaries: int = Field(ge=0)
    children: int = Field(ge=0)
    stunting_rate: float = Field(ge=0, le=100)


class RegionalReportResponse(BaseModel):
    region: str = Field(min_length=1, max_length=255)
    period: Dict[str, date]
    coverage: CoverageStats
    stunting_rate: StuntingRate
    budget_utilization: BudgetUtilization
    district_breakdown: List[DistrictItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Demographics Report
# ============================================
class DemographicItem(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    count: int = Field(ge=0)
    percentage: float = Field(ge=0, le=100)


class DemographicsReportResponse(BaseModel):
    age_distribution: List[DemographicItem] = Field(default_factory=list)
    gender_distribution: List[DemographicItem] = Field(default_factory=list)
    nutrition_status: List[DemographicItem] = Field(default_factory=list)
    fies_classification: List[DemographicItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Settlement Report (Vendor)
# ============================================
class SettlementSummary(BaseModel):
    total_revenue: Decimal = Field(ge=0, decimal_places=2)
    total_settlements: int = Field(ge=0)
    settled_amount: Decimal = Field(ge=0, decimal_places=2)
    pending_amount: Decimal = Field(ge=0, decimal_places=2)
    pending_count: int = Field(ge=0)
    average_settlement_days: float = Field(ge=0)


class DailySettlementItem(BaseModel):
    date: date
    amount: Decimal = Field(ge=0, decimal_places=2)
    status: Literal["calculating", "ready", "paid", "cancelled"] = "calculating"


class SettlementTrends(BaseModel):
    month_over_month_growth: float
    average_settlement_time: float = Field(ge=0)
    settlement_success_rate: float = Field(ge=0, le=100)


class SettlementReportResponse(BaseModel):
    vendor_id: str
    period: Dict[str, date]
    summary: SettlementSummary
    daily_settlements: List[DailySettlementItem] = Field(default_factory=list)
    trends: SettlementTrends

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Report Query Parameters
# ============================================
class ReportQueryParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    export_format: Optional[ExportFormatEnum] = None

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v, info):
        if v and info.data.get("start_date") and v < info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


# ============================================
# Paginated Report Response Wrapper
# ============================================
class PaginatedReportResponse(BaseModel):
    success: bool = True
    data: Dict
    pagination: Optional[PaginationMetadata] = None
    timestamp: Optional[str] = None
