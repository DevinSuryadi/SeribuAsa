import { apiFetch } from "./api";

// ============================================
// Existing Endpoints
// ============================================

export async function getVoucherBalance(beneficiaryId: string) {
  return apiFetch(`/vouchers/balance/${beneficiaryId}`);
}

export async function getVoucherHistory(beneficiaryId: string) {
  return apiFetch(`/vouchers/history?beneficiary_id=${beneficiaryId}`);
}

export async function redeemVoucher(data: {
  voucher_codes: string[];
  amount: number;
  order_id: string;
}) {
  return apiFetch("/vouchers/redeem", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================
// NEW Endpoints - Validation & Eligibility
// ============================================

export async function validateVoucher(data: { code: string; amount: number }) {
  return apiFetch("/vouchers/validate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function checkProductEligibility(productIds: string[]) {
  return apiFetch("/vouchers/check-eligibility", {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds }),
  });
}

// ============================================
// NEW Endpoints - Redemption & History
// ============================================

export async function redeemSingleVoucher(data: {
  code: string;
  amount: number;
  order_id: string;
}) {
  return apiFetch("/vouchers/redeem-single", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTransactionHistory(params?: {
  beneficiary_id?: string;
  page?: number;
  page_size?: number;
  transaction_type?: string;
}) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
  }
  const query = qs.toString();
  return apiFetch(`/vouchers/transactions${query ? `?${query}` : ""}`);
}

export async function getAllowedVoucherCategories() {
  return apiFetch("/vouchers/allowed-categories");
}
