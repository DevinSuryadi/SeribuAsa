import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrders } from "@/services/orders";
import { addToCart } from "@/services/cart";
import type { Order, OrderItem, OrderFilters, OrdersResponse } from "@/types/orders";
import { toast } from "sonner";
import { formatIDR, formatDate } from "@/lib/format";
import OrderQrModal from "@/components/order/OrderQrModal";
import {
  ShoppingCart,
  X,
  Package,
  TrendingUp,
  Wallet,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RotateCcw,
  ReceiptText,
  Store,
  QrCode,
} from "lucide-react";
import { OrderFiltersPanel } from "@/components/order/OrderFiltersPanel";

// ── Helpers ────────────────────────────────────────────────────
/**
 * Compute order total from multiple fallback fields.
 * Backend may return cart_total, cash_amount, or items[].subtotal.
 */
function computeOrderTotal(order: Order): number {
  // Prefer cart_total if non-zero
  if (order.cart_total && Number(order.cart_total) > 0) {
    return Number(order.cart_total);
  }
  // Fallback: sum items subtotals
  if (Array.isArray(order.items) && order.items.length > 0) {
    const itemsSum = order.items.reduce((acc, item) => {
      const sub = Number(item.subtotal ?? 0);
      const byPrice = Number(item.price ?? 0) * Number(item.quantity ?? 1);
      return acc + (sub > 0 ? sub : byPrice);
    }, 0);
    if (itemsSum > 0) return itemsSum;
  }
  // Last resort: cash_amount
  return Number(order.cash_amount ?? 0);
}

// ── Status config ──────────────────────────────────────────────
const statusMap: Record<
  string,
  {
    label: string;
    cls: string;
    icon: React.ElementType;
    dot: string;
  }
> = {
  pending: {
    label: "Menunggu",
    cls: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
    dot: "bg-amber-400",
  },
  confirmed: {
    label: "Dikonfirmasi",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
    icon: CheckCircle2,
    dot: "bg-blue-400",
  },
  processing: {
    label: "Diproses",
    cls: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Loader2,
    dot: "bg-purple-400",
  },
  shipped: {
    label: "Dikirim",
    cls: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: Package,
    dot: "bg-indigo-400",
  },
  delivered: {
    label: "Terkirim",
    cls: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Dibatalkan",
    cls: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
    dot: "bg-red-400",
  },
  completed: {
    label: "Selesai",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
};

// ── OrderCard ──────────────────────────────────────────────────
const OrderCard = memo(function OrderCard({
  order,
  onOrderClick,
  onReorder,
  reorderingId,
  onShowQr,
}: {
  order: Order;
  onOrderClick: (id: string) => void;
  onReorder: (o: Order) => void;
  reorderingId: string | null;
  onShowQr: (id: string) => void;
}) {
  const sc = statusMap[order.status] ?? {
    label: order.status,
    cls: "bg-secondary text-muted-foreground border-border",
    icon: Package,
    dot: "bg-muted-foreground",
  };
  const StatusIcon = sc.icon;
  const isReordering = reorderingId === order.id;

  const total = computeOrderTotal(order);
  const voucherSave = Number(order.voucher_discount ?? 0);
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="group rounded-2xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60 bg-secondary/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${sc.dot}`} />
          <span className="text-xs font-mono text-muted-foreground truncate">
            #{order.id?.slice(0, 8).toUpperCase()}
          </span>
          <Badge variant="outline" className={`text-[10px] border gap-0.5 flex-shrink-0 ${sc.cls}`}>
            <StatusIcon className="h-2.5 w-2.5" aria-hidden="true" />
            {sc.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {order.vendor_store_name && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              <Store className="h-3 w-3" aria-hidden="true" />
              {order.vendor_store_name}
            </div>
          )}
          <span className="text-[11px] text-muted-foreground">{formatDate(order.created_at)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {/* Items chips */}
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {items.slice(0, 4).map((item: OrderItem, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs text-muted-foreground border border-border"
              >
                <Package className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[120px]">{item.product_name || "Produk"}</span>
                <span className="text-muted-foreground/60">×{item.quantity}</span>
              </span>
            ))}
            {items.length > 4 && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-xs text-muted-foreground border border-border">
                +{items.length - 4} lainnya
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-4">Tidak ada item</p>
        )}

        {/* Price + actions row */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-foreground">
              {total > 0 ? (
                formatIDR(total)
              ) : (
                <span className="text-muted-foreground text-sm font-normal">
                  Harga tidak tersedia
                </span>
              )}
            </div>
            {voucherSave > 0 && (
              <div className="text-[11px] text-green-600 font-semibold mt-0.5">
                Hemat {formatIDR(voucherSave)} via voucher
              </div>
            )}
            {order.applied_voucher?.code && (
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Voucher: {order.applied_voucher.code}
              </div>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {/* QR button for pending orders */}
            {order.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onShowQr(order.id)}
              >
                <QrCode className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">Tampilkan QR</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => onReorder(order)}
              disabled={isReordering || items.length === 0}
            >
              {isReordering ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Pesan Lagi</span>
            </Button>
            <Button
              size="sm"
              className="h-8 px-3 text-xs gap-1"
              onClick={() => onOrderClick(order.id)}
            >
              Detail
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Skeleton ───────────────────────────────────────────────────
function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-border/60 bg-secondary/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, page_size: 10 });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  });
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [qrOrderId, setQrOrderId] = useState<string | null>(null);

  const handleShowQr = useCallback((id: string) => setQrOrderId(id), []);

  const loadOrders = useCallback(async () => {
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
    } catch {
      toast.error("Gagal memuat pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFiltersChange = (newFilters: OrderFilters) => setFilters(newFilters);
  const clearFilter = (key: "status" | "date_from" | "date_to") =>
    setFilters((prev) => ({ ...prev, [key]: undefined, page: 1 }));
  const clearAllFilters = () =>
    setFilters((prev) => ({ page: 1, page_size: prev.page_size || 10 }));
  const handleOrderClick = (orderId: string) => navigate(`/dashboard/orders/${orderId}`);

  const handleReorder = async (order: Order) => {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      toast.error("Item pesanan tidak tersedia untuk dipesan ulang");
      return;
    }
    setReorderingOrderId(order.id);
    try {
      await Promise.all(
        order.items.map((item) =>
          addToCart({ product_id: item.product_id, quantity: Number(item.quantity || 1) })
        )
      );
      toast.success("Pesanan berhasil ditambahkan kembali ke keranjang");
      navigate("/checkout");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memesan ulang");
    } finally {
      setReorderingOrderId(null);
    }
  };

  // Stats — derived from orders array
  const { totalBelanja, totalVoucher, successCount } = useMemo(
    () => ({
      totalBelanja: orders.reduce((acc, o) => acc + computeOrderTotal(o), 0),
      totalVoucher: orders.reduce((acc, o) => acc + Number(o.voucher_discount ?? 0), 0),
      successCount: orders.filter((o) => o.status === "delivered").length,
    }),
    [orders]
  );

  const hasActiveFilter = !!(filters.status || filters.date_from || filters.date_to);

  return (
    <div>
      <DashboardLayout
        title="Riwayat Pesanan Belanja"
        subtitle="Status dan detail pengiriman barang yang Anda beli"
      >
        {/* Full-width container — no max-w constraint */}
        <div className="space-y-6">
          {/* ── Empty State ── */}
          {orders.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-dashed border-border bg-card text-center py-16 px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
                <ReceiptText className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Belum Ada Pesanan Belanja</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-2">
                Riwayat pembelian barang akan muncul di sini setelah Anda checkout dari katalog.
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto mb-6">
                Untuk melihat perubahan saldo voucher, kunjungi menu <strong>Dompet Nutrisi</strong>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="gap-2">
                  <Link to="/dashboard/katalog">
                    <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Mulai Berbelanja
                  </Link>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link to="/dashboard/dompet-nutrisi">
                    <Wallet className="h-4 w-4" aria-hidden="true" /> Lihat Dompet Voucher
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* ── Main Content ── */}
          {(isLoading || orders.length > 0) && (
            <div className="space-y-6">
              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                      <Package className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={loadOrders}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                        aria-label="Refresh orders"
                      />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Total Pesanan
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground">{pagination.total}</p>
                      <p className="text-[11px] text-green-600 font-semibold mt-0.5">
                        {successCount} terkirim
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 mb-3">
                    <Wallet className="h-4 w-4 text-purple-600" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Total Belanja
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-36" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{formatIDR(totalBelanja)}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 mb-3">
                    <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Hemat via Voucher
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{formatIDR(totalVoucher)}</p>
                  )}
                </div>
              </div>

              {/* Active filter chips */}
              {hasActiveFilter && (
                <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Filter Aktif:</span>
                  {filters.status && (
                    <button
                      type="button"
                      onClick={() => clearFilter("status")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Status: {statusMap[filters.status]?.label || filters.status}
                      <X size={10} aria-hidden="true" />
                    </button>
                  )}
                  {filters.date_from && (
                    <button
                      type="button"
                      onClick={() => clearFilter("date_from")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Dari: {filters.date_from} <X size={10} aria-hidden="true" />
                    </button>
                  )}
                  {filters.date_to && (
                    <button
                      type="button"
                      onClick={() => clearFilter("date_to")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Sampai: {filters.date_to} <X size={10} aria-hidden="true" />
                    </button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="h-7 px-2 text-xs ml-auto"
                  >
                    Reset semua
                  </Button>
                </div>
              )}

              {/* Filters sidebar + Orders list */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit self-start">
                  <OrderFiltersPanel onFiltersChange={handleFiltersChange} isLoading={isLoading} />
                </div>

                <div className="lg:col-span-3 space-y-3">
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)
                    : orders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onOrderClick={handleOrderClick}
                          onReorder={handleReorder}
                          reorderingId={reorderingOrderId}
                          onShowQr={handleShowQr}
                        />
                      ))}

                  {/* Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                      <p className="text-sm text-muted-foreground">
                        Halaman {pagination.page} dari {pagination.total_pages}
                        <span className="ml-1 text-muted-foreground/60">
                          ({pagination.total} pesanan)
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1 || isLoading}
                          variant="outline"
                          size="sm"
                        >
                          ← Sebelumnya
                        </Button>
                        <Button
                          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page === pagination.total_pages || isLoading}
                          variant="outline"
                          size="sm"
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

      {/* QR Pickup Modal */}
      <OrderQrModal
        orderId={qrOrderId}
        open={!!qrOrderId}
        onClose={() => setQrOrderId(null)}
        onCancelled={() => {
          setQrOrderId(null);
          loadOrders();
        }}
      />
    </div>
  );
}

export default OrderHistoryPage;
