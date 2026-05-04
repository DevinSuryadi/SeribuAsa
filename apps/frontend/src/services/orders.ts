import { apiFetch } from "./api";
import type { OrdersResponse, Order } from "@/types/orders";

export interface OrderCreateResponse {
  id: string;
  vendor_id: string;
  items: any[];
  notes?: string;
  status: string;
  cart_total: number;
  cash_amount: number;
  voucher_discount: number;
  applied_voucher?: {
    code: string;
    applied_amount: number;
  };
}

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createOrder(
  data: {
    vendor_id: string;
    items: { product_id: string; quantity: number; price: number }[];
    voucher_codes?: string[];
    notes?: string;
  },
  options?: { idempotencyKey?: string }
): Promise<OrderCreateResponse> {
  return apiFetch("/orders/", {
    method: "POST",
    headers: {
      "Idempotency-Key": options?.idempotencyKey || makeIdempotencyKey(),
    },
    body: JSON.stringify(data),
  });
}

export async function getOrders(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<OrdersResponse> {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
  }
  const query = qs.toString();
  const response = await apiFetch(`/orders/${query ? `?${query}` : ""}`);

  const items = Array.isArray(response?.items) ? response.items : [];

  return {
    orders: items as Order[],
    total: Number(response?.total ?? 0),
    page: Number(response?.page ?? params?.page ?? 1),
    page_size: Number(response?.page_size ?? params?.page_size ?? 20),
    total_pages: Number(response?.total_pages ?? 1),
  };
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch(`/orders/${id}`);
}

export async function updateOrderStatus(
  id: string,
  status: "completed" | "cancelled"
): Promise<Order> {
  return apiFetch(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
