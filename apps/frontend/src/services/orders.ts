import { apiFetch } from "./api";

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
) {
  return apiFetch("/orders/", {
    method: "POST",
    headers: {
      "Idempotency-Key": options?.idempotencyKey || makeIdempotencyKey(),
    },
    body: JSON.stringify(data),
  });
}

export async function getOrders(params?: { page?: number; page_size?: number; status?: string }) {
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
    orders: items,
    items,
    total: Number(response?.total ?? 0),
    page: Number(response?.page ?? params?.page ?? 1),
    page_size: Number(response?.page_size ?? params?.page_size ?? 20),
    total_pages: Number(response?.total_pages ?? 1),
  };
}

export async function getOrder(id: string) {
  return apiFetch(`/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: "completed" | "cancelled") {
  return apiFetch(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
