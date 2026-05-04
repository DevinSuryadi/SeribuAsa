import { Calendar, ArrowDownLeft, ArrowUpRight, XCircle, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface Transaction {
  id: string;
  voucher_id: string;
  order_id: string | null;
  transaction_type: string;
  amount: number;
  created_at: string;
}

interface VoucherTransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

/**
 * VoucherTransactionList component showing voucher transaction history
 */
export function VoucherTransactionList({
  transactions,
  isLoading = false,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
}: VoucherTransactionListProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "allocation":
        return <ArrowDownLeft className="text-green-600" size={18} />;
      case "redeemed":
        return <ArrowUpRight className="text-blue-600" size={18} />;
      case "expired":
        return <XCircle className="text-gray-600" size={18} />;
      case "revoked":
        return <AlertCircle className="text-red-600" size={18} />;
      default:
        return <AlertCircle className="text-gray-600" size={18} />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "allocation":
        return "Alokasi";
      case "redeemed":
        return "Ditukar";
      case "expired":
        return "Hangus";
      case "revoked":
        return "Dibatalkan";
      case "adjusted":
        return "Disesuaikan";
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "allocation":
        return "text-green-600 bg-green-50";
      case "redeemed":
        return "text-blue-600 bg-blue-50";
      case "expired":
        return "text-gray-600 bg-gray-50";
      case "revoked":
        return "text-red-600 bg-red-50";
      case "adjusted":
        return "text-amber-700 bg-amber-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const isMoneyOut = (type: string) => ["redeemed", "expired", "revoked"].includes(type);

  if (transactions.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />}
        title="Tidak Ada Riwayat"
        description="Riwayat transaksi voucher Anda akan muncul di sini"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Transaction List */}
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            {/* Icon and Details */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`p-2.5 rounded-full ${getTransactionColor(transaction.transaction_type).split(" ")[1]}`}
              >
                {getTransactionIcon(transaction.transaction_type)}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {getTransactionLabel(transaction.transaction_type)}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(transaction.created_at).toLocaleDateString("id-ID", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p
                className={`font-bold ${isMoneyOut(transaction.transaction_type) ? "text-red-600" : "text-green-600"}`}
              >
                {isMoneyOut(transaction.transaction_type) ? "-" : "+"}
                Rp {transaction.amount.toLocaleString("id-ID")}
              </p>
              {transaction.order_id && (
                <p className="text-xs text-gray-600">
                  Order: {transaction.order_id.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Memuat riwayat...</p>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && onPageChange && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sebelumnya
          </button>

          <span className="px-3 py-2 text-sm text-gray-600">
            Halaman {page} dari {Math.ceil(total / pageSize)}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= Math.ceil(total / pageSize) || isLoading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
