import { apiFetch } from "./api";

export async function getDonations() {
  return apiFetch("/donations/");
}

export async function getDonation(donationId: string) {
  return apiFetch(`/donations/${donationId}`);
}

export async function createDonation(data: {
  amount: number;
  type: string;
  payment_method: string;
}) {
  return apiFetch("/donations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function simulatePayment(donationId: string) {
  return apiFetch(`/donations/${donationId}/simulate-payment`, {
    method: "POST",
  });
}

export async function getImpactMetrics(donorId: string) {
  return apiFetch(`/donations/impact/${donorId}`);
}

export async function getDashboardMetrics(donorId: string) {
  return apiFetch(`/donations/dashboard-metrics/${donorId}`);
}
