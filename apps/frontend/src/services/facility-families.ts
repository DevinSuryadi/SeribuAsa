import { apiFetch } from "./api";

export type FamilyInput = {
  kk_number: string;
  head_name: string;
  address?: string | null;
  phone?: string | null;
  family_size?: number | null;
};

export type Family = FamilyInput & {
  id: string;
  health_facility_id: string;
  created_at: string;
};

export type Facility = {
  id: string;
  name: string;
  facility_type: string | null;
  approval_status: string;
};

const familyPath = (familyId: string) => `/facilities/families/${encodeURIComponent(familyId)}`;

export const getMyFacility = (): Promise<Facility> => apiFetch("/facilities/me");
export const listFamilies = (): Promise<Family[]> => apiFetch("/facilities/families");
export const getFamily = (familyId: string): Promise<Family> => apiFetch(familyPath(familyId));
export const createFamily = (data: FamilyInput): Promise<Family> =>
  apiFetch("/facilities/families", { method: "POST", body: JSON.stringify(data) });
export const updateFamily = (familyId: string, data: FamilyInput): Promise<Family> =>
  apiFetch(familyPath(familyId), { method: "PUT", body: JSON.stringify(data) });

export async function getFamilyChildren(familyId: string) {
  return apiFetch(`${familyPath(familyId)}/children`);
}

export async function addFamilyChild(familyId: string, data: {
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
}) {
  return apiFetch(`${familyPath(familyId)}/children`, { method: "POST", body: JSON.stringify(data) });
}

export async function getFamilyMeasurementHistory(familyId: string, childId: string) {
  return apiFetch(`${familyPath(familyId)}/children/${encodeURIComponent(childId)}/measurements`);
}

export async function addFamilyMeasurement(familyId: string, data: {
  child_id: string;
  measurement_date: string;
  weight: number;
  height: number;
  muac?: number;
}) {
  return apiFetch(`${familyPath(familyId)}/children/${encodeURIComponent(data.child_id)}/measurements`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getFamilyFiesHistory(familyId: string) {
  const surveys = await apiFetch(`${familyPath(familyId)}/fies`);
  return { success: true, data: { surveys } };
}

export async function submitFamilyFies(familyId: string, data: { responses: Record<string, number> }) {
  const survey = await apiFetch(`${familyPath(familyId)}/fies`, { method: "POST", body: JSON.stringify(data) });
  return { success: true, data: survey };
}
