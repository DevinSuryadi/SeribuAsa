import { useState, useCallback, useEffect } from "react";
import { getDonations, getDashboardMetrics } from "@/services/donations";
import type { Donation, DashboardMetrics } from "@/types/donation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface UseDonationsReturn {
  data: {
    donations: Donation[];
    metrics: DashboardMetrics | null;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchMetrics: () => Promise<void>;
}

/**
 * Hook untuk mengambil dan mengelola data donasi donor
 *
 * @description
 * Hook ini mengambil data riwayat donasi dan metrics dashboard dari API.
 * Mendukung refetch total maupun refetch metrics saja.
 *
 * @example
 * ```tsx
 * function DonorDashboard() {
 *   const {
 *     data: { donations, metrics },
 *     loading,
 *     error,
 *     refetch,
 *     refetchMetrics
 *   } = useDonations();
 *
 *   const handleDonationSuccess = () => {
 *     refetch(); // Refresh all data
 *   };
 *
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <div>
 *       <Stats metrics={metrics} />
 *       <DonationHistory items={donations} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns {UseDonationsReturn} Object berisi:
 * - `data.donations`: Array riwayat donasi (Donation[])
 * - `data.metrics`: Metrics dashboard (DashboardMetrics | null)
 * - `loading`: Status loading (boolean)
 * - `error`: Pesan error jika ada (string | null)
 * - `refetch`: Fungsi untuk me-refresh semua data
 * - `refetchMetrics`: Fungsi untuk me-refresh metrics saja
 */
export function useDonations(): UseDonationsReturn {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchDonations = useCallback(async () => {
    try {
      const res = await getDonations();
      setDonations(res || []);
    } catch (err: unknown) {
      console.error("Failed to fetch donations", err);
      throw err;
    }
  }, []);

  const refetchMetrics = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getDashboardMetrics(user.id);
      setMetrics(res);
    } catch (err: unknown) {
      console.error("Failed to fetch metrics", err);
      throw err;
    }
  }, [user?.id]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refetchDonations(), refetchMetrics()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data donasi";
      setError(msg);
      toast.error("Gagal memuat data", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [refetchDonations, refetchMetrics]);

  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [refetch, user?.id]);

  return {
    data: { donations, metrics },
    loading,
    error,
    refetch,
    refetchMetrics,
  };
}
