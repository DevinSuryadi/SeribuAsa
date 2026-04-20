import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { OrderHistoryTable } from "@/components/order/OrderHistoryTable";
import { OrderFiltersPanel } from "@/components/order/OrderFiltersPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders } from "@/services/orders";
import { addToCart } from "@/services/cart";
import type { Order, OrderFilters, OrdersResponse } from "@/types/orders";
import { toast } from "sonner";
import { ShoppingCart, X } from "lucide-react";

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
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);

  const statusLabelMap: Record<string, string> = {
    pending: "Menunggu",
    confirmed: "Dikonfirmasi",
    processing: "Diproses",
    shipped: "Dikirim",
    delivered: "Terkirim",
    cancelled: "Dibatalkan",
  };

  const totalBelanja = orders.reduce(
    (acc, order) => acc + Number(order.cart_total ?? order.cash_amount ?? 0),
    0
  );
  const totalVoucher = orders.reduce((acc, order) => acc + Number(order.voucher_discount ?? 0), 0);
  const totalTunai = orders.reduce((acc, order) => acc + Number(order.cash_amount ?? 0), 0);

  // Load orders
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response: OrdersResponse = await getOrders({
        page: filters.page,
        page_size: filters.page_size,
        status: filters.status,
      });

      setOrders(Array.isArray(response?.orders) ? response.orders : []);
      setPagination({
        total: response?.total ?? 0,
        page: response?.page ?? 1,
        page_size: response?.page_size ?? 10,
        total_pages: response?.total_pages ?? 1,
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

  const clearFilter = (key: "status" | "date_from" | "date_to") => {
    setFilters((prev) => ({
      ...prev,
      [key]: undefined,
      page: 1,
    }));
  };

  const clearAllFilters = () => {
    setFilters((prev) => ({
      page: 1,
      page_size: prev.page_size || 10,
    }));
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/dashboard/orders/${orderId}`);
  };

  const handleReorder = async (order: Order) => {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      toast.error("Item pesanan tidak tersedia untuk dipesan ulang");
      return;
    }

    setReorderingOrderId(order.id);
    try {
      await Promise.all(
        order.items.map((item) =>
          addToCart({
            product_id: item.product_id,
            quantity: Number(item.quantity || 1),
          })
        )
      );

      toast.success("Pesanan berhasil ditambahkan kembali ke keranjang");
      navigate("/checkout");
    } catch (err: any) {
      const message = err?.message || "Gagal memesan ulang";
      toast.error(message);
    } finally {
      setReorderingOrderId(null);
    }
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
            <p className="text-gray-700 font-medium mb-1">Anda belum memiliki pesanan</p>
            <p className="text-sm text-gray-500 mb-5">
              Pilih produk dari katalog, lakukan checkout, lalu riwayat pesanan Anda akan muncul di
              sini.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button onClick={() => navigate("/dashboard/katalog")} className="min-h-11">
                Mulai Berbelanja
              </Button>
              <Button
                onClick={() => navigate("/dashboard/dompet-nutrisi")}
                variant="outline"
                className="min-h-11"
              >
                Lihat Dompet Nutrisi
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {(isLoading || orders.length > 0) && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[100px]">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Pesanan</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.total}</p>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[100px]">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Belanja</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-36 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    Rp {totalBelanja.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[100px]">
                <p className="text-xs uppercase tracking-wide text-gray-500">Penghematan Voucher</p>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-32 mt-2" />
                    <Skeleton className="h-4 w-40 mt-2" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">
                      Rp {totalVoucher.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pembayaran tunai: Rp {totalTunai.toLocaleString("id-ID")}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit self-start">
                <OrderFiltersPanel onFiltersChange={handleFiltersChange} isLoading={isLoading} />
              </div>

              {/* Orders List */}
              <div className="lg:col-span-3 space-y-4">
                {(filters.status || filters.date_from || filters.date_to) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        Filter Aktif:
                      </span>

                      {filters.status && (
                        <button
                          type="button"
                          onClick={() => clearFilter("status")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                          aria-label="Hapus filter status"
                        >
                          Status: {statusLabelMap[filters.status] || filters.status}
                          <X size={12} />
                        </button>
                      )}

                      {filters.date_from && (
                        <button
                          type="button"
                          onClick={() => clearFilter("date_from")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                          aria-label="Hapus filter tanggal mulai"
                        >
                          Dari: {filters.date_from}
                          <X size={12} />
                        </button>
                      )}

                      {filters.date_to && (
                        <button
                          type="button"
                          onClick={() => clearFilter("date_to")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                          aria-label="Hapus filter tanggal akhir"
                        >
                          Sampai: {filters.date_to}
                          <X size={12} />
                        </button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="h-7 px-2 text-xs"
                      >
                        Reset semua
                      </Button>
                    </div>
                  </div>
                )}

                <OrderHistoryTable
                  orders={orders}
                  isLoading={isLoading}
                  onOrderClick={handleOrderClick}
                  onReorder={handleReorder}
                  reorderingOrderId={reorderingOrderId}
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OrderHistoryPage;
