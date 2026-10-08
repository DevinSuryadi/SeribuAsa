import { apiFetch } from "./api";

export type FacilityOrder = {
  id: string;
  family_id: string;
  family_name: string | null;
  health_facility_name: string | null;
  delivery_address: string | null;
  vendor_id: string;
  vendor_name: string | null;
  items: { product_id: string; product_name: string; quantity: number; price: number; subtotal: number }[];
  total_amount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  payment_status: string;
  funding_status: "not_connected" | "partial" | "reserved" | "spent";
  funded_amount: number;
  spent_amount: number;
  created_at: string;
  received_at: string | null;
  receipt_notes: string | null;
};

export const listFacilityOrders = (): Promise<FacilityOrder[]> => apiFetch("/facilities/orders");
export const listFacilityRedemptions = (familyId?: string): Promise<FacilityOrder[]> =>
  apiFetch(`/facilities/orders/history${familyId ? `?family_id=${encodeURIComponent(familyId)}` : ""}`);
export const createFacilityOrder = (data: { family_id: string; client_request_id: string; items: { product_id: string; quantity: number }[] }): Promise<FacilityOrder> =>
  apiFetch("/facilities/orders", { method: "POST", body: JSON.stringify(data) });
export const cancelFacilityOrder = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/facilities/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });
export const receiveFacilityOrder = (token: string, notes?: string): Promise<FacilityOrder> =>
  apiFetch("/facilities/orders/receive", { method: "POST", body: JSON.stringify({ token, notes }) });
export const previewFacilityHandover = (token: string): Promise<FacilityOrder> =>
  apiFetch("/facilities/orders/preview-handover", { method: "POST", body: JSON.stringify({ token }) });
export const listVendorFacilityOrders = (): Promise<FacilityOrder[]> => apiFetch("/vendor/facility-orders");
export const dispatchFacilityOrder = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/vendor/facility-orders/${encodeURIComponent(id)}/dispatch`, { method: "POST" });
export const createHandoverToken = (id: string): Promise<{ token: string; expires_at: string; order_id: string }> =>
  apiFetch(`/vendor/facility-orders/${encodeURIComponent(id)}/handover-token`, { method: "POST" });
