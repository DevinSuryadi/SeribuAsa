import { apiFetch } from "./api";

export async function getChildren() {
  return apiFetch("/nutrition/children");
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
  return apiFetch(`/nutrition/measurements/${childId}`);
}

export async function calculateZScore(data: {
  age_months: number;
  gender: string;
  weight: number;
  height: number;
}) {
  return apiFetch("/nutrition/zscore", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getLatestFIESStatus(beneficiaryId: string) {
  return apiFetch(`/fies/latest/${beneficiaryId}`);
}

export async function getLatestNutritionMeasurement(beneficiaryId: string) {
  return apiFetch(`/nutrition/latest-measurement/${beneficiaryId}`);
}
