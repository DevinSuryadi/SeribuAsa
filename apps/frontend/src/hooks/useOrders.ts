import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrders } from "@/services/orders";
import { toast } from "sonner";
import type { Order, OrderStatus, AsyncState } from "@/types";

interface UseOrdersReturn extends AsyncState<Order[]> {
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setStatusFilter: (status: OrderStatus | undefined) => void;
}

export function useOrders(initialPage = 1, pageSize = 10): UseOrdersReturn {
  const { user } = useAuth();
  const [data, setData] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getOrders({
        page: currentPage,
        page_size: pageSize,
        status: statusFilter,
      });

      setData(response.orders || []);
      setTotalOrders(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch (err: any) {
      const errorMessage = err.message || "Gagal memuat data pesanan";
      setError(errorMessage);
      toast.error("Gagal memuat data pesanan", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentPage, pageSize, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSetPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSetStatusFilter = useCallback((status: OrderStatus | undefined) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  return {
    data,
    totalOrders,
    currentPage,
    totalPages,
    loading,
    error,
    refetch: fetchOrders,
    setPage: handleSetPage,
    setStatusFilter: handleSetStatusFilter,
  };
}
