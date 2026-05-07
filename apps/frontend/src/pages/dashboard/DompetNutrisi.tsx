import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  Info,
  RefreshCw,
  ShoppingBasket,
  Flame,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  Lock,
  CheckCircle2,
  Package,
  X,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import {
  getWalletBalance,
  getWalletTransactions,
  getWalletAllocations,
} from "@/services/wallet";
import type { WalletBalance, WalletTransaction, WalletAllocation } from "@/services/wallet";

const TX_TYPE_CONFIG: Record<string, { label: string; isIn: boolean; icon: typeof ArrowDownRight; color: string; bg: string }> = {
  credit:  { label: "Alokasi Donasi",  isIn: true,  icon: ArrowDownRight, color: "text-emerald-600", bg: "bg-emerald-50"  },
  hold:    { label: "Ditahan Pesanan", isIn: false, icon: Lock,           color: "text-amber-600",   bg: "bg-amber-50"    },
  unhold:  { label: "Dikembalikan",    isIn: true,  icon: CheckCircle2,   color: "text-blue-600",    bg: "bg-blue-50"     },
  debit:   { label: "Pembelian",       isIn: false, icon: ArrowUpRight,   color: "text-rose-500",    bg: "bg-rose-50"     },
  expired: { label: "Kadaluarsa",      isIn: false, icon: X,              color: "text-slate-400",   bg: "bg-slate-100"   },
};

const allowedCategories = [
  { name: "Makanan Pokok", emoji: "🌾", desc: "Beras, jagung, ubi",       color: "bg-amber-50 border-amber-200"  },
  { name: "Protein",       emoji: "🥩", desc: "Daging, ikan, telur",      color: "bg-red-50 border-red-200"     },
  { name: "Susu & Olahan", emoji: "🥛", desc: "Susu, keju, yogurt",       color: "bg-blue-50 border-blue-200"   },
  { name: "Sayuran",       emoji: "🥬", desc: "Semua jenis sayuran",       color: "bg-green-50 border-green-200" },
  { name: "Buah-buahan",   emoji: "🍎", desc: "Semua jenis buah",          color: "bg-rose-50 border-rose-200"   },
  { name: "Kacang-kacangan",emoji: "🫘",desc: "Kedelai, kacang hijau",    color: "bg-orange-50 border-orange-200"},
];

const DompetNutrisi = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [allocations, setAllocations] = useState<WalletAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bal, txRes, allocRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions({ page_size: 20 }),
        getWalletAllocations("active"),
      ]);
      setBalance(bal);
      setTransactions(txRes.items || []);
      setAllocations(allocRes.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalBalance  = balance?.wallet_balance   ?? 0;
  const heldBalance   = balance?.wallet_held      ?? 0;
  const availBalance  = balance?.wallet_available ?? 0;
  const expiringSoon  = balance?.expiring_soon    ?? 0;
  const earliestExpiry = balance?.earliest_expiry;

  const usageMax = Math.max(totalBalance, 2_000_000);
  const usagePct = Math.round((availBalance / usageMax) * 100);

  if (loading) {
    return (
      <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-wallet dan riwayat transaksi Anda.">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data dompet...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-wallet dan riwayat transaksi Anda.">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">Gagal memuat data</h3>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAll} className="border-destructive/30 text-destructive">
              <RefreshCw className="mr-2 h-3 w-3" /> Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-wallet dan riwayat transaksi Anda.">
      <div className="space-y-6">

        {/* ── Hero Balance Card ── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 60%, #047857 100%)" }}
        >
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 top-16 h-20 w-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-white/80" />
                <p className="text-sm text-white/80 font-medium">E-Wallet Nutrisi</p>
              </div>
              <div className="text-4xl font-extrabold text-white tracking-tight mb-1">
                {formatIDR(availBalance)}
              </div>
              <p className="text-xs text-white/60 mb-3">
                Tersedia untuk belanja
              </p>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/70 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {allocations.length} Alokasi Aktif
                </Badge>
                {heldBalance > 0 && (
                  <Badge className="bg-amber-400/30 text-amber-100 border-amber-300/30 text-xs">
                    <Lock className="h-2.5 w-2.5 mr-1" />
                    {formatIDR(heldBalance)} ditahan
                  </Badge>
                )}
                {earliestExpiry && (
                  <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    Exp {new Date(earliestExpiry).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </Badge>
                )}
              </div>
            </div>

            {/* Navigate to orders */}
            <button
              onClick={() => navigate("/dashboard/orders")}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
              title="Lihat Pesanan Aktif"
            >
              <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer">
                <Package className="h-9 w-9 text-green-700" />
              </div>
              <span className="text-[10px] text-white/70">Pesanan</span>
            </button>
          </div>

          {/* Expiring warning */}
          {expiringSoon > 0 && (
            <div className="relative z-10 mt-4 rounded-xl bg-amber-400/20 border border-amber-300/30 p-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-200 flex-shrink-0" />
              <p className="text-xs text-amber-100">
                <strong>{formatIDR(expiringSoon)}</strong> saldo akan kadaluarsa dalam 7 hari — segera gunakan!
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="relative z-10 mt-4 pt-4 border-t border-white/20 flex items-center gap-4">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Total Saldo</p>
              <p className="text-lg font-bold text-white">{formatIDR(totalBalance)}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Ditahan</p>
              <p className="text-lg font-bold text-white">{formatIDR(heldBalance)}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                className="bg-white text-green-700 hover:bg-green-50 border-0 font-semibold text-xs gap-1.5"
                onClick={() => navigate("/dashboard/katalog")}
              >
                <ShoppingBasket className="h-3.5 w-3.5" /> Belanja
              </Button>
              <Button
                size="sm"
                className="bg-white/10 border border-white/40 text-white hover:bg-white/20 font-semibold text-xs gap-1.5"
                onClick={() => navigate("/dashboard/orders")}
              >
                <QrCode className="h-3.5 w-3.5" /> QR Pickup
              </Button>
            </div>
          </div>
        </div>

        {/* ── Active Allocations ── */}
        {allocations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Alokasi Aktif (FIFO)</h2>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {allocations.length} alokasi
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50">
              {allocations.slice(0, 4).map((alloc: WalletAllocation) => {
                const pct = alloc.original_amount > 0
                  ? Math.round((alloc.remaining_amount / alloc.original_amount) * 100)
                  : 0;
                const isExpiringSoon = (alloc.days_until_expiry ?? 999) <= 7;
                return (
                  <div key={alloc.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatIDR(alloc.remaining_amount)}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            / {formatIDR(alloc.original_amount)}
                          </span>
                        </p>
                        <p className={`text-[11px] mt-0.5 ${isExpiringSoon ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                          {isExpiringSoon && "⚠️ "}
                          Kadaluarsa: {alloc.expires_at ? new Date(alloc.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                          {alloc.days_until_expiry !== null && ` (${alloc.days_until_expiry} hari lagi)`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          alloc.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {alloc.status === "active" ? "Aktif" : alloc.status}
                      </Badge>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isExpiringSoon ? "bg-amber-400" : "bg-emerald-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Allowed Categories ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Kategori yang Diperbolehkan</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allowedCategories.map((cat) => (
              <div
                key={cat.name}
                className={`rounded-xl border p-3 flex items-center gap-2.5 transition-transform hover:scale-[1.02] ${cat.color}`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <p className="text-[11px] text-amber-800">
              Saldo <strong>hanya untuk bahan pangan bergizi</strong>. Makanan olahan, junk food,
              dan minuman kemasan tidak diperbolehkan.
            </p>
          </div>
        </div>

        {/* ── Transaction History ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Riwayat Transaksi Wallet</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Perubahan saldo e-wallet masuk &amp; keluar
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" onClick={fetchAll}>
              <RefreshCw className="h-3 w-3" /> Perbarui
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mx-auto mb-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Belum ada transaksi</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Riwayat perubahan saldo wallet Anda akan muncul di sini
                </p>
                <Button size="sm" onClick={() => navigate("/dashboard/katalog")}>
                  <ShoppingBasket className="h-3.5 w-3.5 mr-1.5" /> Mulai Belanja
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
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
                      className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${cfg.bg}`}>
                          <TxIcon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {t.description || cfg.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.created_at ? formatDate(t.created_at) : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${cfg.isIn ? "text-emerald-600" : "text-foreground"}`}>
                          {cfg.isIn ? "+" : "-"}{formatIDR(Math.abs(t.amount || 0))}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
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
    </DashboardLayout>
  );
};

export default DompetNutrisi;
