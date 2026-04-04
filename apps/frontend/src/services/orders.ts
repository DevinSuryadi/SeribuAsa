import { apiFetch } from "./api";

export async function createOrder(data: {
  vendor_id: string;
  items: { product_id: string; quantity: number; price: number }[];
  voucher_codes?: string[];
  notes?: string;
}) {
  return apiFetch("/orders/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getOrders(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
  }
  const query = qs.toString();
  return apiFetch(`/orders/${query ? `?${query}` : ""}`);
}

export async function getOrder(id: string) {
  return apiFetch(`/orders/${id}`);
}

export async function updateOrderStatus(
  id: string,
  status: "completed" | "cancelled"
) {
  return apiFetch(`/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
