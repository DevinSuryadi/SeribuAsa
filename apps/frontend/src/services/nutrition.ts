import { apiFetch } from "./api";

export async function getChildren() {
  const response = await apiFetch("/nutrition/children");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function addMeasurement(data: {
  child_id: string;
  measurement_date: string;
  weight: number;
  height: number;
  muac?: number;
  notes?: string;
}) {
  return apiFetch("/nutrition/measurements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMeasurementHistory(childId: string) {
  const response = await apiFetch(`/nutrition/measurements/${childId}`);
  return response?.data ?? null;
}

export async function calculateZScore(data: {
  age_months: number;
  gender: string;
  weight: number;
  height: number;
}) {
  const response = await apiFetch("/nutrition/zscore", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response?.data ?? null;
}

export async function getLatestFIESStatus(beneficiaryId: string) {
  const response = await apiFetch(`/fies/latest/${beneficiaryId}`);
  return response?.data ?? null;
}

export async function getLatestNutritionMeasurement(beneficiaryId: string) {
  const response = await apiFetch(`/nutrition/latest-measurement/${beneficiaryId}`);
  const entries = Array.isArray(response?.data) ? response.data : [];

  if (entries.length === 0) return null;

  const latestEntry =
    entries
      .filter((entry: any) => entry?.measurement?.measurement_date)
      .sort(
        (a: any, b: any) =>
          new Date(b.measurement.measurement_date).getTime() -
          new Date(a.measurement.measurement_date).getTime()
      )[0] ?? entries[0];

  return {
    child_id: latestEntry?.child_id,
    child_name: latestEntry?.child_name,
    ...(latestEntry?.measurement ?? {}),
  };
}

export async function updateMeasurement(
  measurementId: string,
  data: {
    child_id: string;
    measurement_date: string;
    weight: number;
    height: number;
    muac?: number;
    notes?: string;
  }
) {
  return apiFetch(`/nutrition/measurements/${measurementId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMeasurement(measurementId: string) {
  return apiFetch(`/nutrition/measurements/${measurementId}`, {
    method: "DELETE",
  });
}

export async function addChild(data: {
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: "male" | "female";
}) {
  // Build query params since backend expects query params not JSON body
  const params = new URLSearchParams();
  params.append("full_name", data.full_name);
  params.append("date_of_birth", data.date_of_birth);
  params.append("gender", data.gender);

  const response = await apiFetch(`/nutrition/children?${params.toString()}`, {
    method: "POST",
  });
  return response;
}
