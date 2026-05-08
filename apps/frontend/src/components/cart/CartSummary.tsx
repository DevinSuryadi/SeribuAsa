import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CartSummaryProps {
  totalAmount: number;
  walletBalance: number;
  canAfford: boolean;
  isLoading?: boolean;
}

/**
 * CartSummary component showing total amounts and wallet balance
 */
export function CartSummary({
  totalAmount,
  walletBalance = 0,
  canAfford,
  isLoading = false,
}: CartSummaryProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 animate-pulse">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3 pb-4 border-b border-gray-200">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="pt-4 border-t border-gray-200">
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <h2 className="text-lg font-bold text-gray-900">Ringkasan Pesanan</h2>

      {/* Amount Breakdown */}
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium text-gray-900">
            Rp {totalAmount.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Wallet Info */}
      <div
        className={`${canAfford ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"} border rounded-lg p-4 space-y-2`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet size={16} className={canAfford ? "text-emerald-600" : "text-red-600"} />
            <span className="text-sm font-medium text-gray-900">Saldo Dompet:</span>
          </div>
          <span className={`font-bold ${canAfford ? "text-emerald-600" : "text-red-600"}`}>
            Rp {walletBalance.toLocaleString("id-ID")}
          </span>
        </div>

        {canAfford ? (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 size={14} />
            <span>Saldo mencukupi untuk pesanan ini</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={14} />
            <span>Kekurangan: Rp {(totalAmount - walletBalance).toLocaleString("id-ID")}</span>
          </div>
        )}
      </div>

      {/* Total After Wallet */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sisa Setelah Bayar:</span>
          <span className="text-lg font-bold text-gray-900">
            Rp {Math.max(0, walletBalance - totalAmount).toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </div>
  );
}
