import { apiFetch } from "./api";
import type { Donation, DashboardMetrics, ImpactReport } from "@/types/donation";

export async function getDonations(): Promise<Donation[]> {
  const res = await apiFetch("/donations/");
  const firstPage = res?.data?.items ? res.data : res;
  if (Array.isArray(firstPage?.items)) {
    const pages = Number(firstPage.total_pages || 1);
    const rest = pages > 1 ? await Promise.all(Array.from({ length: pages - 1 }, (_, index) =>
      apiFetch(`/donations/?page=${index + 2}&page_size=${firstPage.page_size || 10}`))) : [];
    return [...firstPage.items, ...rest.flatMap((page) => page?.data?.items || page?.items || [])];
  }
  if (Array.isArray(res?.data)) {
    return res.data;
  }
  if (Array.isArray(res)) {
    return res;
  }
  return [];
}

export async function simulatePayment(donationId: string): Promise<any> {
  const res = await apiFetch(`/donations/${donationId}/simulate-payment`, {
    method: "POST",
  });
  return res?.data || res;
}

export async function fixPendingDonations(): Promise<{ fixed_count: number; errors: any[] }> {
  const res = await apiFetch("/donations/fix-pending-donations", {
    method: "POST",
  });
  return res?.data || res;
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

export async function getPaymentLink(
  donationId: string
): Promise<{ donation_id: string; snap_token?: string; redirect_url?: string }> {
  const res = await apiFetch(`/donations/${donationId}/payment-link`, {
    method: "POST",
  });
  return res?.data || res;
}



export async function getImpactMetrics(donorId: string): Promise<ImpactReport> {
  const res = await apiFetch(`/donations/impact/${donorId}`);
  return res?.data || res;
}

export async function getDashboardMetrics(donorId: string): Promise<DashboardMetrics> {
  const res = await apiFetch(`/donations/dashboard-metrics/${donorId}`);
  return res?.data || res;
}
