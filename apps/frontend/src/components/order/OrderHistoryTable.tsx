import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import type { Order, OrderStatus } from "@/types/orders";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderHistoryTableProps {
  orders: Order[];
  isLoading: boolean;
  onOrderClick: (orderId: string) => void;
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
export function OrderHistoryTable({ orders, isLoading, onOrderClick }: OrderHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-600">Belum ada pesanan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const statusColor = STATUS_BADGE_COLORS[order.status];
        const statusLabel = STATUS_LABELS[order.status];

        return (
          <button
            key={order.id}
            onClick={() => onOrderClick(order.id)}
            className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Order ID</p>
                <p className="text-lg font-bold text-gray-900">{order.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text}`}
                >
                  {statusLabel}
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors"
                />
              </div>
            </div>

            {/* Items count and Date */}
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>{order.items.length} item(s)</span>
              <span>{format(new Date(order.created_at), "dd MMM yyyy", { locale: idLocale })}</span>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  Rp {order.cash_amount.toLocaleString("id-ID")}
                </span>
              </div>
              {order.voucher_discount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Diskon Voucher: Rp {order.voucher_discount.toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
