import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  CreditCard,
  Users,
  BarChart3,
  ArrowRight,
  Plus,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import { useDonations } from "@/hooks/useDonations";
import { useImpactDashboard } from "@/services/impact-dashboard";
import ImpactDashboard from "@/components/dashboard/ImpactDashboard";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { PageSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { donationStatusConfig } from "@/lib/status-config";
import type { Donation } from "@/types/donation";
import foto from "@/assets/header-donor.svg";

export default function DonorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const gridRef = useStaggerChildren({ stagger: 0.1 });

  const {
    data: { donations, metrics },
    loading: donationsLoading,
    error: donationsError,
    refetch: refetchDonations,
    refetchMetrics,
  } = useDonations();

  const { data: impact, mutate: refetchReport } = useImpactDashboard();

  useSmartPolling(
    async () => {
      await Promise.all([refetchDonations(), refetchMetrics()]);
    },
    { interval: 30000, enabled: !!user, onVisible: true }
  );

  const totalDonated = useMemo(() => donations.filter(d => d.status === "success").reduce((sum, d) => sum + (d.amount || 0), 0), [donations]);
  const familiesHelped = impact?.summary.families;
  const received = Number(impact?.summary.pooled_received || 0);
  const distributionRate = impact ? (received > 0 ? Math.round(Number(impact.summary.distributed) / received * 100) : 0) : undefined;

  const isLoading = authLoading || donationsLoading;

  if (isLoading) {
    return (
      <DashboardLayout
        title="Dashboard Donatur"
        subtitle="Memuat data donasi Anda..."
      >
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (donationsError) {
    return (
      <DashboardLayout
        title="Dashboard Donatur"
        subtitle="Ringkasan donasi dan dampak Anda."
      >
        <ErrorState
          message={donationsError}
          onRetry={() => {
            refetchDonations();
            refetchReport();
          }}
        />
      </DashboardLayout>
    );
  }

  const summaryCards = [
    {
      label: "Total Donasi",
      value: formatIDR(totalDonated),
      subtitle: "Akumulasi donasi berhasil",
      helper: "Seluruh periode",
      icon: Heart,
      iconWrapClass: "bg-rose-50 text-rose-500",
      valueClass: "text-rose-600",
      borderClass: "border-rose-100",
    },
    {
      label: "Paket Aktif",
      value: `${metrics?.active_subscriptions || 0} Paket`,
      subtitle: metrics?.active_subscriptions
        ? "Langganan sedang berjalan"
        : "Belum ada langganan aktif",
      helper: "Langganan",
      icon: CreditCard,
      iconWrapClass: "bg-blue-50 text-blue-500",
      valueClass: "text-blue-600",
      borderClass: "border-blue-100",
    },
    {
      label: "Keluarga Terjangkau",
      value: familiesHelped === undefined ? "?" : `${familiesHelped} Keluarga`,
      subtitle: "Keluarga dengan penyerahan tercatat",
      helper: "Penerima",
      icon: Users,
      iconWrapClass: "bg-emerald-50 text-emerald-500",
      valueClass: "text-emerald-600",
      borderClass: "border-emerald-100",
    },
    {
      label: "Dana Diserahkan",
      value: distributionRate === undefined ? "?" : `${distributionRate}%`,
      subtitle: "Porsi dana bersama diserahkan ke keluarga",
      helper: "Penggunaan",
      icon: BarChart3,
      iconWrapClass: "bg-violet-50 text-violet-500",
      valueClass: "text-violet-600",
      borderClass: "border-violet-100",
    },
  ] as const;


  return (
    <DashboardLayout
      title="Dashboard Donatur"
      subtitle="Ringkasan donasi dan dampak Anda."
    >
      <div className="space-y-3">
        {/* Header Actions */}
        <div className="-mt-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            className="h-9 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            onClick={() => navigate("/donasi")}
          >
            <Heart className="mr-2 h-3.5 w-3.5" />
            Lihat Paket
          </Button>

          <Button
            className="h-9 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
            onClick={() => navigate("/donation/checkout")}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Donasi Baru
          </Button>
        </div>

        {/* Thank You Banner */}
        <div className="relative overflow-hidden rounded-[18px] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-white px-5 py-4 shadow-sm sm:px-6 sm:py-5 lg:px-8">
          <div className="pointer-events-none absolute -right-10 -bottom-20 h-48 w-48 rounded-full bg-emerald-100/55 blur-3xl" />

          <div className="relative flex min-h-[80px] flex-col gap-4 md:min-h-[90px] md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-[80px] w-[120px] shrink-0 items-end justify-center overflow-hidden md:h-[90px] md:w-[140px]">
                <img
                  src={foto}
                  alt="Ilustrasi donatur mendukung nutrisi keluarga"
                  className="h-full w-full object-contain object-bottom"
                />
              </div>

              <div className="max-w-xl">
                <p className="text-lg font-extrabold leading-tight text-emerald-900 sm:text-xl">
                  Terima kasih!
                </p>

                <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-700 sm:text-[15px]">
                  Pantau perjalanan donasi Anda hingga bantuan diserahkan ke keluarga.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div
          ref={gridRef}
          className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card
                key={card.label}
                className={`rounded-[18px] border bg-white shadow-sm ${card.borderClass}`}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.iconWrapClass}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>

                    <div className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {card.helper}
                    </div>
                  </div>

                  <div className="mt-3 space-y-0.5">
                    <p className="text-xs font-medium text-slate-500">
                      {card.label}
                    </p>

                    <p
                      className={`text-xl font-bold leading-none tracking-tight ${card.valueClass}`}
                    >
                      {card.value}
                    </p>

                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {card.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Recent Transactions */}
          <Card className="rounded-[18px] border bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2.5">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Riwayat Donasi Terbaru
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-slate-500">
                  Transaksi donasi terakhir Anda
                </CardDescription>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl px-2.5 text-xs font-medium text-slate-700"
                onClick={() => navigate("/dashboard/riwayat")}
              >
                Semua
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="pt-0">
              {donations.length === 0 ? (
                <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Heart className="h-3.5 w-3.5 text-emerald-600" />
                  </div>

                  <h3 className="mt-2.5 text-sm font-semibold text-slate-900">
                    Belum ada donasi
                  </h3>

                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                    Mulai donasi pertama Anda untuk membantu lebih banyak
                    penerima manfaat.
                  </p>

                  <Button
                    variant="link"
                    onClick={() => navigate("/donation/create")}
                    className="mt-2 h-auto p-0 text-xs font-semibold text-emerald-600"
                  >
                    Buat donasi pertama Anda
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {donations.slice(0, 4).map((t: Donation) => {
                    const sc =
                      donationStatusConfig[t.status] ||
                      donationStatusConfig.pending;
                    const StatusIcon = sc.icon;

                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50">
                          <Heart className="h-3 w-3 text-rose-500" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-slate-900 sm:text-sm">
                            {t.type === "subscription"
                              ? "Donasi Langganan"
                              : "Donasi Satu Kali"}
                          </div>

                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {formatDate(t.created_at)}
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs font-semibold text-slate-900 sm:text-sm">
                            {formatIDR(t.amount)}
                          </div>

                          <Badge
                            variant="outline"
                            className={`mt-1 gap-1 border text-[10px] ${sc.className}`}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {sc.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <ImpactDashboard compact />
        </div>
      </div>
    </DashboardLayout>
  );
}
