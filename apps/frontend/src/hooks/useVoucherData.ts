import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getVoucherBalance, getVoucherHistory } from "@/services/vouchers";
import { toast } from "sonner";
import type { VoucherBalance, VoucherTransaction, AsyncState } from "@/types";

interface UseVoucherDataReturn extends AsyncState<VoucherBalance> {
  transactions: VoucherTransaction[];
  totalTransactions: number;
  refetch: () => Promise<void>;
}

/**
 * Hook untuk mengambil dan mengelola data voucher penerima manfaat
 *
 * @description
 * Hook ini mengambil data saldo voucher dan riwayat transaksi dari API.
 * Data di-fetch secara otomatis saat komponen mount dan user tersedia.
 *
 * @example
 * ```tsx
 * function VoucherComponent() {
 *   const { data, transactions, loading, error, refetch } = useVoucherData();
 *
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} onRetry={refetch} />;
 *
 *   return (
 *     <div>
 *       <h1>Saldo: {formatIDR(data?.total_balance || 0)}</h1>
 *       <TransactionList items={transactions} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns {UseVoucherDataReturn} Object berisi:
 * - `data`: Data saldo voucher (VoucherBalance | null)
 * - `transactions`: Array riwayat transaksi (VoucherTransaction[])
 * - `totalTransactions`: Jumlah total transaksi (number)
 * - `loading`: Status loading (boolean)
 * - `error`: Pesan error jika ada (string | null)
 * - `refetch`: Fungsi untuk me-refresh data (() => Promise<void>)
 *
 * @throws Tidak melempar error - semua error ditangani internal dan disimpan di state
 */
export function useVoucherData(): UseVoucherDataReturn {
  const { user } = useAuth();
  const [data, setData] = useState<VoucherBalance | null>(null);
  const [transactions, setTransactions] = useState<VoucherTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [balanceData, historyData] = await Promise.all([
        getVoucherBalance(user.id),
        getVoucherHistory(user.id),
      ]);

      setData(balanceData?.data || balanceData);
      setTransactions(historyData?.items || []);
      setTotalTransactions(historyData?.total || 0);
    } catch (err: any) {
      const errorMessage = err.message || "Gagal memuat data voucher";
      setError(errorMessage);
      toast.error("Gagal memuat data voucher", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    transactions,
    totalTransactions,
    loading,
    error,
    refetch: fetchData,
  };
}
