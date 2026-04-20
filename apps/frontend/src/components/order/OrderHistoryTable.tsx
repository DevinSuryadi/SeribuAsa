import { CalendarDays, ChevronRight, Package, RotateCcw, Store } from "lucide-react";
import type { Order, OrderStatus } from "@/types/orders";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface OrderHistoryTableProps {
  orders: Order[];
  isLoading: boolean;
  onOrderClick: (orderId: string) => void;
  onReorder?: (order: Order) => Promise<void> | void;
  reorderingOrderId?: string | null;
}

const STATUS_BADGE_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700" },
  processing: { bg: "bg-indigo-50", text: "text-indigo-700" },
  shipped: { bg: "bg-purple-50", text: "text-purple-700" },
  delivered: { bg: "bg-green-50", text: "text-green-700" },
  cancelled: { bg: "bg-red-50", text: "text-red-700" },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Terkirim",
  cancelled: "Dibatalkan",
};

/**
 * OrderHistoryTable component
 * Displays orders in a table with status and actions
 */
export function OrderHistoryTable({
  orders,
  isLoading,
  onOrderClick,
  onReorder,
  reorderingOrderId,
}: OrderHistoryTableProps) {
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-5 bg-white border border-gray-200 rounded-xl">
            <Skeleton className="h-4 w-40 mb-3" />
            <Skeleton className="h-6 w-1/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
        <p className="text-gray-600">Belum ada pesanan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const statusColor = STATUS_BADGE_COLORS[order.status] || {
          bg: "bg-gray-100",
          text: "text-gray-700",
        };
        const statusLabel = STATUS_LABELS[order.status] || "Unknown";
        const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
        const totalAmount = Number(order.cart_total ?? order.cash_amount ?? 0);
        const voucherDiscount = Number(order.voucher_discount ?? 0);
        const cashAmount = Number(order.cash_amount ?? Math.max(0, totalAmount - voucherDiscount));
        const createdAt = order.created_at ? new Date(order.created_at) : null;
        const isDateValid = createdAt && !Number.isNaN(createdAt.getTime());

        return (
          <div
            key={order.id}
            className="w-full p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all group"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500">Order ID</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {order.id}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${statusColor.bg} ${statusColor.text}`}
                >
                  {statusLabel}
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
              <div className="inline-flex items-center gap-2">
                <Package size={14} className="text-gray-400" />
                <span>{itemsCount} item</span>
              </div>
              <div className="inline-flex items-center gap-2 sm:justify-end">
                <CalendarDays size={14} className="text-gray-400" />
                <span>
                  {isDateValid
                    ? formatDate(createdAt)
                    : "Tanggal tidak tersedia"}
                </span>
              </div>
              {order.vendor_store_name && (
                <div className="inline-flex items-center gap-2 sm:col-span-2">
                  <Store size={14} className="text-gray-400" />
                  <span className="truncate">{order.vendor_store_name}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Total Belanja</span>
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm">
                  <p className="text-green-700">Voucher: -{formatCurrency(voucherDiscount)}</p>
                  <p className="text-gray-600">Tunai: {formatCurrency(cashAmount)}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => onOrderClick(order.id)}
                aria-label={`Lihat detail pesanan ${order.id}`}
              >
                Lihat Detail
                <ChevronRight size={16} className="ml-2" />
              </Button>

              {onReorder && (
                <Button
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => void onReorder(order)}
                  disabled={reorderingOrderId === order.id}
                  aria-label={`Pesan ulang order ${order.id}`}
                >
                  <RotateCcw size={16} className="mr-2" />
                  {reorderingOrderId === order.id ? "Memproses..." : "Pesan Lagi"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
