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
  distribution: {
    id: string;
    recipient_name: string | null;
    recipient_relation: string | null;
    evidence_url: string | null;
    items_complete: boolean;
    notes: string | null;
    distributed_at: string;
  } | null;
};

const refreshOptions = (forceRefresh: boolean): RequestInit | undefined =>
  forceRefresh ? { cache: "no-store" } : undefined;

export const listFacilityOrders = (familyId?: string, forceRefresh = false): Promise<FacilityOrder[]> =>
  apiFetch(`/facilities/orders${familyId ? `?family_id=${encodeURIComponent(familyId)}` : ""}`, refreshOptions(forceRefresh));
export const listFacilityRedemptions = (familyId?: string, forceRefresh = false): Promise<FacilityOrder[]> =>
  apiFetch(`/facilities/orders/history${familyId ? `?family_id=${encodeURIComponent(familyId)}` : ""}`, refreshOptions(forceRefresh));
export const createFacilityOrder = (data: { family_id: string; client_request_id: string; items: { product_id: string; quantity: number }[] }): Promise<FacilityOrder> =>
  apiFetch("/facilities/orders", { method: "POST", body: JSON.stringify(data) });
export const cancelFacilityOrder = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/facilities/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });
export const distributeFacilityOrder = (id: string, data: {
  recipient_name: string;
  recipient_relation?: string;
  evidence_url: string;
  items_complete: boolean;
  notes?: string;
}): Promise<FacilityOrder> =>
  apiFetch(`/facilities/orders/${encodeURIComponent(id)}/distribute`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const listVendorFacilityOrders = (): Promise<FacilityOrder[]> => apiFetch("/vendor/facility-orders");
export const dispatchFacilityOrder = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/vendor/facility-orders/${encodeURIComponent(id)}/dispatch`, { method: "POST" });
