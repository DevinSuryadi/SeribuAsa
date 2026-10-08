import { apiFetch } from "./api";

export type DonationRecipient = {
  donation_id: string;
  order_id: string;
  amount: number;
  status: "reserved" | "spent";
  family_name: string | null;
  facility_name: string | null;
  spent_at: string | null;
};

export type DonationUsage = {
  donation_id: string;
  amount: number;
  status: string;
  spent_amount: number;
  reserved_amount: number;
  available_amount: number;
  recipients: DonationRecipient[];
};

export type AdminPool = {
  total_received: number;
  total_reserved: number;
  total_spent: number;
  available_balance: number;
  donations: {
    donation_id: string;
    donor_name: string;
    amount: number;
    reserved_amount: number;
    spent_amount: number;
    available_amount: number;
    created_at: string | null;
  }[];
  allocations: DonationRecipient[];
};

export const getMyDonationUsage = (): Promise<DonationUsage[]> => apiFetch("/funding/my-donations");
export const getAdminPool = (): Promise<AdminPool> => apiFetch("/funding/admin/pool");
