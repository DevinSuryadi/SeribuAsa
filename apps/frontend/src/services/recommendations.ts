import { apiFetch } from "./api";

export async function getRecommendations(childId?: string) {
  const qs = childId ? `?child_id=${childId}` : "";
  return apiFetch(`/recommendations/${qs}`);
}
