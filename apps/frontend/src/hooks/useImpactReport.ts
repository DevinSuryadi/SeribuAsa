import { useState, useCallback, useEffect } from "react";
import { getImpactReport } from "@/services/reports";
import type { ImpactReport } from "@/services/reports";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface UseImpactReportReturn {
  data: ImpactReport | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useImpactReport(startDate?: string, endDate?: string): UseImpactReportReturn {
  const { user } = useAuth();
  const [data, setData] = useState<ImpactReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const res = await getImpactReport(startDate, endDate);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat laporan";
      setError(msg);
      toast.error("Gagal memuat impact report", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [user?.id, startDate, endDate]);

  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [refetch, user?.id]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
