import { apiFetch } from "./api";
import type { Donation, DashboardMetrics, ImpactReport } from "@/types/donation";

export async function getDonations(): Promise<Donation[]> {
  const res = await apiFetch("/donations/");
  // Backend returns { items: [...], total: n, page: 1, ... }
  // Handle various response structures
  if (res?.data?.items && Array.isArray(res.data.items)) {
    return res.data.items;
  }
  if (res?.items && Array.isArray(res.items)) {
    return res.items;
  }
  if (Array.isArray(res?.data)) {
    return res.data;
  }
  if (Array.isArray(res)) {
    return res;
  }
  return [];
}

export async function getDonation(donationId: string): Promise<Donation> {
  const res = await apiFetch(`/donations/${donationId}`);
  return res?.data || res;
}

export async function createDonation(data: {
  amount: number;
  type: string;
  payment_method: string;
  plan_id?: string;
  is_subscription?: boolean;
}): Promise<Donation> {
  const res = await apiFetch("/donations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}

export async function simulatePayment(
  donationId: string
): Promise<{ success: boolean; data?: unknown }> {
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
