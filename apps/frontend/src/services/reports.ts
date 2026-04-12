import { apiFetch } from "./api";

// ============================================
// Impact Report (Donor)
// ============================================
export interface ImpactSummary {
  total_donated: number;
  total_children_helped: number;
  total_vouchers_allocated: number;
  total_families_impacted: number;
}

export interface DonationTrendItem {
  month: string;
  amount: number;
  donations_count: number;
}

export interface GeographicItem {
  district: string;
  children: number;
  amount: number;
}

export interface ImpactReport {
  donor_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: ImpactSummary;
  donation_trend: DonationTrendItem[];
  geographic_distribution: GeographicItem[];
}

// ============================================
// Sales Report (Vendor)
// ============================================
export interface SalesSummary {
  total_orders: number;
  total_sales: number;
  total_voucher_redemptions: number;
  total_cash_received: number;
  pending_settlement: number;
  paid_settlement: number;
}

export interface DailySalesItem {
  date: string;
  orders: number;
  sales: number;
}

export interface TopProductItem {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

export interface SalesReport {
  vendor_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: SalesSummary;
  daily_sales: DailySalesItem[];
  top_products: TopProductItem[];
}

// ============================================
// Regional Report (Government)
// ============================================
export interface CoverageStats {
  total_beneficiaries: number;
  total_children: number;
  total_vendors: number;
  districts_covered: number;
}

export interface StuntingRate {
  current: number;
  previous: number;
  change_percentage: number;
  trend: string;
}

export interface BudgetUtilization {
  allocated: number;
  utilized: number;
  percentage: number;
}

export interface DistrictItem {
  district: string;
  beneficiaries: number;
  children: number;
  stunting_rate: number;
}

export interface RegionalReport {
  region: string;
  period: {
    start_date: string;
    end_date: string;
  };
  coverage: CoverageStats;
  stunting_rate: StuntingRate;
  budget_utilization: BudgetUtilization;
  district_breakdown: DistrictItem[];
}

// ============================================
// Demographics Report
// ============================================
export interface DemographicItem {
  label: string;
  count: number;
  percentage: number;
}

export interface DemographicsReport {
  age_distribution: DemographicItem[];
  gender_distribution: DemographicItem[];
  nutrition_status: DemographicItem[];
  fies_classification: DemographicItem[];
}

// ============================================
// API Functions
// ============================================

/**
 * Get impact report for donor dashboard
 * Requires donor authentication
 */
export async function getImpactReport(
  startDate?: string,
  endDate?: string
): Promise<ImpactReport> {
  const params = new URLSearchParams();
  if (startDate) {
    params.append("start_date", startDate);
  }
  if (endDate) {
    params.append("end_date", endDate);
  }
  const response = await apiFetch(
    `/reports/impact${params.toString() ? "?" + params.toString() : ""}`
  );
  return response.data;
}

/**
 * Get sales report for vendor dashboard
 * Requires vendor authentication
 */
export async function getSalesReport(
  startDate?: string,
  endDate?: string
): Promise<SalesReport> {
  const params = new URLSearchParams();
  if (startDate) {
    params.append("start_date", startDate);
  }
  if (endDate) {
    params.append("end_date", endDate);
  }
  const response = await apiFetch(
    `/reports/sales${params.toString() ? "?" + params.toString() : ""}`
  );
  return response.data;
}

/**
 * Get regional analytics report
 * Requires government or admin role
 */
export async function getRegionalReport(
  startDate?: string,
  endDate?: string
): Promise<RegionalReport> {
  const params = new URLSearchParams();
  if (startDate) {
    params.append("start_date", startDate);
  }
  if (endDate) {
    params.append("end_date", endDate);
  }
  const response = await apiFetch(
    `/reports/regional${params.toString() ? "?" + params.toString() : ""}`
  );
  return response.data;
}

/**
 * Get demographic breakdown reports
 * Requires government or admin role
 */
export async function getDemographicsReport(): Promise<DemographicsReport> {
  const response = await apiFetch("/reports/demographics");
  return response.data;
}
