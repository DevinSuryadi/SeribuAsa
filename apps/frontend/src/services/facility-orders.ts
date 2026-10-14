import { apiFetch } from "./api";

export type FacilityOrder = {
  id: string;
  family_id: string;
  family_name: string | null;
  health_facility_name: string | null;
  delivery_address: string | null;
  service_province_code?: string | null;
  service_regency_code?: string | null;
  vendor_id: string;
  vendor_name: string | null;
  items: { product_id: string; product_name: string; quantity: number; price: number; subtotal: number }[];
  total_amount: number;
  status: "pending_approval" | "pending" | "processing" | "received" | "completed" | "cancelled" | "rejected";
  payment_status: string;
  allocation_status?: "requested" | "approved" | "rejected" | "cancelled" | null;
  allocation_decided_at?: string | null;
  allocation_reason?: string | null;
  funding_status: "not_connected" | "partial" | "reserved" | "spent";
  funded_amount: number;
  spent_amount: number;
  created_at: string;
  dispatched_at?: string | null;
  received_at: string | null;
  arrived_at?: string | null;
  receipt_status?: "accepted" | "discrepancy" | null;
  receipt_evidence_url?: string | null;
  discrepancy_notes?: string | null;
  receipt_notes: string | null;
  payout_status?: "pending_approval" | "approved" | "paid" | null;
  payout_due_at?: string | null;
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
export const createFacilityOrder = (data: {
  family_id: string;
  vendor_id: string;
  service_province_code: string;
  service_regency_code: string;
  client_request_id: string;
  items: { product_id: string; quantity: number }[];
}): Promise<FacilityOrder> =>
  apiFetch("/facilities/orders", { method: "POST", body: JSON.stringify(data) });
export const cancelFacilityOrder = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/facilities/orders/${encodeURIComponent(id)}/cancel`, { method: "POST" });
export const confirmFacilityReceipt = (id: string, data: {
  arrived_at: string;
  items_complete: boolean;
  evidence_url?: string;
  notes?: string;
}): Promise<FacilityOrder> =>
  apiFetch(`/facilities/orders/${encodeURIComponent(id)}/receipt`, { method: "POST", body: JSON.stringify(data) });
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
export const listAdminFacilityOrders = (): Promise<FacilityOrder[]> => apiFetch("/admin/facility-orders");
export const approveFacilityAllocation = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/admin/facility-orders/${encodeURIComponent(id)}/approve`, { method: "POST" });
export const rejectFacilityAllocation = (id: string, reason: string): Promise<FacilityOrder> =>
  apiFetch(`/admin/facility-orders/${encodeURIComponent(id)}/reject`, { method: "POST", body: JSON.stringify({ reason }) });

export type EligibleVendor = { id: string; store_name: string; product_count: number };

export const listEligibleVendors = (provinceCode: string, regencyCode: string): Promise<EligibleVendor[]> =>
  apiFetch(`/facilities/catalog/vendors?province_code=${encodeURIComponent(provinceCode)}&regency_code=${encodeURIComponent(regencyCode)}`);
