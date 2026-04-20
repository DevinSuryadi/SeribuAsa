import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  CreditCard,
  Users,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Plus,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import { useStaggerChildren } from "@/hooks/useStaggerChildren";
import { useDonations } from "@/hooks/useDonations";
import { useImpactReport } from "@/hooks/useImpactReport";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { PageSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { KpiCard, KpiCardGrid } from "@/components/dashboard/KpiCard";
import { donationStatusConfig } from "@/lib/status-config";
import type { Donation } from "@/types/donation";

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

  const [{ startDate, endDate }] = useState(() => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return { startDate: start, endDate: end };
  });

  const { data: report, refetch: refetchReport } = useImpactReport(startDate, endDate);

  // Smart polling: refetch orders data every 30s, pause when tab hidden
  useSmartPolling(
    async () => {
      await Promise.all([refetchDonations(), refetchMetrics()]);
    },
    { interval: 30000, enabled: !!user, onVisible: true }
  );

  const totalDonated = useMemo(() => {
    if (report?.summary?.total_donated) return report.summary.total_donated;
    return donations
      .filter((d) => d.status === "success")
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [report, donations]);

  const childrenHelped = useMemo(() => {
    if (report?.summary?.total_children_helped) return report.summary.total_children_helped;
    return donations.filter((d) => d.recipient_id).length;
  }, [report, donations]);

  const redemptionRate = useMemo(() => {
    if (donations.length > 0) {
      return Math.round(
        (donations.filter((d) => d.status === "success").length / donations.length) * 100
      );
    }
    return 0;
  }, [donations]);

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
      <DashboardLayout title="Dashboard Donatur" subtitle="Ringkasan donasi dan dampak Anda.">
        <ErrorState message={donationsError} onRetry={() => { refetchDonations(); refetchReport(); }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard Donatur"
      subtitle="Ringkasan donasi dan dampak Anda bulan ini."
    >
      <div className="space-y-6">
        {/* Quick Actions Bar */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/donasi")}>
            <Heart className="mr-2 h-4 w-4" />
            Lihat Paket
          </Button>
          <Button size="sm" onClick={() => navigate("/donation/checkout")}>
            <Plus className="mr-2 h-4 w-4" />
            Donasi Baru
          </Button>
        </div>

        {/* KPI Cards */}
        <div ref={gridRef}>
          <KpiCardGrid columns={4}>
            <KpiCard
              icon={Heart}
              label="Total Donasi"
              value={formatIDR(totalDonated)}
              subtitle="Bulan ini"
              variant="rose"
            />
            <KpiCard
              icon={CreditCard}
              label="Langganan Aktif"
              value={`${metrics?.active_subscriptions || 0} Paket`}
              subtitle={metrics?.active_subscriptions ? "Adopsi Nutrisi Balita" : "Tidak ada"}
              variant="blue"
            />
            <KpiCard
              icon={Users}
              label="Penerima Didukung"
              value={`${childrenHelped} Anak`}
              subtitle="Menerima bantuan"
              variant="green"
            />
            <KpiCard
              icon={BarChart3}
              label="Tingkat Penukaran"
              value={`${redemptionRate}%`}
              subtitle="Voucher digunakan"
              variant="purple"
            />
          </KpiCardGrid>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Transactions */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Riwayat Donasi Terbaru</CardTitle>
                <CardDescription>Transaksi donasi terakhir Anda</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => navigate("/dashboard/riwayat")}
              >
                Semua <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {donations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada donasi</p>
                  <Button
                    variant="link"
                    onClick={() => navigate("/donation/create")}
                    className="mt-2"
                  >
                    Buat donasi pertama Anda
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.slice(0, 4).map((t: Donation) => {
                    const sc =
                      donationStatusConfig[t.status] || donationStatusConfig.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <div key={t.id} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-50">
                          <Heart className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {t.type === "subscription" ? "Donasi Langganan" : "Donasi Satu Kali"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(t.created_at)}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-semibold text-foreground">
                            {formatIDR(t.amount)}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] border gap-0.5 ${sc.className}`}
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

          {/* Impact Summary */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Dampak Bulan Ini</CardTitle>
                  <CardDescription>Statistik dampak donasi Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {[
                  {
                    label: "Voucher ditukarkan",
                    value: `${(metrics as unknown as { monthly_stats?: { vouchers_redeemed?: number } })?.monthly_stats?.vouchers_redeemed ?? 0} voucher`,
                    icon: CreditCard,
                  },
                  {
                    label: "Anak mendapat nutrisi",
                    value: `${(metrics as unknown as { monthly_stats?: { children_received_nutrition?: number } })?.monthly_stats?.children_received_nutrition ?? 0} anak`,
                    icon: Users,
                  },
                  {
                    label: "Peningkatan skor pangan",
                    value: `+${(metrics as unknown as { monthly_stats?: { nutrition_score_improvement?: number } })?.monthly_stats?.nutrition_score_improvement ?? 0}%`,
                    icon: TrendingUp,
                  },
                  {
                    label: "Kategori terbanyak",
                    value: (metrics as unknown as { monthly_stats?: { top_category?: string } })?.monthly_stats?.top_category ?? "Pangan Umum",
                    icon: BarChart3,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
