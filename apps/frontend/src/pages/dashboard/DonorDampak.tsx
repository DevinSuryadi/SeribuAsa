import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Users,
  Heart,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatIDR } from "@/lib/format";
import type { ImpactReport } from "@/services/reports";
import { getImpactReport } from "@/services/reports";
import { toast } from "sonner";

const CHART_COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#8b5cf6"];

const DonorDampak = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const data = await getImpactReport(startDate, endDate);
      setReport(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Gagal memuat dampak donasi");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchReport();
  }, [user, fetchReport]);

  const totalDonated = useMemo(
    () => parseFloat(report?.summary?.total_donated?.toString() || "0"),
    [report]
  );
  const childrenHelped = useMemo(() => report?.summary?.total_children_helped || 0, [report]);
  const vouchersAllocated = useMemo(() => report?.summary?.total_vouchers_allocated || 0, [report]);
  const vouchersRedeemed = useMemo(() => report?.summary?.total_vouchers_redeemed || 0, [report]);
  const trendData = useMemo(() => report?.donation_trend || [], [report]);
  const geoData = useMemo(() => report?.geographic_distribution || [], [report]);
  // Calculate redemption rate from actual API data, not hardcoded
  const redemptionRate = useMemo(() => {
    if (vouchersAllocated > 0 && vouchersRedeemed > 0) {
      return Math.round((vouchersRedeemed / vouchersAllocated) * 100);
    }
    return report?.summary?.redemption_rate ?? 0;
  }, [vouchersAllocated, vouchersRedeemed, report]);

  const kpiCards = [
    {
      label: "Total Donasi",
      value: formatIDR(totalDonated),
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
    {
      label: "Anak Terbantu",
      value: `${childrenHelped} anak`,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      label: "Voucher Dialokasikan",
      value: `${vouchersAllocated} voucher`,
      icon: CreditCard,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      label: "Tren Donasi",
      value: `${trendData.length} bulan`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
    {
      label: "Wilayah Terjangkau",
      value: `${geoData.length} wilayah`,
      icon: MapPin,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    {
      label: "Tingkat Penukaran",
      value: `${redemptionRate}%`,
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        title="Dampak Donasi Anda"
        subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
                <div className="h-9 w-9 rounded-xl bg-secondary mb-3" />
                <div className="h-7 w-24 bg-secondary rounded mb-2" />
                <div className="h-3 w-16 bg-secondary rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-5 animate-pulse h-72"
              />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Dampak Donasi Anda"
        subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata."
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">Gagal memuat data</h3>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReport}
              className="border-red-300 text-red-700"
            >
              <RefreshCw className="mr-2 h-3 w-3" /> Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tooltipStyle = {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "12px",
  };

  return (
    <DashboardLayout
      title="Dampak Donasi Anda"
      subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata."
    >
      <div className="space-y-5">
        {/* Hero Banner */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 60%, #9f1239 100%)" }}
        >
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-rose-200 font-medium">Dampak Nyata Donasi Anda</p>
              <p className="text-2xl font-extrabold text-white">{formatIDR(totalDonated)}</p>
              <p className="text-xs text-rose-200 mt-0.5">
                Membantu <strong className="text-white">{childrenHelped} anak</strong> mendapat
                nutrisi di <strong className="text-white">{geoData.length} wilayah</strong>
              </p>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`rounded-2xl border p-4 ${card.border} ${card.bg}`}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-white ${card.border} mb-2.5`}
                >
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div className={`text-xl font-extrabold leading-tight ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Monthly Trend */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                <TrendingUp className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Tren Donasi Bulanan</h3>
                <p className="text-xs text-muted-foreground">90 hari terakhir</p>
              </div>
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatIDR(Number(value))}
                    contentStyle={tooltipStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    dot={{ fill: "#e11d48", r: 4 }}
                    name="Donasi"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Belum ada data tren</p>
              </div>
            )}
          </div>

          {/* Geographic Distribution */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Distribusi Geografis</h3>
                <p className="text-xs text-muted-foreground">Sebaran donasi per wilayah</p>
              </div>
            </div>
            {geoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={geoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="region" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="amount" fill="#2563eb" name="Donasi" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <MapPin className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Belum ada data wilayah</p>
              </div>
            )}
          </div>
        </div>

        {/* Voucher Category Pie (only if data exists) */}
        {geoData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Penggunaan Voucher per Kategori
                </h3>
                <p className="text-xs text-muted-foreground">Komposisi penggunaan voucher</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={geoData.slice(0, 4).map((g) => ({ name: g.region, value: g.amount }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={(entry: any) => entry.name}
                >
                  {geoData.slice(0, 4).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatIDR(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DonorDampak;
