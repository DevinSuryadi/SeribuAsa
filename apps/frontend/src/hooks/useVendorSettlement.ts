import { useState, useCallback, useEffect } from "react";
import { getSettlements } from "@/services/settlements";
import type { Settlement } from "@/services/settlements";
import { toast } from "sonner";

export interface UseVendorSettlementReturn {
  data: Settlement[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVendorSettlement(): UseVendorSettlementReturn {
  const [data, setData] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSettlements(1, 100);
      setData(res.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data settlement";
      setError(msg);
      toast.error("Gagal memuat settlement", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
