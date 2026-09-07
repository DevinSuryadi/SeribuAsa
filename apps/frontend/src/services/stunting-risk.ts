import { apiFetch } from "./api";

export type RiskLevel = "low" | "medium" | "high";

export interface DominantFactor {
  name: string;
  label: string;
  value: number;
  contribution: number;
  direction: "risk" | "protective";
}

export interface StuntingRiskPrediction {
  id?: string;
  child_id: string;
  measurement_id?: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  horizon_months: number;
  model_version: string;
  dominant_factors: DominantFactor[];
  features?: Record<string, unknown>;
  created_at?: string | null;
}

export interface ChildInfo {
  id: string;
  full_name: string;
  date_of_birth: string;
  age_months: number;
  gender: string | null;
}

export interface StuntingRiskWithChild {
  child: ChildInfo;
  prediction: StuntingRiskPrediction;
}

export async function getChildRisk(
  childId: string
): Promise<StuntingRiskPrediction | null> {
  const res = await apiFetch(`/nutrition/risk/${childId}`);
  return res?.data ?? null;
}

export async function recomputeChildRisk(
  childId: string
): Promise<StuntingRiskPrediction | null> {
  const res = await apiFetch(`/nutrition/risk/${childId}/recompute`, {
    method: "POST",
  });
  return res?.data ?? null;
}

export async function getRiskHistory(
  childId: string,
  limit = 12
): Promise<StuntingRiskPrediction[]> {
  const res = await apiFetch(
    `/nutrition/risk/${childId}/history?limit=${limit}`
  );
  return Array.isArray(res?.data) ? res.data : [];
}

export async function getMyChildrenRisk(): Promise<StuntingRiskWithChild[]> {
  const res = await apiFetch(`/nutrition/risk/beneficiary/me`);
  return Array.isArray(res?.data) ? res.data : [];
}

export async function getHighRiskChildren(
  limit = 50
): Promise<StuntingRiskWithChild[]> {
  const res = await apiFetch(`/nutrition/risk/high-risk?limit=${limit}`);
  return Array.isArray(res?.data) ? res.data : [];
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};
