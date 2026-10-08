import { apiFetch } from "./api";

export type Priority = "low" | "medium" | "high";

export type FamilyRecommendation = {
  id: string;
  category: string;
  priority: Priority;
  title: string;
  description: string;
  action_items: string[];
  based_on: Record<string, unknown>;
};

export type FamilyAssessment = {
  family_id: string;
  fies: { id: string; score: number; classification: string; survey_date: string } | null;
  children: Array<{
    child_id: string;
    child_name: string;
    date_of_birth: string;
    latest_measurement: {
      id: string;
      measurement_date: string;
      weight: number;
      height: number;
      z_score_weight: number | null;
      z_score_height: number | null;
      classification: string | null;
    } | null;
  }>;
  summary_text: string;
  suggested_priority: Priority | "unknown";
  has_assessment: boolean;
  recommendations: FamilyRecommendation[];
};

const assessmentPath = (familyId: string) =>
  `/facilities/families/${encodeURIComponent(familyId)}/assessment`;

export const getFamilyAssessment = (familyId: string): Promise<FamilyAssessment> =>
  apiFetch(assessmentPath(familyId));
