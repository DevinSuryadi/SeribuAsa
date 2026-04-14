"""
Report Schemas
Pydantic schemas for reporting and analytics
"""
from pydantic import BaseModel
from typing import List, Dict
from datetime import date
from decimal import Decimal


# ============================================
# Impact Report (Donor)
# ============================================
class ImpactSummary(BaseModel):
    total_donated: Decimal
    total_children_helped: int
    total_vouchers_allocated: int
    total_families_impacted: int


class DonationTrendItem(BaseModel):
    month: str
    amount: Decimal
    donations_count: int


class GeographicItem(BaseModel):
    district: str
    children: int
    amount: Decimal


class ImpactReportResponse(BaseModel):
    donor_id: str
    period: Dict[str, date]
    summary: ImpactSummary
    donation_trend: List[DonationTrendItem]
    geographic_distribution: List[GeographicItem]


# ============================================
# Sales Report (Vendor)
# ============================================
class SalesSummary(BaseModel):
    total_orders: int
    total_sales: Decimal
    total_voucher_redemptions: Decimal
    total_cash_received: Decimal
    pending_settlement: Decimal
    paid_settlement: Decimal


class DailySalesItem(BaseModel):
    date: date
    orders: int
    sales: Decimal


class TopProductItem(BaseModel):
    product_name: str
    quantity_sold: int
    revenue: Decimal


class SalesReportResponse(BaseModel):
    vendor_id: str
    period: Dict[str, date]
    summary: SalesSummary
    daily_sales: List[DailySalesItem]
    top_products: List[TopProductItem]


# ============================================
# Regional Report (Government)
# ============================================
class CoverageStats(BaseModel):
    total_beneficiaries: int
    total_children: int
    total_vendors: int
    districts_covered: int


class StuntingRate(BaseModel):
    current: float
    previous: float
    change_percentage: float
    trend: str


class BudgetUtilization(BaseModel):
    allocated: Decimal
    utilized: Decimal
    percentage: float


class DistrictItem(BaseModel):
    district: str
    beneficiaries: int
    children: int
    stunting_rate: float


class RegionalReportResponse(BaseModel):
    region: str
    period: Dict[str, date]
    coverage: CoverageStats
    stunting_rate: StuntingRate
    budget_utilization: BudgetUtilization
    district_breakdown: List[DistrictItem]


# ============================================
# Demographics Report
# ============================================
class DemographicItem(BaseModel):
    label: str
    count: int
    percentage: float


class DemographicsReportResponse(BaseModel):
    age_distribution: List[DemographicItem]
    gender_distribution: List[DemographicItem]
    nutrition_status: List[DemographicItem]
    fies_classification: List[DemographicItem]


# ============================================
# Settlement Report (Vendor)
# ============================================
class SettlementSummary(BaseModel):
    total_revenue: Decimal
    total_settlements: int
    settled_amount: Decimal
    pending_amount: Decimal
    pending_count: int
    average_settlement_days: float


class DailySettlementItem(BaseModel):
    date: date
    amount: Decimal
    status: str


class SettlementTrends(BaseModel):
    month_over_month_growth: float
    average_settlement_time: float
    settlement_success_rate: float


class SettlementReportResponse(BaseModel):
    vendor_id: str
    period: Dict[str, date]
    summary: SettlementSummary
    daily_settlements: List[DailySettlementItem]
    trends: SettlementTrends
