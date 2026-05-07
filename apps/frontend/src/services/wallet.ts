import { apiFetch } from "./api";

export interface WalletBalance {
  wallet_balance: number;
  wallet_held: number;
  wallet_available: number;
  expiring_soon: number;
  earliest_expiry: string | null;
}

export interface WalletTransaction {
  id: string;
  transaction_type: "credit" | "hold" | "unhold" | "debit" | "expired";
  amount: number;
  balance_after: number | null;
  description: string | null;
  order_id: string | null;
  allocation_id: string | null;
  created_at: string | null;
}

export interface WalletAllocation {
  id: string;
  donation_id: string | null;
  original_amount: number;
  remaining_amount: number;
  allocated_at: string | null;
  expires_at: string | null;
  status: "active" | "depleted" | "expired";
  is_expired: boolean;
  days_until_expiry: number | null;
}

export interface WalletTransactionsResponse {
  items: WalletTransaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface WalletAllocationsResponse {
  items: WalletAllocation[];
  total: number;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  return apiFetch("/wallet/balance");
}

export async function getWalletTransactions(params?: {
  page?: number;
  page_size?: number;
  transaction_type?: string;
}): Promise<WalletTransactionsResponse> {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
  }
  const query = qs.toString();
  return apiFetch(`/wallet/transactions${query ? `?${query}` : ""}`);
}

export async function getWalletAllocations(
  status?: string
): Promise<WalletAllocationsResponse> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch(`/wallet/allocations${qs}`);
}

export async function getOrderPickupQr(orderId: string): Promise<{
  order_id: string;
  qr_code: string;
  qr_value: string;
  total_amount: number;
  pickup_expires_at: string | null;
  cancel_deadline: string | null;
  vendor_name: string | null;
  items: { name: string; quantity: number; price: number }[];
  status: string;
}> {
  return apiFetch(`/orders/${orderId}/pickup-qr`);
}

export async function confirmOrderPickup(
  orderId: string,
  qrCode: string
): Promise<unknown> {
  return apiFetch(`/orders/${orderId}/confirm-pickup`, {
    method: "POST",
    body: JSON.stringify({ qr_code: qrCode }),
  });
}

export async function cancelOrder(orderId: string): Promise<unknown> {
  return apiFetch(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
