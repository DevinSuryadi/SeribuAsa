import { apiFetch } from "./api";

export interface Subscription {
  id: string;
  donor_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  frequency: "weekly" | "monthly" | "yearly";
  status: "active" | "paused" | "cancelled";
  payment_method: string;
  next_billing_date: string;
  created_at: string;
  cancelled_at?: string;
  paused_at?: string;
}

export interface BillingHistoryItem {
  id: string;
  subscription_id: string;
  amount: number;
  status: "success" | "pending" | "failed";
  created_at: string;
  payment_method: string;
}

export interface UpgradePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: string;
}

/**
 * Get all active subscriptions for the current donor
 */
export async function getSubscriptions(): Promise<Subscription[]> {
  const res = await apiFetch("/subscriptions/");
  // Backend returns { subscriptions: [...], total: n }
  if (res?.data?.subscriptions && Array.isArray(res.data.subscriptions)) return res.data.subscriptions;
  if (res?.subscriptions && Array.isArray(res.subscriptions)) return res.subscriptions;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
}

/**
 * Get billing history for a subscription
 */
export async function getBillingHistory(subscriptionId: string): Promise<BillingHistoryItem[]> {
  const res = await apiFetch(`/subscriptions/${subscriptionId}/billing-history`);
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(subscriptionId: string): Promise<Subscription> {
  const res = await apiFetch(`/subscriptions/${subscriptionId}/pause`, {
    method: "POST",
  });
  return res?.data || res;
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Subscription> {
  const res = await apiFetch(`/subscriptions/${subscriptionId}/resume`, {
    method: "POST",
  });
  return res?.data || res;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Subscription> {
  const res = await apiFetch(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
  });
  return res?.data || res;
}

/**
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<Subscription> {
  const res = await apiFetch(`/subscriptions/${subscriptionId}/reactivate`, {
    method: "POST",
  });
  return res?.data || res;
}

/**
 * Upgrade subscription plan
 */
export async function upgradeSubscription(
  subscriptionId: string,
  planId: string
): Promise<Subscription> {
  const res = await apiFetch(`/subscriptions/${subscriptionId}/upgrade`, {
    method: "POST",
    body: JSON.stringify({ plan_id: planId }),
  });
  return res?.data || res;
}

/**
 * Change payment method for a subscription
 */
export async function changePaymentMethod(
  subscriptionId: string,
  paymentMethod: string
): Promise<Subscription> {
  const res = await apiFetch(`/subscriptions/${subscriptionId}/payment-method`, {
    method: "PUT",
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
  return res?.data || res;
}

/**
 * Get available upgrade plans
 */
export async function getUpgradePlans(): Promise<UpgradePlan[]> {
  const res = await apiFetch("/subscriptions/plans");
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
}

/**
 * Create a new subscription (for donors without active subscription)
 */
export async function createSubscription(data: {
  plan_id: string;
  payment_method: string;
  amount: number;
}): Promise<Subscription> {
  const res = await apiFetch("/subscriptions/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data || res;
}
