// Core Donation Types
export interface Donation {
  id: string;
  amount: number;
  currency: string;
  status: DonationStatus;
  type: DonationType;
  payment_method: PaymentMethod;
  recipient_id?: string;
  recipient_name?: string;
  message?: string;
  anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  donor_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  status: SubscriptionStatus;
  next_billing_date: string;
  created_at: string;
  cancelled_at?: string;
}

export interface DashboardMetrics {
  total_donated: number;
  donation_count: number;
  subscription_count: number;
  active_subscriptions: number;
  avg_donation: number;
  beneficiaries_helped: number;
}

export interface ImpactReport {
  period_start: string;
  period_end: string;
  total_donated: number;
  meals_provided: number;
  families_helped: number;
  children_impacted: number;
  regions: ImpactRegion[];
}

export interface ImpactRegion {
  region_id: string;
  region_name: string;
  total_donated: number;
  families_helped: number;
  coordinates?: [number, number];
}

// Type Aliases
export type DonationStatus = "success" | "pending" | "failed" | "cancelled";
export type DonationType = "one_time" | "subscription";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type PaymentMethod = "bank_transfer" | "credit_card" | "ewallet" | "crypto";
