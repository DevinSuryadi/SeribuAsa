import { apiFetch } from "./api";
import type { Donation, DashboardMetrics, ImpactReport } from "@/types/donation";

export async function getDonations(): Promise<Donation[]> {
  const res = await apiFetch("/donations/");
  return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
}

export async function getDonation(donationId: string): Promise<Donation> {
  const res = await apiFetch(`/donations/${donationId}`);
  return res?.data || res;
}

export async function createDonation(data: {
  amount: number;
  type: string;
  payment_method: string;
}): Promise<Donation> {
  const res = await apiFetch("/donations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function simulatePayment(donationId: string): Promise<{ success: boolean; data?: unknown }> {
  return apiFetch(`/donations/${donationId}/simulate-payment`, {
    method: "POST",
  });
}

export async function getImpactMetrics(donorId: string): Promise<ImpactReport> {
  const res = await apiFetch(`/donations/impact/${donorId}`);
  return res?.data || res;
}

export async function getDashboardMetrics(donorId: string): Promise<DashboardMetrics> {
  const res = await apiFetch(`/donations/dashboard-metrics/${donorId}`);
  return res?.data || res;
}
