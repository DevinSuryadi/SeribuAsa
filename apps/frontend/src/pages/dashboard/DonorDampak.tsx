import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatIDR } from "@/lib/format";
import type { ImpactReport } from "@/services/reports";
import { getImpactReport } from "@/services/reports";
import { toast } from "sonner";

const GREEN = "#047857";
const GREEN_DARK = "#065f46";
const GRID = "#e5e7eb";

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

const getNumberValue = (item: any, keys: string[], fallback = 0) => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) {
      const value = Number(item[key]);
      return Number.isNaN(value) ? fallback : value;
    }
  }

  return fallback;
};

const getStringValue = (item: any, keys: string[], fallback = "Data") => {
  for (const key of keys) {
    if (item?.[key]) return String(item[key]);
  }

  return fallback;
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-muted-foreground">
        Total:{" "}
        <span className="font-semibold text-emerald-700">
          {formatIDR(Number(payload[0]?.value || 0))}
        </span>
      </p>
    </div>
  );
};

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  </div>
);

const ImpactMetric = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="flex h-full min-h-[180px] flex-col px-6 py-6">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>

    <p className="mt-6 text-xl font-bold tracking-tight text-emerald-700">
      {value}
    </p>

    <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
      {helper}
    </p>
  </div>
);

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
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const data = await getImpactReport(startDate, endDate);
      console.log("Impact report:", data);
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat dampak donasi");
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

  const childrenHelped = useMemo(
    () => Number(report?.summary?.total_children_helped || 0),
    [report]
  );

  const vouchersAllocated = useMemo(
    () => Number(report?.summary?.total_vouchers_allocated || 0),
    [report]
  );

  const vouchersRedeemed = useMemo(
    () =>
      Number(
        (
          report?.summary as {
            total_vouchers_redeemed?: number;
          } | null
        )?.total_vouchers_redeemed || 0
      ),
    [report]
  );

  const trendData = useMemo(() => {
    const raw = report?.donation_trend || [];

    return raw.map((item: any, index: number) => ({
      label: getStringValue(
        item,
        ["month", "period", "date", "label"],
        `Bulan ${index + 1}`
      ),
      value: getNumberValue(item, [
        "total",
        "amount",
        "total_amount",
        "total_donation",
        "donation_total",
        "value",
      ]),
    }));
  }, [report]);

  const geoData = useMemo(() => {
    const raw = report?.geographic_distribution || [];

    return raw.map((item: any) => ({
      label: getStringValue(item, [
        "region",
        "province",
        "city",
        "area",
        "wilayah",
        "label",
      ]),
      value: getNumberValue(item, [
        "total",
        "amount",
        "total_amount",
        "total_donation",
        "donation_total",
        "value",
      ]),
    }));
  }, [report]);

const voucherCategoryData = useMemo(() => {
  const raw =
    (report as any)?.voucher_category_usage ||
    (report as any)?.voucher_usage_by_category ||
    (report as any)?.category_usage ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item: any) => ({
    label: getStringValue(item, [
      "category",
      "name",
      "label",
      "product_category",
    ]),
    value: getNumberValue(item, [
      "total",
      "count",
      "used",
      "redeemed",
      "value",
    ]),
  }));
}, [report]);

  const redemptionRate = useMemo(() => {
    if (vouchersAllocated > 0 && vouchersRedeemed > 0) {
      return Math.round((vouchersRedeemed / vouchersAllocated) * 100);
    }

    return (
      (
        report?.summary as {
          redemption_rate?: number;
        } | null
      )?.redemption_rate ?? 0
    );
  }, [vouchersAllocated, vouchersRedeemed, report]);

  if (loading) {
    return (
      <DashboardLayout
        title="Dampak Donasi Anda"
        subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata."
      >
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="grid grid-cols-1 items-stretch divide-y divide-border lg:grid-cols-[1.5fr_1fr_1.15fr_1fr_1fr] lg:divide-x lg:divide-y-0">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="px-6 py-6">
                  <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                  <div className="mt-4 h-8 w-40 animate-pulse rounded bg-secondary" />
                  <div className="mt-4 h-4 w-36 animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-[380px] animate-pulse rounded-2xl border border-border bg-card shadow-sm"
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h3 className="font-semibold text-red-800">Gagal memuat data</h3>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            Coba Lagi
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dampak Donasi Anda"
      subtitle="Lihat bagaimana donasi Anda membuat perubahan nyata."
    >
      <div className="space-y-6">
        {/* Impact Summary */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-[1.5fr_1fr_1.15fr_1fr_1fr] lg:divide-x lg:divide-y-0">
            <div className="px-6 py-6 md:px-8">
              <p className="text-sm font-semibold text-muted-foreground">
                Total Dampak Donasi Anda
              </p>
              <p className="mt-4 text-4xl font-bold tracking-tight text-emerald-700">
                {formatIDR(totalDonated)}
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Total donasi yang telah tersalurkan melalui program nutrisi anak.
              </p>
            </div>

            <ImpactMetric
              label="Anak Terbantu"
              value={`${childrenHelped} anak`}
              helper="Mendapat nutrisi"
            />

            <ImpactMetric
              label="Voucher Dialokasikan"
              value={`${vouchersAllocated} voucher`}
              helper="Untuk penukaran"
            />

            <ImpactMetric
              label="Wilayah Terjangkau"
              value={`${geoData.length} wilayah`}
              helper="Sebaran donasi"
            />

            <ImpactMetric
              label="Tingkat Penukaran"
              value={`${redemptionRate}%`}
              helper="Dari total voucher"
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Tren Donasi Bulanan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">90 hari terakhir</p>
            </div>

            {trendData.length === 0 ? (
              <EmptyState
                title="Belum ada data tren donasi"
                description="Grafik akan muncul setelah terdapat transaksi donasi dalam periode ini."
              />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="donationTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GREEN} stopOpacity={0.16} />
                        <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      dy={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickFormatter={(value) => formatCompactNumber(Number(value))}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={GREEN}
                      strokeWidth={2.5}
                      fill="url(#donationTrend)"
                      dot={{ r: 4, fill: GREEN_DARK, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: GREEN_DARK }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Distribusi Geografis
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sebaran donasi per wilayah
              </p>
            </div>

            {geoData.length === 0 ? (
              <EmptyState
                title="Belum ada data wilayah"
                description="Distribusi geografis akan muncul setelah donasi tersalurkan ke wilayah penerima."
              />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={geoData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickFormatter={(value) => formatCompactNumber(Number(value))}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={95}
                      tick={{ fontSize: 12, fill: "#334155" }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill={GREEN} radius={[0, 8, 8, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Voucher Category */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Penggunaan Voucher per Kategori
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan kategori produk yang ditukarkan menggunakan voucher.
            </p>
          </div>

          {voucherCategoryData.length === 0 ? (
            <EmptyState
              title="Belum ada data penggunaan voucher"
              description="Data kategori akan muncul setelah penerima menukarkan voucher pada produk yang tersedia."
            />
          ) : (
            <div className="space-y-4">
              {voucherCategoryData.map((item) => {
                const maxValue = Math.max(
                  ...voucherCategoryData.map((data) => data.value),
                  1
                );
                const percentage = Math.round((item.value / maxValue) * 100);

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-emerald-700">
                        {item.value} voucher
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DonorDampak;