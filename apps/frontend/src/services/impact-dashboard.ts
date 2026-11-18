import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "./api";

type Money = number | string;
export interface ImpactDashboardReport {
  scope: "personal" | "platform";
  period: { start_date: string | null; end_date: string };
  generated_at: string;
  summary: {
    received: Money;
    pooled_received: Money;
    legacy_received: Money;
    reserved: Money;
    spent: Money;
    available: Money;
    distributed: Money;
    donations: number;
    families: number;
    facilities: number;
    distributions: number;
  };
  trend: { month: string; amount: Money; count: number }[];
  regions: { code: string; name: string; amount: Money; families: number; distributions: number }[];
  recent_donations: {
    id: string;
    created_at: string;
    amount: Money;
    flow: string;
    reserved: Money;
    spent: Money;
  }[];
}

export function useImpactDashboard(start = "", end = "") {
  const { user } = useAuth();
  const params = new URLSearchParams();
  if (start) params.set("start_date", start);
  if (end) params.set("end_date", end);
  return useSWR<ImpactDashboardReport>(
    user ? ["impact-dashboard", user.id, start, end] : null,
    () => apiFetch(`/reports/impact-dashboard?${params}`, { cache: "no-store" }),
    { refreshInterval: 60000, revalidateOnFocus: true, keepPreviousData: false }
  );
}
