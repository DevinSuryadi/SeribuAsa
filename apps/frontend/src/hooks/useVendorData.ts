import { useState, useCallback, useEffect } from "react";
import { getOrders } from "@/services/orders";
import { getProducts } from "@/services/products";
import { getWalletBalance } from "@/services/vendor-wallet";
import type { VendorOrder, VendorProduct, VendorWallet } from "@/types/vendor";
import { toast } from "sonner";

export interface UseVendorDataReturn {
  data: {
    orders: VendorOrder[];
    products: VendorProduct[];
    wallet: VendorWallet | null;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  refetchProducts: () => Promise<void>;
  refetchWallet: () => Promise<void>;
}

/**
 * Hook untuk mengambil dan mengelola data dashboard vendor
 *
 * @description
 * Hook ini mengambil data pesanan, produk, dan wallet vendor dari API.
 * Menyediakan fungsi refetch individual untuk update granular.
 *
 * @example
 * ```tsx
 * function VendorDashboard() {
 *   const {
 *     data: { orders, products, wallet },
 *     loading,
 *     error,
 *     refetchOrders
 *   } = useVendorData();
 *
 *   const handleOrderComplete = async () => {
 *     await completeOrder(orderId);
 *     await refetchOrders(); // Refresh hanya orders
 *   };
 *
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *
 *   return <Dashboard orders={orders} products={products} wallet={wallet} />;
 * }
 * ```
 *
 * @returns {UseVendorDataReturn} Object berisi data orders, products, wallet,
 * status loading, error, dan fungsi refetch (total & individual)
 */
export function useVendorData(): UseVendorDataReturn {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [wallet, setWallet] = useState<VendorWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchOrders = useCallback(async () => {
    try {
      const res = await getOrders({ page_size: 50 });
      setOrders((res.orders || []) as unknown as VendorOrder[]);
    } catch (err: unknown) {
      console.error("Failed to fetch orders", err);
      throw err;
    }
  }, []);

  const refetchProducts = useCallback(async () => {
    try {
      const res = await getProducts();
      setProducts((res.items || []) as unknown as VendorProduct[]);
    } catch (err: unknown) {
      console.error("Failed to fetch products", err);
      throw err;
    }
  }, []);

  const refetchWallet = useCallback(async () => {
    try {
      const res = await getWalletBalance();
      // map response safely
      setWallet({
        balance: res.balance || 0,
        total_earnings: (res as unknown as { total_earnings?: number }).total_earnings || 0,
        pending_amount:
          (res as unknown as { pending_withdrawals?: number; pending_amount?: number })
            .pending_withdrawals ||
          (res as unknown as { pending_amount?: number }).pending_amount ||
          0,
        currency: "IDR",
      });
    } catch (err: unknown) {
      console.error("Failed to fetch wallet", err);
      throw err;
    }
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refetchOrders(), refetchProducts(), refetchWallet()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data";
      setError(msg);
      toast.error("Gagal memuat data", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [refetchOrders, refetchProducts, refetchWallet]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data: { orders, products, wallet },
    loading,
    error,
    refetch,
    refetchOrders,
    refetchProducts,
    refetchWallet,
  };
}
