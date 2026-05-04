import { apiFetch } from "./api";

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ============================================
// Existing Endpoints
// ============================================

export async function getVoucherBalance(beneficiaryId: string) {
  return apiFetch(`/vouchers/balance/${beneficiaryId}`);
}

export async function getVoucherHistory(beneficiaryId: string) {
  return apiFetch(`/vouchers/history?beneficiary_id=${beneficiaryId}`);
}

export async function redeemVoucher(
  data: {
    voucher_codes: string[];
    amount: number;
    order_id: string;
  },
  options?: { idempotencyKey?: string }
) {
  return apiFetch("/vouchers/redeem", {
    method: "POST",
    headers: {
      "Idempotency-Key": options?.idempotencyKey || makeIdempotencyKey(),
    },
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

export async function redeemSingleVoucher(
  data: {
    code: string;
    amount: number;
    order_id: string;
  },
  options?: { idempotencyKey?: string }
) {
  return apiFetch("/vouchers/redeem-single", {
    method: "POST",
    headers: {
      "Idempotency-Key": options?.idempotencyKey || makeIdempotencyKey(),
    },
    body: JSON.stringify(data),
  });
}

export async function redeemQrVoucher(
  data: {
    code: string;
    amount: number;
    notes?: string;
  },
  options?: { idempotencyKey?: string }
) {
  return apiFetch("/vouchers/redeem-qr", {
    method: "POST",
    headers: {
      "Idempotency-Key": options?.idempotencyKey || makeIdempotencyKey(),
    },
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
  const response = await apiFetch(`/vouchers/transactions${query ? `?${query}` : ""}`);
  const items = Array.isArray(response?.items) ? response.items : [];

  return {
    items,
    total: Number(response?.total ?? items.length),
    page: Number(response?.page ?? params?.page ?? 1),
    page_size: Number(response?.page_size ?? params?.page_size ?? 10),
    total_pages: Number(response?.total_pages ?? 1),
  };
}

export async function getAllowedVoucherCategories() {
  return apiFetch("/vouchers/allowed-categories");
}
