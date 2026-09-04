import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  CheckCircle2,
  X,
  TrendingUp,
  ShoppingBasket,
  RefreshCw,
} from "lucide-react";
import { formatIDR, formatDate, formatDateShort } from "@/lib/format";
import type { WalletTransaction, WalletAllocation } from "@/services/wallet";

const TX_TYPE_CONFIG: Record<
  string,
  { label: string; isIn: boolean; icon: typeof ArrowDownRight; color: string; bg: string }
> = {
  credit: {
    label: "Alokasi Donasi",
    isIn: true,
    icon: ArrowDownRight,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  hold: {
    label: "Ditahan Pesanan",
    isIn: false,
    icon: Lock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  unhold: {
    label: "Dikembalikan",
    isIn: true,
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  debit: {
    label: "Pembelian",
    isIn: false,
    icon: ArrowUpRight,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  expired: {
    label: "Kadaluarsa",
    isIn: false,
    icon: X,
    color: "text-slate-400",
    bg: "bg-slate-100",
  },
};

interface WalletTabProps {
  transactions: WalletTransaction[];
  allocations: WalletAllocation[];
  onRefresh: () => void;
}

export function WalletTab({ transactions, allocations, onRefresh }: WalletTabProps) {
  return (
    <div className="space-y-6">
      {/* ── Active Allocations ── */}
      {allocations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Alokasi Aktif (FIFO)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saldo dikonsumsi dari alokasi tertua terlebih dahulu
              </p>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full font-medium">
              {allocations.length} alokasi
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50">
            {allocations.slice(0, 5).map((alloc: WalletAllocation) => {
              const pct =
                alloc.original_amount > 0
                  ? Math.round((alloc.remaining_amount / alloc.original_amount) * 100)
                  : 0;
              const isExpiringSoon = (alloc.days_until_expiry ?? 999) <= 7;
              return (
                <div
                  key={alloc.id}
                  className="p-4 transition-colors hover:bg-secondary/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatIDR(alloc.remaining_amount)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          / {formatIDR(alloc.original_amount)}
                        </span>
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          isExpiringSoon ? "text-amber-600 font-semibold" : "text-muted-foreground"
                        }`}
                      >
                        {isExpiringSoon && "⚠️ "}
                        Kadaluarsa: {alloc.expires_at ? formatDateShort(alloc.expires_at) : "-"}
                        {alloc.days_until_expiry !== null &&
                          ` (${alloc.days_until_expiry} hari lagi)`}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        alloc.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {alloc.status === "active" ? "Aktif" : alloc.status}
                    </Badge>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        isExpiringSoon ? "bg-amber-400" : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transaction History ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Mutasi Saldo E-Wallet</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Perubahan saldo masuk &amp; keluar
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1.5"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" /> Perbarui
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mx-auto mb-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Belum ada mutasi saldo</p>
              <p className="text-xs text-muted-foreground mb-4">
                Perubahan saldo e-wallet Anda akan muncul di sini
              </p>
              <Button size="sm" asChild>
                <Link to="/dashboard/katalog">
                  <ShoppingBasket className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" /> Mulai
                  Belanja
                </Link>
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {transactions.map((t: WalletTransaction) => {
                const cfg = TX_TYPE_CONFIG[t.transaction_type] ?? {
                  label: t.transaction_type,
                  isIn: false,
                  icon: ArrowUpRight,
                  color: "text-slate-500",
                  bg: "bg-slate-100",
                };
                const TxIcon = cfg.icon;
                return (
                  <div
                    key={t.id}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-secondary/60 hover:shadow-sm border border-transparent hover:border-border/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 shadow-sm ${cfg.bg}`}
                      >
                        <TxIcon className={`h-4 w-4 ${cfg.color}`} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {t.description || cfg.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.created_at ? formatDate(t.created_at) : "-"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-black tracking-tight ${
                          cfg.isIn ? "text-emerald-600" : "text-foreground"
                        }`}
                      >
                        {cfg.isIn ? "+" : "-"}
                        {formatIDR(Math.abs(t.amount || 0))}
                      </div>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-[9px] font-semibold tracking-wider ${
                          cfg.isIn
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}
                      >
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
