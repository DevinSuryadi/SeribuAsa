import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  QrCode,
  Flame,
  Loader2,
  AlertCircle,
  Clock,
  Lock,
  Package,
  ShoppingBasket,
  RefreshCw,
  Receipt,
  TrendingUp,
  Info,
} from "lucide-react";
import { formatIDR, formatDateShort } from "@/lib/format";
import { getWalletBalance, getWalletTransactions, getWalletAllocations } from "@/services/wallet";
import type { WalletBalance, WalletTransaction, WalletAllocation } from "@/services/wallet";
import { OrdersTab } from "@/components/wallet/OrdersTab";
import { WalletTab } from "@/components/wallet/WalletTab";
import { InfoDompetTab } from "@/components/wallet/InfoDompetTab";

type TabValue = "pesanan" | "saldo" | "info";

const DompetNutrisi = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [allocations, setAllocations] = useState<WalletAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state synced with URL search param
  const activeTab = (searchParams.get("tab") as TabValue) ?? "pesanan";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalBalance = balance?.wallet_balance ?? 0;
  const heldBalance = balance?.wallet_held ?? 0;
  const availBalance = balance?.wallet_available ?? 0;
  const expiringSoon = balance?.expiring_soon ?? 0;
  const earliestExpiry = balance?.earliest_expiry;

  const usageMax = Math.max(totalBalance, 2_000_000);
  const usagePct = Math.round((availBalance / usageMax) * 100);

  // ── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout
        title="Dompet & Aktivitas"
        subtitle="Saldo, pesanan, dan riwayat transaksi Anda."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data dompet...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error State ──────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout
        title="Dompet & Aktivitas"
        subtitle="Saldo, pesanan, dan riwayat transaksi Anda."
      >
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">Gagal memuat data</h3>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAll}
              className="border-destructive/30 text-destructive"
            >
              <RefreshCw className="mr-2 h-3 w-3" /> Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dompet & Aktivitas"
      subtitle="Kelola saldo, pesanan, dan riwayat transaksi dalam satu tempat."
    >
      <div className="space-y-6">
        {/* ══════════════════════════════════════════════════════════
            HERO BALANCE CARD — Always visible
        ══════════════════════════════════════════════════════════ */}
        <div
          className="rounded-3xl p-7 relative overflow-hidden shadow-2xl shadow-emerald-900/20 transition-all duration-500 hover:shadow-emerald-900/30"
          style={{ background: "linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)" }}
        >
          {/* Decorative glowing blobs */}
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 pointer-events-none backdrop-blur-sm" />
          <div className="absolute -right-2 top-16 h-20 w-20 rounded-full bg-white/5 pointer-events-none backdrop-blur-sm" />
          <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-white/5 pointer-events-none backdrop-blur-sm" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-white/80" aria-hidden="true" />
                <p className="text-sm text-white/80 font-medium">E-Wallet Nutrisi</p>
              </div>
              <div className="text-4xl font-extrabold text-white tracking-tight mb-1">
                {formatIDR(availBalance)}
              </div>
              <p className="text-xs text-white/60 mb-3">Tersedia untuk belanja</p>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/70 rounded-full transition-[width] duration-700"
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
                    <Lock className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                    {formatIDR(heldBalance)} ditahan
                  </Badge>
                )}
                {earliestExpiry && (
                  <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
                    <Clock className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                    Exp {formatDateShort(earliestExpiry)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick nav to QR Pickup tab */}
            <button
              onClick={() => handleTabChange("pesanan")}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-green-700 rounded-xl"
              title="Lihat Pesanan Saya"
            >
              <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <Package className="h-9 w-9 text-green-700" aria-hidden="true" />
              </div>
              <span className="text-[10px] text-white/70">Pesanan</span>
            </button>
          </div>

          {/* Expiring warning */}
          {expiringSoon > 0 && (
            <div className="relative z-10 mt-4 rounded-xl bg-amber-400/20 border border-amber-300/30 p-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-200 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-amber-100">
                <strong>{formatIDR(expiringSoon)}</strong> saldo akan kadaluarsa dalam 7 hari —
                segera gunakan!
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
                asChild
              >
                <Link to="/dashboard/katalog">
                  <ShoppingBasket className="h-3.5 w-3.5" aria-hidden="true" /> Belanja
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TABS — Pesanan / Saldo / Info
        ══════════════════════════════════════════════════════════ */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-12 p-1 rounded-2xl bg-secondary/60 border border-border gap-1">
            <TabsTrigger
              value="pesanan"
              className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 transition-all"
            >
              <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Pesanan Saya</span>
              <span className="sm:hidden">Pesanan</span>
            </TabsTrigger>
            <TabsTrigger
              value="saldo"
              className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-blue-700 transition-all"
            >
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Riwayat Saldo</span>
              <span className="sm:hidden">Saldo</span>
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="rounded-xl text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-purple-700 transition-all"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Info Dompet</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Pesanan Saya */}
          <TabsContent value="pesanan" className="mt-6 focus-visible:outline-none">
            <OrdersTab />
          </TabsContent>

          {/* Tab: Riwayat Saldo */}
          <TabsContent value="saldo" className="mt-6 focus-visible:outline-none">
            <WalletTab
              transactions={transactions}
              allocations={allocations}
              onRefresh={fetchAll}
            />
          </TabsContent>

          {/* Tab: Info Dompet */}
          <TabsContent value="info" className="mt-6 focus-visible:outline-none">
            <InfoDompetTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DompetNutrisi;
