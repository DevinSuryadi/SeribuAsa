import { useEffect, useState, useMemo, useCallback } from "react";
import type { ElementType } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVoucherData } from "@/hooks/useVoucherData";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  getLatestFIESStatus,
  getLatestNutritionMeasurement,
} from "@/services/nutrition";
import { formatIDR, formatDate } from "@/lib/format";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import { toast } from "sonner";
import type { FIESStatus, NutritionData, VoucherTransaction } from "@/types";

interface QuickAction {
  label: string;
  desc: string;
  icon: ElementType;
  href: string;
  iconWrapClass: string;
  iconClass: string;
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  linkLabel: string;
  href: string;
  icon: ElementType;
  iconWrapClass: string;
  iconClass: string;
  valueClass: string;
  accentClass: string;
  showWarning?: boolean;
}

function SummaryCard({
  title,
  value,
  description,
  linkLabel,
  href,
  icon: Icon,
  iconWrapClass,
  iconClass,
  valueClass,
  accentClass,
  showWarning = false,
}: SummaryCardProps) {
  return (
    <Link
      to={href}
      className="group relative overflow-hidden rounded-[18px] border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)]"
    >
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-9 opacity-55 ${accentClass}`}
      />

      {showWarning && (
        <AlertTriangle className="absolute right-3.5 top-3.5 h-4 w-4 text-amber-500" />
      )}

      <div className="relative z-10 flex min-h-[72px] items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
        >
          <Icon className={`h-4 w-4 ${iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium leading-tight text-slate-600">
            {title}
          </p>

          <p
            className={`mt-0.5 text-[19px] font-extrabold leading-none tracking-tight ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-1 whitespace-pre-line text-[11px] leading-snug text-slate-500">
            {description}
          </p>

          <div
            className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-bold ${valueClass}`}
          >
            <span>{linkLabel}</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

const getFiesLabel = (classification?: string | null) => {
  if (!classification) return "Belum Ada";

  const normalized = classification.toLowerCase();

  if (
    normalized === "low" ||
    normalized === "mild" ||
    normalized === "food_secure"
  ) {
    return "Baik";
  }

  if (normalized === "moderate" || normalized === "medium") {
    return "Sedang";
  }

  if (normalized === "severe" || normalized === "high") {
    return "Buruk";
  }

  return classification;
};

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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal memuat data";

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

  const totalBalance = balance?.total_balance ?? 0;
  const activeVouchers = balance?.active_vouchers?.length ?? 0;

  const hasFiesThisMonth = useMemo(() => {
    if (!fiesStatus?.survey_date) return false;

    const surveyDate = new Date(fiesStatus.survey_date);
    const now = new Date();

    return (
      surveyDate.getFullYear() === now.getFullYear() &&
      surveyDate.getMonth() === now.getMonth()
    );
  }, [fiesStatus]);

  const isLoading = authLoading || voucherLoading || dataLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Beranda" subtitle="Penerima Manfaat">
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Memuat dashboard...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || voucherError) {
    return (
      <DashboardLayout title="Beranda" subtitle="Penerima Manfaat">
        <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>

          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-red-800">
              Gagal memuat data
            </h3>

            <p className="mb-3 text-sm text-red-600">
              {error || voucherError}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchVouchers();
                fetchAdditionalData();
              }}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Coba Lagi
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
      iconWrapClass: "bg-green-100",
      iconClass: "text-green-600",
    },
    {
      label: "Keranjang Belanja",
      desc: "Lihat & kelola item belanja",
      icon: ShoppingCart,
      href: "/dashboard/cart",
      iconWrapClass: "bg-blue-100",
      iconClass: "text-blue-600",
    },
    {
      label: "Riwayat Pesanan",
      desc: "Lihat pesanan sebelumnya",
      icon: Package,
      href: "/dashboard/orders",
      iconWrapClass: "bg-orange-100",
      iconClass: "text-orange-600",
    },
    {
      label: "Pemantauan Gizi",
      desc: "Pantau tumbuh kembang anak",
      icon: Activity,
      href: "/dashboard/pemantauan-gizi",
      iconWrapClass: "bg-teal-100",
      iconClass: "text-teal-600",
    },
  ];

  const shoppingSteps = [
    {
      number: 1,
      label: "Pilih Produk",
      desc: "Pilih produk bergizi",
      icon: ShoppingBasket,
      iconWrapClass: "bg-green-100",
      iconClass: "text-green-600",
    },
    {
      number: 2,
      label: "Keranjang",
      desc: "Atur item belanja",
      icon: ShoppingCart,
      iconWrapClass: "bg-blue-100",
      iconClass: "text-blue-600",
    },
    {
      number: 3,
      label: "Pembayaran",
      desc: "Bayar dengan voucher",
      icon: Ticket,
      iconWrapClass: "bg-purple-100",
      iconClass: "text-purple-600",
    },
    {
      number: 4,
      label: "Selesai",
      desc: "Pesanan terkonfirmasi",
      icon: CheckCircle2,
      iconWrapClass: "bg-orange-100",
      iconClass: "text-orange-600",
    },
  ];

  const getNutritionLabel = (classification?: string | null) => {
    if (!classification) return "Normal";

    const normalized = classification.toLowerCase();

    if (normalized === "normal") return "Normal";
    if (normalized === "moderate_malnourished") return "Kurang Gizi";
    if (normalized === "severe_malnourished") return "Gizi Buruk";

    return classification.charAt(0).toUpperCase() + classification.slice(1);
  };

  const userDisplayName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Penerima";

  const fiesValue = getFiesLabel(fiesStatus?.classification);
  const nutritionValue = getNutritionLabel(nutritionData?.classification);

  const nutritionZScore =
    typeof nutritionData?.z_score_weight_height === "number"
      ? nutritionData.z_score_weight_height.toFixed(1)
      : "-";

  return (
    <DashboardLayout
      title={`Selamat datang, ${userDisplayName}`}
      subtitle="Kelola voucher nutrisi dan pantau kesehatan keluarga Anda."
    >
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-3 pb-3 lg:max-h-[calc(100svh-140px)] lg:overflow-hidden">
        {/* Summary Cards */}
        <div ref={gridRef} className="grid shrink-0 gap-3 lg:grid-cols-3">
          <SummaryCard
            title="Saldo E-Voucher"
            value={formatIDR(totalBalance)}
            description={`${activeVouchers} voucher aktif`}
            linkLabel="Lihat dompet"
            href="/dashboard/dompet-nutrisi"
            icon={Wallet}
            iconWrapClass="bg-green-100"
            iconClass="text-green-600"
            valueClass="text-green-600"
            accentClass="bg-[radial-gradient(circle_at_80%_110%,rgba(34,197,94,0.16),transparent_45%)]"
          />

          <SummaryCard
            title="Status Survei FIES"
            value={fiesValue}
            description={
              fiesStatus?.survey_date
                ? formatDate(fiesStatus.survey_date)
                : "Isi survei bulanan"
            }
            linkLabel="Lihat survei"
            href="/dashboard/survei-fies"
            icon={ClipboardList}
            iconWrapClass="bg-blue-100"
            iconClass="text-blue-600"
            valueClass="text-blue-600"
            accentClass="bg-[radial-gradient(circle_at_80%_110%,rgba(59,130,246,0.12),transparent_45%)]"
            showWarning={!hasFiesThisMonth}
          />

          <SummaryCard
            title="Status Gizi Anak"
            value={nutritionValue}
            description={`Status Gizi\nz-score: ${nutritionZScore}`}
            linkLabel="Lihat detail"
            href="/dashboard/pemantauan-gizi"
            icon={TrendingUp}
            iconWrapClass="bg-teal-100"
            iconClass="text-teal-600"
            valueClass="text-teal-600"
            accentClass="bg-[radial-gradient(circle_at_80%_110%,rgba(20,184,166,0.14),transparent_45%)]"
          />
        </div>

        {/* FIES Warning Banner */}
        {!hasFiesThisMonth && (
          <div className="flex shrink-0 flex-col gap-2 rounded-[16px] border border-orange-200 bg-orange-50/70 px-4 py-2.5 shadow-[0_6px_18px_rgba(251,146,60,0.06)] sm:flex-row sm:items-center">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-orange-700">
                Survei FIES Bulan Ini Belum Diisi
              </p>

              <p className="mt-0.5 text-xs leading-snug text-slate-600">
                Isi survei agar kelayakan voucher Anda tetap terjaga.
              </p>
            </div>

            <Button
              className="h-8 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm hover:bg-orange-600 sm:min-w-[108px]"
              asChild
            >
              <Link to="/dashboard/survei-fies">Isi Sekarang</Link>
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.03fr)_minmax(340px,0.97fr)] xl:items-stretch">
          {/* Left Column */}
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            {/* Quick Actions */}
            <section className="shrink-0 rounded-[18px] border border-slate-200/80 bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <h2 className="mb-3 text-[15px] font-bold tracking-tight text-slate-900">
                Aksi Cepat
              </h2>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.label}
                      to={action.href}
                      className="group flex min-h-[68px] items-center gap-3 rounded-[15px] border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_10px_22px_rgba(15,23,42,0.065)]"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${action.iconWrapClass}`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] ${action.iconClass}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-slate-900">
                          {action.label}
                        </p>

                        <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-500">
                          {action.desc}
                        </p>
                      </div>

                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Shopping Flow */}
            <section className="flex min-h-[156px] flex-1 flex-col rounded-[18px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <h2 className="shrink-0 text-[15px] font-bold tracking-tight text-slate-900">
                Alur Belanja
              </h2>

              <div className="flex min-h-0 flex-1 items-center overflow-x-auto pb-0.5 pt-2.5">
                <div className="grid min-w-[480px] flex-1 grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-start gap-2">
                  {shoppingSteps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <div key={step.number} className="contents">
                        <div className="flex min-w-0 flex-col items-center text-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${step.iconWrapClass}`}
                          >
                            <Icon
                              className={`h-[18px] w-[18px] ${step.iconClass}`}
                            />
                          </div>

                          <p className="mt-2 text-[11px] font-bold leading-tight text-slate-950">
                            {step.number}. {step.label}
                          </p>

                          <p className="mt-1 max-w-[105px] text-[10.5px] leading-snug text-slate-500">
                            {step.desc}
                          </p>
                        </div>

                        {index < shoppingSteps.length - 1 && (
                          <div className="mt-5 h-px w-9 bg-slate-300 sm:w-10" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <section className="flex min-h-[346px] flex-col rounded-[18px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] xl:min-h-0">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
                Transaksi Terakhir
              </h2>

              {transactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 rounded-lg px-2 text-xs"
                  asChild
                >
                  <Link to="/dashboard/dompet-nutrisi">
                    Semua
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl bg-white px-4 py-6 text-center">
                <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                  <div className="absolute -left-2 top-9 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <div className="absolute -right-1 top-6 h-1.5 w-1.5 rounded-full bg-slate-200" />

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 shadow-sm">
                    <Wallet className="h-6 w-6 text-slate-500" />
                  </div>
                </div>

                <p className="text-base font-extrabold tracking-tight text-slate-950">
                  Belum ada transaksi
                </p>

                <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
                  Mulai belanja untuk melihat riwayat transaksi Anda.
                </p>
              </div>
            ) : (
              <div className="mt-3 min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                {transactions.slice(0, 6).map((t: VoucherTransaction) => {
                  const isCredit = (t.amount || 0) > 0;

                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50/80"
                    >
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                          isCredit ? "bg-green-100" : "bg-slate-100"
                        }`}
                      >
                        <Wallet
                          className={`h-[18px] w-[18px] ${
                            isCredit ? "text-green-600" : "text-slate-500"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {t.description || t.source || "Transaksi"}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-500">
                          {t.date ? formatDate(t.date) : "-"}
                        </div>
                      </div>

                      <div
                        className={`flex-shrink-0 text-sm font-bold ${
                          isCredit ? "text-green-600" : "text-slate-900"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatIDR(Math.abs(t.amount || 0))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}