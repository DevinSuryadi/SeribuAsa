import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Package,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ReceiptText,
  Store,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────
function computeOrderTotal(order: Order): number {
  if (order.cart_total && Number(order.cart_total) > 0) return Number(order.cart_total);
  if (Array.isArray(order.items) && order.items.length > 0) {
    const sum = order.items.reduce((acc, item) => {
      const sub = Number(item.subtotal ?? 0);
      const byPrice = Number(item.price ?? 0) * Number(item.quantity ?? 1);
      return acc + (sub > 0 ? sub : byPrice);
    }, 0);
    if (sum > 0) return sum;
  }
  return Number(order.cash_amount ?? 0);
}

// ── Status config ──────────────────────────────────────────────
const statusMap: Record<
  string,
  { label: string; cls: string; icon: React.ElementType; dot: string }
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

// ── Compact OrderRow ───────────────────────────────────────────
/**
 * Compact single-row order card — no separate header/body sections.
 * Shows: status dot + ID + badges | item chips | total + actions
 */
const OrderRow = memo(function OrderRow({
  order,
  onOrderClick,
  onReorder,
  reorderingId,
}: {
  order: Order;
  onOrderClick: (id: string) => void;
  onReorder: (o: Order) => void;
  reorderingId: string | null;
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
  const items = Array.isArray(order.items) ? order.items : [];
  const isPending = order.status === "pending" || order.status === "confirmed";

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/70 bg-card hover:bg-secondary/30 hover:border-border hover:shadow-sm transition-all duration-200">
      {/* Status dot */}
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${sc.dot}`} />

      {/* Left: ID + status + store */}
      <div className="flex flex-col min-w-0 w-28 flex-shrink-0">
        <span className="text-[11px] font-mono text-muted-foreground truncate">
          #{order.id?.slice(0, 8).toUpperCase()}
        </span>
        <Badge
          variant="outline"
          className={`mt-0.5 text-[9px] border gap-0.5 w-fit ${sc.cls}`}
        >
          <StatusIcon className="h-2 w-2" aria-hidden="true" />
          {sc.label}
        </Badge>
      </div>

      {/* Middle: item chips + store + date */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-0.5">
          {items.slice(0, 3).map((item: OrderItem, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground border border-border/60"
            >
              <span className="truncate max-w-[90px]">{item.product_name || "Produk"}</span>
              <span className="text-muted-foreground/50">×{item.quantity}</span>
            </span>
          ))}
          {items.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground border border-border/60">
              +{items.length - 3}
            </span>
          )}
          {items.length === 0 && (
            <span className="text-[10px] text-muted-foreground/50">Tidak ada item</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          {order.vendor_store_name && (
            <span className="flex items-center gap-0.5">
              <Store className="h-2.5 w-2.5" />
              {order.vendor_store_name}
            </span>
          )}
          <span>{formatDate(order.created_at)}</span>
        </div>
      </div>

      {/* Right: total + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold text-foreground hidden sm:block">
          {total > 0 ? formatIDR(total) : "—"}
        </span>

        <div className="flex gap-1">
          {/* QR badge for pending/confirmed — opens in detail page */}
          {isPending && (
            <span className="h-7 px-2 flex items-center gap-1 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 text-[10px] font-semibold">
              Menunggu
            </span>
          )}
          <button
            type="button"
            title="Pesan Lagi"
            onClick={() => onReorder(order)}
            disabled={isReordering || items.length === 0}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
          >
            {isReordering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            title="Lihat Detail"
            onClick={() => onOrderClick(order.id)}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Skeleton Row ────────────────────────────────────────────────
function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/70 bg-card">
      <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
      <div className="flex flex-col gap-1 w-28 flex-shrink-0">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Skeleton className="hidden sm:block h-4 w-20" />
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export function OrdersTab() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, page_size: 15 });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    page_size: 15,
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
      });
      setOrders(Array.isArray(response?.orders) ? response.orders : []);
      setPagination({
        total: response?.total ?? 0,
        page: response?.page ?? 1,
        page_size: response?.page_size ?? 15,
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

  return (
    <div className="space-y-3">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Memuat..." : `${pagination.total} pesanan`}
        </p>
        <button
          type="button"
          onClick={loadOrders}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Perbarui
        </button>
      </div>

      {/* ── Empty State ── */}
      {orders.length === 0 && !isLoading && (
        <div className="rounded-3xl border-2 border-dashed border-border/60 bg-gradient-to-b from-card to-secondary/20 text-center py-16 px-8 transition-all hover:border-emerald-200">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary/80 mx-auto mb-4 shadow-sm transition-transform hover:scale-105 hover:rotate-2">
            <ReceiptText className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-base font-bold text-foreground mb-1">Belum Ada Pesanan</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
            Riwayat pembelian akan muncul di sini setelah Anda checkout dari katalog.
          </p>
          <Button asChild size="sm" className="gap-2">
            <Link to="/dashboard/katalog">
              <ShoppingCart className="h-3.5 w-3.5" /> Mulai Berbelanja
            </Link>
          </Button>
        </div>
      )}

      {/* ── Order List ── */}
      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <OrderRowSkeleton key={i} />)
          : orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onOrderClick={handleOrderClick}
              onReorder={handleReorder}
              reorderingId={reorderingOrderId}
            />
          ))}
      </div>

      {/* ── Pagination ── */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Hal. {pagination.page}/{pagination.total_pages}
          </p>
          <div className="flex gap-1.5">
            <Button
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1 || isLoading}
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
            >
              ←
            </Button>
            <Button
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.total_pages || isLoading}
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
            >
              →
            </Button>
          </div>
        </div>
      )}

      {/* ── QR Modal ── */}
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
