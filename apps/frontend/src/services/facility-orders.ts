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
  status: "pending_approval" | "pending" | "processing" | "shipped" | "received" | "completed" | "cancelled" | "rejected";
  payment_status: string;
  allocation_status?: "automatic" | "requested" | "approved" | "rejected" | "cancelled" | null;
  allocation_decided_at?: string | null;
  allocation_reason?: string | null;
  funding_status: "not_connected" | "partial" | "reserved" | "spent";
  funded_amount: number;
  spent_amount: number;
  created_at: string;
  vendor_confirmed_at?: string | null;
  vendor_rejected_at?: string | null;
  vendor_rejection_reason?: string | null;
  dispatched_at?: string | null;
  received_at: string | null;
  arrived_at?: string | null;
  receipt_status?: "accepted" | "discrepancy" | null;
  receipt_evidence_url?: string | null;
  discrepancy_notes?: string | null;
  facility_phone?: string | null;
  process_due_at?: string | null;
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

// Status changes come from the vendor's session, so this list can never be served from cache.
export const listFacilityOrders = (familyId?: string): Promise<FacilityOrder[]> =>
  apiFetch(`/facilities/orders${familyId ? `?family_id=${encodeURIComponent(familyId)}` : ""}`, { cache: "no-store" });
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
export const listVendorFacilityOrders = (): Promise<FacilityOrder[]> =>
  apiFetch("/vendor/facility-orders", { cache: "no-store" });
export const confirmVendorFacilityOrder = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/vendor/facility-orders/${encodeURIComponent(id)}/confirm`, { method: "POST" });
export const rejectVendorFacilityOrder = (id: string, reason: string): Promise<FacilityOrder> =>
  apiFetch(`/vendor/facility-orders/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
export const dispatchFacilityOrder = (id: string): Promise<FacilityOrder> =>
  apiFetch(`/vendor/facility-orders/${encodeURIComponent(id)}/dispatch`, { method: "POST" });
export const rejectFacilityOrder = (id: string, reason: string): Promise<FacilityOrder> =>
  apiFetch(`/vendor/facility-orders/${encodeURIComponent(id)}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
export const adminCancelFacilityOrder = (id: string, reason: string): Promise<FacilityOrder> =>
  apiFetch(`/admin/facility-orders/${encodeURIComponent(id)}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
export const listAdminFacilityOrders = (pendingOnly = false): Promise<FacilityOrder[]> =>
  apiFetch(`/admin/facility-orders${pendingOnly ? "?pending_only=true" : ""}`, { cache: "no-store" });

export type EligibleVendor = { id: string; store_name: string; product_count: number };

export const listEligibleVendors = (provinceCode: string, regencyCode: string): Promise<EligibleVendor[]> =>
  apiFetch(`/facilities/catalog/vendors?province_code=${encodeURIComponent(provinceCode)}&regency_code=${encodeURIComponent(regencyCode)}`);
