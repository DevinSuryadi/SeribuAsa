import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/format";

interface CartSummaryProps {
  totalAmount: number;
  walletBalance: number;
  canAfford: boolean;
  isLoading?: boolean;
}

/**
 * CartSummary — shows total, wallet balance and affordability status.
 */
export function CartSummary({
  totalAmount,
  walletBalance = 0,
  canAfford,
  isLoading = false,
}: CartSummaryProps) {
  const remainder = Math.max(0, walletBalance - totalAmount);
  const shortfall = Math.max(0, totalAmount - walletBalance);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-pulse">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-3 pb-4 border-b border-border">
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="pt-4 border-t border-border">
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
      <h2 className="text-base font-bold text-foreground">Ringkasan Pesanan</h2>

      {/* Amount */}
      <div className="pb-4 border-b border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Belanja</span>
          <span className="font-bold text-foreground">{formatIDR(totalAmount)}</span>
        </div>
      </div>

      {/* Wallet status */}
      <div
        className={`rounded-xl border p-4 space-y-2 transition-colors ${
          canAfford
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
            : "bg-destructive/5 border-destructive/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet
              className={`h-4 w-4 ${canAfford ? "text-emerald-600" : "text-destructive"}`}
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-foreground">Saldo Dompet</span>
          </div>
          <span className={`font-bold text-sm ${canAfford ? "text-emerald-600" : "text-destructive"}`}>
            {formatIDR(walletBalance)}
          </span>
        </div>

        {canAfford ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Saldo mencukupi untuk pesanan ini
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Kekurangan {formatIDR(shortfall)} — kurangi item atau top-up saldo
          </div>
        )}
      </div>

      {/* Remainder */}
      {canAfford && (
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sisa Saldo Setelah Bayar</span>
            <span className="font-bold text-foreground">{formatIDR(remainder)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
