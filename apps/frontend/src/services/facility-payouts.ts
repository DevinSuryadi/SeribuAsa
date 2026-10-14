import { apiFetch } from "./api";

export type FacilityPayout = {
  id: string;
  order_id: string;
  vendor_id: string;
  vendor_name: string | null;
  amount: number;
  status: "pending_approval" | "approved" | "paid";
  arrived_at: string | null;
  confirmed_at: string | null;
  receipt_evidence_url: string | null;
  receipt_notes: string | null;
  order_status: string | null;
  due_at: string;
  overdue: boolean;
  late: boolean;
  approved_at: string | null;
  approved_by_user_id: string | null;
  paid_at: string | null;
  recorded_at: string | null;
  paid_by_user_id: string | null;
  transfer_reference: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
};

export const listAdminFacilityPayouts = (): Promise<FacilityPayout[]> => apiFetch("/admin/facility-payouts");
export const listVendorFacilityPayouts = (): Promise<FacilityPayout[]> => apiFetch("/vendor/facility-payouts");
export const approveFacilityPayout = (id: string): Promise<FacilityPayout> =>
  apiFetch(`/admin/facility-payouts/${encodeURIComponent(id)}/approve`, { method: "POST" });
export const recordFacilityTransfer = (id: string, transferReference: string, transferredAt: string): Promise<FacilityPayout> =>
  apiFetch(`/admin/facility-payouts/${encodeURIComponent(id)}/record-transfer`, {
    method: "POST", body: JSON.stringify({ transfer_reference: transferReference, transferred_at: transferredAt }),
  });
