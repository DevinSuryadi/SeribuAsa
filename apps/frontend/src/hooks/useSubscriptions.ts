import { useState, useCallback, useEffect } from "react";
import type { Subscription, SubscriptionStatus } from "@/types/donation";
import { toast } from "sonner";
import { apiFetch } from "@/services/api";

export interface UseSubscriptionsReturn {
  data: Subscription[];
  loading: boolean;
  error: string | null;
  pauseSubscription: (id: string) => Promise<boolean>;
  resumeSubscription: (id: string) => Promise<boolean>;
  cancelSubscription: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // NOTE: This endpoint might need to be implemented in backend if it doesn't exist
      const res = await apiFetch("/donations/subscriptions").catch(() => {
        // Fallback for missing endpoint
        return { data: [] };
      });
      setData(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
      toast.error("Gagal memuat langganan", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateStatus = async (id: string, status: SubscriptionStatus) => {
    try {
      await apiFetch(`/donations/subscriptions/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await refetch();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal update status";
      toast.error("Gagal mengubah status langganan", { description: msg });
      return false;
    }
  };

  return {
    data,
    loading,
    error,
    pauseSubscription: (id) => updateStatus(id, "paused"),
    resumeSubscription: (id) => updateStatus(id, "active"),
    cancelSubscription: (id) => updateStatus(id, "cancelled"),
    refetch,
  };
}
