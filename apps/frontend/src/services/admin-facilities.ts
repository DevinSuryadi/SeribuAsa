import { apiFetch } from "./api";

export type AdminFacility = {
  id: string;
  name: string;
  facility_type: string | null;
  address: string | null;
  phone: string | null;
  approval_status: "pending" | "approved" | "rejected";
  review_reason: string | null;
  reviewed_at: string | null;
};

export const listAdminFacilities = (): Promise<AdminFacility[]> => apiFetch("/admin/facilities");
export const approveFacility = (id: string): Promise<AdminFacility> => apiFetch(`/admin/facilities/${encodeURIComponent(id)}/approve`, { method: "POST" });
export const rejectFacility = (id: string, reason: string): Promise<AdminFacility> => apiFetch(`/admin/facilities/${encodeURIComponent(id)}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
