import { apiFetch } from "./api";

export interface Settlement {
  id: string;
  vendor_id: string;
  vendor_store_name?: string;
  period_start: string;
  period_end: string;
  total_redemptions: number;
  admin_fee: number;
  net_amount: number;
  status: "calculating" | "ready" | "processing" | "paid" | "cancelled";
  payout_date?: string;
  bank_transfer_reference?: string;
  created_at: string;
}

export interface SettlementDetail extends Settlement {
  vendor_bank_name?: string;
  vendor_bank_account?: string;
  vendor_account_holder?: string;
  admin_fee_percentage: number;
  breakdown: Array<{
    date: string;
    redemptions: number;
    amount: number;
  }>;
  notes?: string;
}

export interface SettlementListResponse {
  items: Settlement[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function getSettlements(
  page: number = 1,
  page_size: number = 20,
  status?: string
): Promise<SettlementListResponse> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("page_size", page_size.toString());
  if (status) {
    params.append("status", status);
  }
  return apiFetch(`/settlements/?${params.toString()}`);
}

export async function getSettlementDetail(settlementId: string): Promise<SettlementDetail> {
  return apiFetch(`/settlements/${settlementId}`);
}

export async function markSettlementPaid(
  settlementId: string,
  bankTransferReference: string,
  payoutDate?: string
): Promise<Settlement> {
  const data: Record<string, string> = {
    bank_transfer_reference: bankTransferReference,
  };
  if (payoutDate) {
    data.payout_date = payoutDate;
  }
  return apiFetch(`/settlements/${settlementId}/mark-paid`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function requestSettlementPayout(settlementId: string): Promise<Settlement> {
  return apiFetch(`/settlements/${settlementId}/request-payout`, {
    method: "POST",
  });
}

export async function calculateSettlements(
  periodStart: string,
  periodEnd: string,
  vendorId?: string
): Promise<{ settlements_created: number; total_amount: number }> {
  const data: Record<string, string> = {
    period_start: periodStart,
    period_end: periodEnd,
  };
  if (vendorId) {
    data.vendor_id = vendorId;
  }
  return apiFetch("/settlements/calculate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Export settlements as CSV
 * @param format - 'csv' (pdf not yet supported)
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Blob of the CSV file
 */
export async function exportSettlements(
  format: "csv" | "pdf" = "csv",
  startDate?: string,
  endDate?: string
): Promise<Blob> {
  const params = new URLSearchParams();
  params.append("format", format);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/settlements/export?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Gagal mengekspor settlement");
  }

  return response.blob();
}
