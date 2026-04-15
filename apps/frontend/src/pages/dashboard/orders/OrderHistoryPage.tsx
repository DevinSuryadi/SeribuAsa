import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { OrderHistoryTable } from "@/components/order/OrderHistoryTable";
import { OrderFiltersPanel } from "@/components/order/OrderFiltersPanel";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/services/orders";
import type { Order, OrderFilters, OrdersResponse } from "@/types/orders";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

/**
 * OrderHistoryPage
 * Displays user's order history with filtering and pagination
 */
function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    page_size: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });

  // Load orders
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response: OrdersResponse = await getOrders({
        page: filters.page,
        page_size: filters.page_size,
        status: filters.status,
      });

      setOrders(response.orders);
      setPagination({
        total: response.total,
        page: response.page,
        page_size: response.page_size,
        total_pages: response.total_pages,
      });
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      toast.error("Gagal memuat pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load orders when filters change
  useEffect(() => {
    loadOrders();
  }, [filters]);

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/dashboard/orders/${orderId}`);
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setFilters((prev) => ({
        ...prev,
        page: prev.page - 1,
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.total_pages) {
      setFilters((prev) => ({
        ...prev,
        page: prev.page + 1,
      }));
    }
  };

  return (
    <DashboardLayout title="Riwayat Pesanan" subtitle="Lihat semua pesanan Anda">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Empty State */}
        {orders.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Anda belum memiliki pesanan</p>
            <Button onClick={() => navigate("/dashboard/katalog")}>Mulai Berbelanja</Button>
          </div>
        )}

        {/* Main Content */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <OrderFiltersPanel onFiltersChange={handleFiltersChange} isLoading={isLoading} />
            </div>

            {/* Orders List */}
            <div className="lg:col-span-3 space-y-4">
              <OrderHistoryTable
                orders={orders}
                isLoading={isLoading}
                onOrderClick={handleOrderClick}
              />

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    Halaman {pagination.page} dari {pagination.total_pages} (Total:{" "}
                    {pagination.total} pesanan)
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handlePreviousPage}
                      disabled={pagination.page === 1 || isLoading}
                      variant="outline"
                    >
                      ← Sebelumnya
                    </Button>
                    <Button
                      onClick={handleNextPage}
                      disabled={pagination.page === pagination.total_pages || isLoading}
                      variant="outline"
                    >
                      Berikutnya →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OrderHistoryPage;
