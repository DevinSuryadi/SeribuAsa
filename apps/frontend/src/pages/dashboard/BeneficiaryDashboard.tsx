import { useMemo, useEffect } from "react";
import type { ElementType } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useWalletBalance, useWalletTransactions } from "@/hooks/useWallet";
import { useLatestFIESStatus, useLatestNutrition } from "@/hooks/useBeneficiaryData";
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
  ChevronRight,
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import foto from "@/assets/hero-beneficiaryDashboard.svg";
import StuntingRiskCard from "@/components/dashboard/StuntingRiskCard";

interface QuickAction {
  label: string;
  desc: string;
  icon: ElementType;
  href: string;
  iconWrapClass: string;
  iconClass: string;
}

interface StatusCardProps {
  title: string;
  value: string;
  description: string;
  linkLabel: string;
  href: string;
  icon: ElementType;
  iconWrapClass: string;
  iconClass: string;
  valueClass: string;
  linkClass: string;
}

function StatusCard({
  title,
  value,
  description,
  linkLabel,
  href,
  icon: Icon,
  iconWrapClass,
  iconClass,
  valueClass,
  linkClass,
}: StatusCardProps) {
  return (
    <Link
      to={href}
      className="group flex min-h-[78px] items-center gap-2.5 rounded-[15px] border border-slate-200/70 bg-white px-3 py-2.5 shadow-[0_5px_16px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_9px_22px_rgba(15,23,42,0.06)] sm:min-h-[82px] sm:px-3.5 lg:min-h-[86px]"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${iconWrapClass}`}
      >
        <Icon className={`h-[17px] w-[17px] sm:h-[18px] sm:w-[18px] ${iconClass}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold leading-tight text-slate-600 sm:text-[11px]">
          {title}
        </p>

        {value && (
          <p
            className={`mt-0.5 text-[17px] font-extrabold leading-none tracking-tight sm:text-[18px] ${valueClass}`}
          >
            {value}
          </p>
        )}

        <p className="mt-1 text-[10.5px] leading-snug text-slate-600 sm:text-[11px]">
          {description}
        </p>

        <div
          className={`mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-extrabold sm:text-[11px] ${linkClass}`}
        >
          <span>{linkLabel}</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

const getFiesLabel = (classification?: string | null) => {
  if (!classification) return "Belum Ada";

  const normalized = classification.toLowerCase();

  if (normalized === "low" || normalized === "mild" || normalized === "food_secure") {
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
  const gridRef = useStaggerChildren({ stagger: 0.08 });

  const { data: walletBalance, isLoading: walletLoading, error: walletError, mutate: mutateWallet } = useWalletBalance();
  const { data: transactions, isLoading: txLoading, mutate: mutateTx } = useWalletTransactions();
  const { data: fiesStatus, isLoading: fiesLoading, error: fiesError, mutate: mutateFies } = useLatestFIESStatus();
  const { data: nutritionData, isLoading: nutritionLoading, error: nutritionError, mutate: mutateNutrition } = useLatestNutrition();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const totalBalance = walletBalance?.wallet_available ?? 0;

  const hasFiesThisMonth = useMemo(() => {
    if (!fiesStatus?.survey_date) return false;

    const surveyDate = new Date(fiesStatus.survey_date);
    const now = new Date();

    return (
      surveyDate.getFullYear() === now.getFullYear() && surveyDate.getMonth() === now.getMonth()
    );
  }, [fiesStatus]);

  const isLoading = authLoading || walletLoading || fiesLoading || nutritionLoading || txLoading;
  const error = fiesError || nutritionError;

  if (isLoading) {
    return (
      <DashboardLayout title="Beranda" subtitle="Penerima Manfaat">
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || walletError) {
    return (
      <DashboardLayout title="Beranda" subtitle="Penerima Manfaat">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>

          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-red-800">Gagal memuat data</h3>

            <p className="mb-3 text-sm text-red-600">{(error as Error)?.message || (walletError as Error)?.message || "Terjadi kesalahan koneksi"}</p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                mutateWallet();
                mutateTx();
                mutateFies();
                mutateNutrition();
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
      iconWrapClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
    },
    {
      label: "Keranjang Belanja",
      desc: "Lihat & kelola item belanja",
      icon: ShoppingCart,
      href: "/dashboard/cart",
      iconWrapClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
    },
    {
      label: "Riwayat Pesanan",
      desc: "Lihat pesanan sebelumnya",
      icon: Package,
      href: "/dashboard/orders",
      iconWrapClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
    },
    {
      label: "Pemantauan Gizi",
      desc: "Pantau tumbuh kembang anak",
      icon: Activity,
      href: "/dashboard/pemantauan-gizi",
      iconWrapClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
    },
  ];

  const shoppingSteps = [
    {
      number: 1,
      label: "Pilih Produk",
      desc: "Pilih produk bergizi",
      circleClass: "bg-emerald-50 text-emerald-700",
    },
    {
      number: 2,
      label: "Keranjang",
      desc: "Atur item belanja",
      circleClass: "bg-emerald-50 text-emerald-700",
    },
    {
      number: 3,
      label: "Pembayaran",
      desc: "Bayar dengan voucher",
      circleClass: "bg-purple-100 text-purple-700",
    },
    {
      number: 4,
      label: "Selesai",
      desc: "Pesanan terkonfirmasi",
      circleClass: "bg-orange-100 text-orange-600",
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

  const userDisplayName = user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Penerima";

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
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-2.5 pb-2 sm:gap-3 lg:gap-3">
        {/* Hero E-Voucher */}
        <section className="grid min-h-[128px] overflow-hidden rounded-[18px] border border-emerald-100/80 bg-white shadow-[0_7px_22px_rgba(15,23,42,0.045)] sm:min-h-[138px] lg:min-h-[148px] lg:grid-cols-[0.78fr_1.22fr] xl:min-h-[154px]">
          <div className="flex flex-col justify-center gap-2.5 px-3.5 py-3 sm:px-4 lg:border-r lg:border-slate-200/70 xl:px-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-emerald-50 sm:h-12 sm:w-12">
                <Wallet className="h-[22px] w-[22px] text-emerald-700 sm:h-6 sm:w-6" />
              </div>

              <div>
                <p className="text-[12px] font-extrabold leading-tight text-slate-700 sm:text-[13px]">
                  Saldo E-Voucher
                </p>

                <p className="mt-0.5 text-[27px] font-black leading-none tracking-tight text-emerald-700 sm:text-[30px] lg:text-[31px]">
                  {formatIDR(totalBalance)}
                </p>

                <p className="mt-0.5 text-[11.5px] font-semibold text-slate-500 sm:text-xs">
                  Saldo Dompet Nutrisi
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/dompet-nutrisi"
              className="inline-flex h-8 w-fit items-center gap-2 rounded-[11px] border-2 border-emerald-500 bg-white px-3 text-[11px] font-extrabold text-emerald-700 shadow-[0_5px_14px_rgba(16,185,129,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 sm:h-9 sm:px-3.5 sm:text-xs"
            >
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Lihat dompet nutrisi
            </Link>
          </div>

          <div className="relative flex min-h-[128px] items-center overflow-hidden bg-[linear-gradient(115deg,#ffffff_0%,#f8fffb_45%,#eaf8ef_100%)] px-3.5 py-3 sm:min-h-[138px] sm:px-4 lg:min-h-[148px] xl:min-h-[154px] xl:px-5">
            <div className="absolute -bottom-14 -right-10 h-32 w-32 rounded-full bg-emerald-100/70 blur-2xl sm:h-40 sm:w-40" />
            <div className="absolute -top-14 right-20 h-28 w-28 rounded-full bg-lime-100/60 blur-2xl sm:right-36 sm:h-32 sm:w-32" />

            <div className="relative z-10 max-w-[285px] sm:max-w-[330px] lg:max-w-[360px]">
              <h2 className="text-[18px] font-black leading-tight tracking-tight text-emerald-800 sm:text-[20px] lg:text-[17px]">
                Dukung tumbuh kembang anak dengan gizi seimbang.
              </h2>

              <p className="mt-2 max-w-[300px] text-[11.5px] font-medium leading-[17px] text-slate-600 sm:text-xs sm:leading-[18px] lg:text-[13px] lg:leading-5">
                Gunakan voucher untuk membeli bahan makanan bergizi bagi keluarga Anda.
              </p>
            </div>

            <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[46%] items-end justify-end lg:flex xl:w-[49%] 2xl:w-[52%]">
              <img
                src={foto}
                alt="Ilustrasi ibu hamil, anak, dan e-voucher nutrisi"
                className="h-full w-full object-contain object-right-bottom"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="pointer-events-none absolute bottom-3 right-4 hidden rounded-[13px] border border-emerald-100 bg-white/70 px-3 py-2 shadow-[0_8px_20px_rgba(15,118,110,0.1)] backdrop-blur-md sm:block lg:hidden">
              <p className="text-[9.5px] font-bold uppercase tracking-wide text-emerald-600">
                E-Voucher
              </p>
              <p className="text-[15px] font-black leading-tight text-emerald-800">Nutrisi</p>
            </div>
          </div>
        </section>

        {/* Wallet Expiry Warning */}
        {walletBalance && walletBalance.expiring_soon > 0 && (
          <Link
            to="/dashboard/dompet-nutrisi"
            className="group flex items-center gap-2.5 rounded-[15px] border border-orange-200 bg-orange-50 px-3.5 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-[17px] w-[17px] text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-bold text-orange-800 sm:text-xs">
                Saldo Akan Kedaluwarsa
              </p>
              <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-orange-600 sm:text-[11px]">
                {formatIDR(walletBalance.expiring_soon)} akan expired
                {walletBalance.earliest_expiry
                  ? ` pada ${formatDate(walletBalance.earliest_expiry)}`
                  : " dalam 7 hari"}
                . Gunakan sebelum hangus!
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-orange-400 transition-transform group-hover:translate-x-1" />
          </Link>
        )}

        {/* Status Cards */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:gap-3 xl:grid-cols-3"
        >
          <StatusCard
            title="Status Survei FIES"
            value={fiesValue}
            description={
              fiesStatus?.survey_date ? formatDate(fiesStatus.survey_date) : "Isi survei bulanan"
            }
            linkLabel="Lihat survei"
            href="/dashboard/survei-fies"
            icon={ClipboardList}
            iconWrapClass="bg-blue-50"
            iconClass="text-blue-600"
            valueClass="text-blue-600"
            linkClass="text-blue-600"
          />

          <StatusCard
            title="Status Gizi Anak"
            value={nutritionValue}
            description={`Z-score: ${nutritionZScore}`}
            linkLabel="Lihat detail"
            href="/dashboard/pemantauan-gizi"
            icon={TrendingUp}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
            valueClass="text-emerald-600"
            linkClass="text-emerald-600"
          />

          <StatusCard
            title={
              hasFiesThisMonth
                ? "Survei FIES Bulan Ini Sudah Diisi"
                : "Survei FIES Bulan Ini Belum Diisi"
            }
            value={hasFiesThisMonth ? "Aman" : ""}
            description={
              hasFiesThisMonth
                ? "Kelayakan voucher Anda tetap terjaga."
                : "Isi survei agar kelayakan voucher Anda tetap terjaga."
            }
            linkLabel={hasFiesThisMonth ? "Lihat hasil" : "Isi Sekarang"}
            href="/dashboard/survei-fies"
            icon={hasFiesThisMonth ? ClipboardList : AlertTriangle}
            iconWrapClass={hasFiesThisMonth ? "bg-emerald-50" : "bg-orange-50"}
            iconClass={hasFiesThisMonth ? "text-emerald-600" : "text-orange-500"}
            valueClass={hasFiesThisMonth ? "text-emerald-600" : "hidden"}
            linkClass={hasFiesThisMonth ? "text-emerald-600" : "text-orange-500"}
          />
        </div>

        <StuntingRiskCard />

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-2.5 lg:gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Aksi Utama */}
          <section className="rounded-[18px] border border-slate-200/70 bg-white p-3 shadow-[0_7px_20px_rgba(15,23,42,0.04)] sm:p-3.5">
            <h2 className="mb-2 text-[14px] font-black tracking-tight text-emerald-800 sm:text-[15px]">
              Aksi Utama
            </h2>

            <div className="overflow-hidden rounded-[14px] border border-slate-200/80 bg-white">
              {quickActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={`group flex min-h-[44px] items-center gap-2.5 px-2.5 py-2 transition-all duration-200 hover:bg-emerald-50/60 sm:min-h-[49px] sm:px-3 ${
                      index !== quickActions.length - 1 ? "border-b border-slate-200/80" : ""
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 ${action.iconWrapClass}`}
                    >
                      <Icon
                        className={`h-[15px] w-[15px] sm:h-[17px] sm:w-[17px] ${action.iconClass}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-extrabold text-emerald-800 sm:text-[12.5px]">
                        {action.label}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] font-medium leading-snug text-slate-500 sm:text-[10.5px]">
                        {action.desc}
                      </p>
                    </div>

                    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-all duration-200 group-hover:bg-white group-hover:text-emerald-600 group-hover:shadow-sm sm:h-7 sm:w-7">
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Transaksi Terakhir */}
          <section className="flex min-h-[196px] flex-col rounded-[18px] border border-slate-200/70 bg-white p-3 shadow-[0_7px_20px_rgba(15,23,42,0.04)] sm:min-h-[220px] sm:p-3.5 xl:min-h-[224px]">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="text-[14px] font-black tracking-tight text-emerald-800 sm:text-[15px]">
                Transaksi Terakhir
              </h2>

              {transactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 rounded-lg px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
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
              <div className="flex min-h-[142px] flex-1 flex-col items-center justify-center px-3 py-4 text-center sm:min-h-[162px]">
                <div className="relative mb-3 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-emerald-50 sm:h-[66px] sm:w-[66px]">
                  <div className="absolute -left-2.5 top-7 h-2 w-2 rounded-full bg-emerald-200" />
                  <div className="absolute -right-2 top-4 h-2 w-2 rounded-full bg-emerald-200" />

                  <Wallet className="h-7 w-7 text-emerald-600 sm:h-8 sm:w-8" />
                </div>

                <p className="text-[14px] font-black tracking-tight text-emerald-800 sm:text-[15px]">
                  Belum ada transaksi
                </p>

                <p className="mt-1 max-w-sm text-[10.5px] font-medium leading-4 text-slate-500 sm:text-[11.5px]">
                  Mulai belanja untuk melihat riwayat transaksi Anda.
                </p>
              </div>
            ) : (
              <div className="mt-2 min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                {transactions.slice(0, 4).map((t: any) => {
                  const isCredit = (t.amount || 0) > 0;

                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2.5 py-2 transition-colors hover:bg-slate-50/80"
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 ${
                          isCredit ? "bg-emerald-50" : "bg-slate-100"
                        }`}
                      >
                        <Wallet
                          className={`h-[15px] w-[15px] sm:h-[17px] sm:w-[17px] ${
                            isCredit ? "text-emerald-600" : "text-slate-500"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11.5px] font-bold text-slate-900 sm:text-[12.5px]">
                          {t.description || t.source || "Transaksi"}
                        </div>

                        <div className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-[10.5px]">
                          {t.date ? formatDate(t.date) : "-"}
                        </div>
                      </div>

                      <div
                        className={`flex-shrink-0 text-[11.5px] font-extrabold sm:text-[12.5px] ${
                          isCredit ? "text-emerald-600" : "text-slate-900"
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

        {/* Alur Belanja */}
        <section className="rounded-[18px] border border-slate-200/70 bg-white px-3 py-3 shadow-[0_7px_20px_rgba(15,23,42,0.04)] sm:px-3.5 sm:py-3.5">
          <h2 className="mb-2.5 text-[14px] font-black tracking-tight text-emerald-800 sm:text-[15px]">
            Alur Belanja
          </h2>

          {/* Mobile / Tablet */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:hidden">
            {shoppingSteps.map((step) => (
              <div
                key={step.number}
                className="flex items-center gap-2 rounded-[13px] border border-slate-100 bg-slate-50/40 p-2"
              >
                <div
                  className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-black sm:h-8 sm:w-8 sm:text-[15px] ${step.circleClass}`}
                >
                  {step.number}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-black leading-tight text-slate-800 sm:text-xs">
                    {step.label}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] font-medium leading-snug text-slate-500 sm:text-[10.5px]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden xl:flex xl:items-center xl:justify-between xl:gap-4">
            {shoppingSteps.map((step, index) => (
              <div key={step.number} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-black ${step.circleClass}`}
                  >
                    {step.number}
                  </div>

                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-[12px] font-black leading-tight text-slate-800">
                      {step.label}
                    </p>

                    <p className="mt-0.5 whitespace-nowrap text-[10.5px] font-medium leading-snug text-slate-500">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {index < shoppingSteps.length - 1 && (
                  <div className="flex flex-1 items-center">
                    <div className="h-[2px] w-full rounded-full bg-slate-200" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
