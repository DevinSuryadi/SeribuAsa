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
    status: "unborn" | "born";
    date_of_birth: string | null;
    expected_birth_date: string | null;
    gestational_age_weeks: number | null;
    latest_prenatal_check: {
      id: string;
      measurement_date: string;
      gestational_age_weeks: number;
      maternal_weight: number;
      maternal_muac: number;
      fundal_height: number | null;
      classification: string;
    } | null;
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

export const getFamilyAssessment = (familyId: string, forceRefresh = false): Promise<FamilyAssessment> =>
  apiFetch(assessmentPath(familyId), forceRefresh ? { cache: "no-store" } : undefined);

export type MemberReasons = { member: string; reasons: string[] };

/** Output of the family recommender model, accumulated over every child and pregnancy. */
export type FamilyAiRecommendation = {
  priority: Priority;
  model_version: string | null;
  weekly_budget: number | null;
  actions: Array<{
    key: string;
    label: string;
    description: string;
    members: string[];
    member_reasons: MemberReasons[];
    sources: string[];
  }>;
  food_groups: Array<{
    key: string;
    label: string;
    examples: string;
    catalog_categories: string[];
    level: 0 | 1 | 2;
    level_label: string;
    score: number;
    share: number;
    budget: number | null;
    members: Array<MemberReasons & { level: string }>;
  }>;
  data_checks: Array<{ key: string; label: string; member: string }>;
  excluded_members: Array<{ member: string; reason: string }>;
  not_recommended: Array<{ category: string; reason: string }>;
};

const recommendationPath = (familyId: string) =>
  `/facilities/families/${encodeURIComponent(familyId)}/recommendation`;

export const getFamilyRecommendation = (familyId: string, forceRefresh = false): Promise<FamilyAiRecommendation> =>
  apiFetch(recommendationPath(familyId), forceRefresh ? { cache: "no-store" } : undefined);
