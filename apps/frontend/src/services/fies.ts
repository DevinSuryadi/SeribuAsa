import { apiFetch } from "./api";

export async function submitFies(data: {
  responses: Record<string, number>;
  survey_date?: string;
}) {
  return apiFetch("/fies/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function calculateFies(responses: Record<string, number>) {
  return apiFetch("/fies/calculate", {
    method: "POST",
    body: JSON.stringify({ responses }),
  });
}

export async function getFiesHistory(beneficiaryId: string) {
  return apiFetch(`/fies/history/${beneficiaryId}`);
}
