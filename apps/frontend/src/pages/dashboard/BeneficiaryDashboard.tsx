import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVoucherData } from "@/hooks/useVoucherData";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ClipboardList,
  Activity,
  ShoppingBasket,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ShoppingCart,
  Ticket,
  CheckCircle2,
  ChevronRight,
  Package,
  Flame,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { getLatestFIESStatus, getLatestNutritionMeasurement } from "@/services/nutrition";
import { formatIDR, formatDate } from "@/lib/format";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import { toast } from "sonner";
import type { FIESStatus, NutritionData, VoucherTransaction } from "@/types";

interface QuickAction {
  label: string;
  desc: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge: string | null;
  primary: boolean;
}

export default function BeneficiaryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    data: balance,
    transactions,
    loading: voucherLoading,
    error: voucherError,
    refetch: refetchVouchers,
  } = useVoucherData();

  const [fiesStatus, setFiesStatus] = useState<FIESStatus | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useStaggerChildren({ stagger: 0.08 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchAdditionalData = useCallback(async () => {
    if (!user?.id) return;

    setDataLoading(true);
    setError(null);

    try {
      const [fiesData, nutritionMeasure] = await Promise.all([
        getLatestFIESStatus(user.id).catch(() => null),
        getLatestNutritionMeasurement(user.id).catch(() => null),
      ]);

      setFiesStatus(fiesData);
      setNutritionData(nutritionMeasure);
    } catch (err: any) {
      const errorMessage = err.message || "Gagal memuat data";
      setError(errorMessage);
      toast.error("Gagal memuat data dashboard", {
        description: errorMessage,
      });
    } finally {
      setDataLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchAdditionalData();
    }
  }, [user, fetchAdditionalData]);

  // Simple property access - no need for useMemo (would add overhead)
  const totalBalance = balance?.total_balance ?? 0;
  const activeVouchers = balance?.active_vouchers?.length ?? 0;
  const expiringSoon = balance?.expiring_soon?.count ?? 0;

  const hasFiesThisMonth = useMemo(() => {
    if (!fiesStatus?.survey_date) return false;
    const surveyDate = new Date(fiesStatus.survey_date);
    const now = new Date();
    return (
      surveyDate.getFullYear() === now.getFullYear() && surveyDate.getMonth() === now.getMonth()
    );
  }, [fiesStatus]);

  const isLoading = authLoading || voucherLoading || dataLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Beranda" subtitle="Penerima Manfaat">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || voucherError) {
    return (
      <DashboardLayout title="Beranda" subtitle="Penerima Manfaat">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">Gagal memuat data</h3>
            <p className="text-sm text-red-600 mb-3">{error || voucherError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchVouchers();
                fetchAdditionalData();
              }}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="mr-2 h-3 w-3" /> Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const quickActions: QuickAction[] = [
    {
      label: "Katalog Pangan",
      desc: "Beli bahan makanan bergizi",
      icon: ShoppingBasket,
      href: "/dashboard/katalog",
      color: "from-green-500 to-emerald-600",
      badge: null,
      primary: true,
    },
    {
      label: "Keranjang Belanja",
      desc: "Lihat & kelola item belanja",
      icon: ShoppingCart,
      href: "/dashboard/cart",
      color: "from-blue-500 to-blue-600",
      badge: null,
      primary: false,
    },
    {
      label: "Penukaran Voucher",
      desc: "Tukar voucher di vendor",
      icon: Ticket,
      href: "/dashboard/penukaran-voucher",
      color: "from-purple-500 to-purple-600",
      badge: activeVouchers > 0 ? `${activeVouchers} aktif` : null,
      primary: false,
    },
    {
      label: "Riwayat Pesanan",
      desc: "Lihat pesanan sebelumnya",
      icon: Package,
      href: "/dashboard/orders",
      color: "from-orange-500 to-orange-600",
      badge: null,
      primary: false,
    },
    {
      label: "Isi Survei FIES",
      desc: "Survei ketahanan pangan",
      icon: ClipboardList,
      href: "/dashboard/survei-fies",
      color: "from-red-500 to-red-600",
      badge: !hasFiesThisMonth ? "Belum" : null,
      primary: false,
    },
    {
      label: "Status Gizi Anak",
      desc: "Input data tumbuh kembang",
      icon: Activity,
      href: "/dashboard/pemantauan-gizi",
      color: "from-teal-500 to-teal-600",
      badge: null,
      primary: false,
    },
  ];

  const userDisplayName =
    user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Penerima";

  return (
    <DashboardLayout
      title={`Selamat datang, ${userDisplayName}`}
      subtitle="Kelola voucher nutrisi dan pantau kesehatan keluarga Anda."
    >
      <div className="space-y-6">
        {/* Flow Progress Steps — Horizontal Stepper */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Alur Belanja Penerima
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                step: 1,
                label: "Pilih Produk",
                sublabel: "Katalog pangan bergizi",
                icon: ShoppingBasket,
                href: "/dashboard/katalog",
                color: "text-green-600",
                bg: "bg-green-50",
                border: "border-green-200",
                active: true,
              },
              {
                step: 2,
                label: "Keranjang",
                sublabel: "Atur item belanja",
                icon: ShoppingCart,
                href: "/dashboard/cart",
                color: "text-blue-600",
                bg: "bg-blue-50",
                border: "border-blue-200",
                active: false,
              },
              {
                step: 3,
                label: "Checkout",
                sublabel: "Bayar dengan voucher",
                icon: Ticket,
                href: "/checkout",
                color: "text-purple-600",
                bg: "bg-purple-50",
                border: "border-purple-200",
                active: false,
              },
              {
                step: 4,
                label: "Selesai",
                sublabel: "Pesanan terkonfirmasi",
                icon: CheckCircle2,
                href: "/dashboard/orders",
                color: "text-orange-600",
                bg: "bg-orange-50",
                border: "border-orange-200",
                active: false,
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Link
                  key={i}
                  to={s.href}
                  className={`relative rounded-xl border p-3 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group ${s.border} ${s.bg}`}
                >
                  {/* Step number badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} border ${s.border} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <span className={`text-[10px] font-black ${s.color} opacity-50`}>
                      {String(s.step).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${s.color} leading-tight`}>{s.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {s.sublabel}
                    </p>
                  </div>
                  {/* Arrow connector - visible only on non-last items */}
                  {i < 3 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* FIES Warning Banner */}
        {!hasFiesThisMonth && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                Survei FIES Bulan Ini Belum Diisi
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Isi survei agar kelayakan voucher Anda tetap terjaga.
              </p>
            </div>
            <Button
              size="sm"
              className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-0"
              asChild
            >
              <Link to="/dashboard/survei-fies">Isi Sekarang</Link>
            </Button>
          </div>
        )}

        {/* KPI Cards */}
        <div ref={gridRef} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Balance - Primary Card */}
          <div
            className="col-span-2 rounded-2xl p-5 cursor-pointer relative overflow-hidden group"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}
            onClick={() => navigate("/dashboard/dompet-nutrisi")}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {activeVouchers} Voucher Aktif
                </Badge>
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
                {formatIDR(totalBalance)}
              </div>
              <p className="text-sm text-white/80">Saldo E-Voucher</p>
              {expiringSoon > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Flame className="h-3 w-3 text-amber-300" />
                  <p className="text-xs text-amber-200">{expiringSoon} voucher hampir kadaluarsa</p>
                </div>
              )}
              <div className="flex items-center gap-1 mt-3 text-white/70">
                <span className="text-xs">Lihat dompet</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* FIES Status */}
          <div
            className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
            onClick={() => navigate("/dashboard/survei-fies")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
              {hasFiesThisMonth ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="text-lg font-bold text-foreground">
              {fiesStatus?.classification || "Belum Ada"}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Survei FIES</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {fiesStatus?.survey_date ? formatDate(fiesStatus.survey_date) : "Isi survei bulanan"}
            </p>
          </div>

          {/* Nutrition Status */}
          <div
            className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
            onClick={() => navigate("/dashboard/pemantauan-gizi")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </div>
            </div>
            <div className="text-lg font-bold text-foreground">
              {nutritionData?.classification || "Normal"}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Status Gizi</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Z-score:{" "}
              {typeof nutritionData?.z_score_weight_height === "number"
                ? nutritionData.z_score_weight_height.toFixed(1)
                : "-"}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Quick Actions */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Fitur Utama</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={`relative rounded-2xl p-4 border transition-all group hover:shadow-md hover:-translate-y-0.5 ${
                      action.primary
                        ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100"
                        : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    {action.badge && (
                      <div className="absolute top-2 right-2">
                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-red-500 text-white border-0">
                          {action.badge}
                        </Badge>
                      </div>
                    )}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 bg-gradient-to-br ${action.color}`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-foreground leading-tight">
                      {action.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {action.desc}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Transaksi Terakhir</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2" asChild>
                <Link to="/dashboard/dompet-nutrisi">
                  Semua <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {transactions.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mx-auto mb-3">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Belum ada transaksi</p>
                  <p className="text-xs text-muted-foreground">
                    Mulai belanja untuk melihat riwayat
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {transactions.slice(0, 4).map((t: VoucherTransaction) => {
                    const isCredit = (t.amount || 0) > 0;
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                      >
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                            isCredit ? "bg-green-100" : "bg-secondary"
                          }`}
                        >
                          <Wallet
                            className={`h-3.5 w-3.5 ${isCredit ? "text-green-600" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {t.description || t.source || "Transaksi"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {t.date ? formatDate(t.date) : "-"}
                          </div>
                        </div>
                        <div
                          className={`text-xs font-bold flex-shrink-0 ${isCredit ? "text-green-600" : "text-foreground"}`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatIDR(Math.abs(t.amount || 0))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
