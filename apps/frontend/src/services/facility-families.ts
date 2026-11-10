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
  latest_fies?: { score: number; classification: string; survey_date: string } | null;
};

export type Facility = {
  id: string;
  name: string;
  facility_type: string | null;
  address?: string | null;
  phone?: string | null;
  approval_status: string;
  review_reason?: string | null;
  province_code?: string | null;
  regency_code?: string | null;
};

const familyPath = (familyId: string) => `/facilities/families/${encodeURIComponent(familyId)}`;

const refreshOptions = (forceRefresh: boolean): RequestInit | undefined =>
  forceRefresh ? { cache: "no-store" } : undefined;

export const getMyFacility = (forceRefresh = false): Promise<Facility> =>
  apiFetch("/facilities/me", refreshOptions(forceRefresh));
export const updateMyFacilityContact = (data: { address: string; phone?: string }): Promise<Facility> =>
  apiFetch("/facilities/me", { method: "PATCH", body: JSON.stringify(data) });
export const listFamilies = (forceRefresh = false): Promise<Family[]> =>
  apiFetch("/facilities/families", refreshOptions(forceRefresh));
export const getFamily = (familyId: string, forceRefresh = false): Promise<Family> =>
  apiFetch(familyPath(familyId), refreshOptions(forceRefresh));
export const createFamily = (data: FamilyInput): Promise<Family> =>
  apiFetch("/facilities/families", { method: "POST", body: JSON.stringify(data) });
export const updateFamily = (familyId: string, data: FamilyInput): Promise<Family> =>
  apiFetch(familyPath(familyId), { method: "PUT", body: JSON.stringify(data) });

export type FamilyChild = {
  id: string;
  family_id: string;
  full_name: string;
  status: "unborn" | "born";
  date_of_birth: string | null;
  gender: "male" | "female" | null;
  age_months: number | null;
  mother_name: string | null;
  last_menstrual_period: string | null;
  expected_birth_date: string | null;
  gestational_age_weeks: number | null;
  birth_details_pending: boolean;
};

export type PrenatalClassification = "normal" | "kek_risk" | "needs_review";

export type PrenatalMeasurement = {
  id: string;
  child_id: string;
  measurement_date: string;
  gestational_age_weeks: number;
  maternal_weight: number;
  maternal_muac: number;
  fundal_height: number | null;
  fetal_heart_rate: number | null;
  estimated_fetal_weight: number | null;
  classification: PrenatalClassification;
  findings: string[];
  created_at: string;
};

export type PrenatalMeasurementInput = {
  measurement_date: string;
  maternal_weight: number;
  maternal_muac: number;
  fundal_height?: number;
  fetal_heart_rate?: number;
  estimated_fetal_weight?: number;
};

export type FamilyAidQuota = {
  eligible: boolean;
  blocked_reason: string | null;
  period_start: string;
  period_end: string;
  fies_classification: string | null;
  amount_per_beneficiary: number;
  children_under_two: number;
  unborn_children: number;
  beneficiaries: number;
  weekly_limit: number;
  used_amount: number;
  remaining_amount: number;
};

const childPath = (familyId: string, childId: string) =>
  `${familyPath(familyId)}/children/${encodeURIComponent(childId)}`;

export const getFamilyChildren = (familyId: string): Promise<FamilyChild[]> =>
  apiFetch(`${familyPath(familyId)}/children`);

export const addFamilyUnbornChild = (familyId: string, data: {
  mother_name: string;
  last_menstrual_period: string;
  full_name?: string;
}): Promise<FamilyChild> =>
  apiFetch(`${familyPath(familyId)}/children/unborn`, { method: "POST", body: JSON.stringify(data) });

export const recordFamilyChildBirth = (familyId: string, childId: string, data: {
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
}): Promise<FamilyChild> =>
  apiFetch(`${childPath(familyId, childId)}/birth`, { method: "POST", body: JSON.stringify(data) });

export const getFamilyPrenatalHistory = (
  familyId: string,
  childId: string,
): Promise<{ child: FamilyChild; measurements: PrenatalMeasurement[] }> =>
  apiFetch(`${childPath(familyId, childId)}/prenatal-measurements`, { cache: "no-store" });

export const addFamilyPrenatalMeasurement = (
  familyId: string,
  childId: string,
  data: PrenatalMeasurementInput,
): Promise<PrenatalMeasurement> =>
  apiFetch(`${childPath(familyId, childId)}/prenatal-measurements`, { method: "POST", body: JSON.stringify(data) });

export const getFamilyAidQuota = (familyId: string): Promise<FamilyAidQuota> =>
  apiFetch(`${familyPath(familyId)}/aid-quota`, { cache: "no-store" });

export async function addFamilyChild(familyId: string, data: {
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
}) {
  return apiFetch(`${familyPath(familyId)}/children`, { method: "POST", body: JSON.stringify(data) });
}

export async function getFamilyMeasurementHistory(familyId: string, childId: string) {
  const response = await apiFetch(`${familyPath(familyId)}/children/${encodeURIComponent(childId)}/measurements`);
  if (!Array.isArray(response?.data?.measurements)) {
    throw new Error("Format riwayat pengukuran tidak valid");
  }
  return response.data;
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
