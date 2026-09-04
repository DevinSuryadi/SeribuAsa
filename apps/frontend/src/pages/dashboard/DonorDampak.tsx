import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Ticket, ShoppingBasket } from "lucide-react";
import { formatIDR } from "@/lib/format";
import type { ImpactReport } from "@/services/reports";
import { getImpactReport } from "@/services/reports";
import { toast } from "sonner";

const GREEN = "#047857";
const GREEN_DARK = "#065f46";
const TEAL = "#0f766e";
const SOFT_GREEN = "#16a34a";
const LIME = "#65a30d";
const CYAN = "#0891b2";
const GRID = "var(--border)";
const TEXT_COLOR = "var(--muted-foreground)";

const CHART_COLORS = [GREEN, TEAL, SOFT_GREEN, LIME, CYAN];

const MOCK_VOUCHER_CATEGORY_DATA = [
  { label: "Susu & Olahan", value: 48 },
  { label: "Protein Hewani", value: 39 },
  { label: "Sayur & Buah", value: 33 },
  { label: "Karbohidrat", value: 26 },
  { label: "Cemilan Sehat", value: 18 },
];

const MOCK_TOP_PRODUCTS = [
  {
    product_name: "Susu UHT Full Cream 1L",
    quantity_sold: 42,
    category: "Susu & Olahan",
  },
  {
    product_name: "Telur Ayam 1 Kg",
    quantity_sold: 37,
    category: "Protein Hewani",
  },
  {
    product_name: "Beras Fortifikasi 5 Kg",
    quantity_sold: 29,
    category: "Karbohidrat",
  },
  {
    product_name: "Pisang Cavendish 1 Sisir",
    quantity_sold: 24,
    category: "Sayur & Buah",
  },
  {
    product_name: "Biskuit MPASI",
    quantity_sold: 19,
    category: "Cemilan Sehat",
  },
];

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
};

const shortLabel = (value: string, max = 22) => {
  if (!value) return "-";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
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

const VoucherTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-foreground">{item?.label}</p>
      <p className="mt-1 text-muted-foreground">
        Terpakai:{" "}
        <span className="font-semibold text-emerald-700">
          {Number(item?.value || 0)} voucher
        </span>
      </p>
    </div>
  );
};

const ProductTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-foreground">{item?.product_name}</p>
      <p className="mt-1 text-muted-foreground">
        Terjual:{" "}
        <span className="font-semibold text-emerald-700">
          {Number(item?.quantity_sold || 0)} produk
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

const ChartCard = ({
  title,
  description,
  icon,
  badge,
  children,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            {icon}
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {badge}
    </div>

    {children}
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

  const nutritionImprovementRate = useMemo(
    () =>
      Number(
        (
          report?.summary as {
            nutrition_improvement_rate?: number;
          } | null
        )?.nutrition_improvement_rate || 0
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

  const rawVoucherCategoryData = useMemo(() => {
    const raw =
      (report as any)?.voucher_category_usage ||
      (report as any)?.voucher_usage_by_category ||
      (report as any)?.category_usage ||
      [];

    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any) => ({
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
      }))
      .filter((item) => item.label && item.value > 0);
  }, [report]);

  const rawTopProductsData = useMemo(() => {
    const raw = (report as any)?.top_products || [];

    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any) => ({
        product_name: getStringValue(item, [
          "product_name",
          "name",
          "product",
          "label",
        ]),
        product_label: shortLabel(
          getStringValue(item, ["product_name", "name", "product", "label"]),
          24
        ),
        quantity_sold: getNumberValue(item, [
          "quantity_sold",
          "quantity",
          "count",
          "qty",
          "total_sold",
          "sold",
        ]),
        category: getStringValue(
          item,
          ["category", "product_category", "group"],
          "Produk Nutrisi"
        ),
      }))
      .filter((item) => item.product_name && item.quantity_sold > 0);
  }, [report]);

  const voucherCategoryData = useMemo(() => {
    if (rawVoucherCategoryData.length > 0) return rawVoucherCategoryData;
    return MOCK_VOUCHER_CATEGORY_DATA;
  }, [rawVoucherCategoryData]);

  const topProductsData = useMemo(() => {
    const data =
      rawTopProductsData.length > 0
        ? rawTopProductsData
        : MOCK_TOP_PRODUCTS.map((item) => ({
            ...item,
            product_label: shortLabel(item.product_name, 24),
          }));

    return [...data]
      .sort((a, b) => Number(b.quantity_sold || 0) - Number(a.quantity_sold || 0))
      .slice(0, 5);
  }, [rawTopProductsData]);

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
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[360px] animate-pulse rounded-2xl border border-border bg-card shadow-sm"
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
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y lg:grid-cols-[1.45fr_repeat(5,minmax(0,1fr))] lg:divide-y-0">
            <div className="flex h-full min-h-[180px] flex-col px-6 py-6 md:px-8">
              <p className="text-sm font-semibold leading-snug text-muted-foreground">
                Total Dampak Donasi Anda
              </p>

              <p className="mt-5 text-2xl font-bold tracking-tight text-emerald-700 xl:text-3xl">
                {formatIDR(totalDonated)}
              </p>

              <p className="mt-5 max-w-md text-xs leading-relaxed text-muted-foreground xl:text-sm">
                Total donasi yang telah tersalurkan melalui program nutrisi anak.
              </p>
            </div>

            <ImpactMetric
              label="Anak Terbantu"
              value={`${childrenHelped} anak`}
              helper="Mendapat nutrisi"
            />

            <ImpactMetric
              label="Perbaikan Gizi"
              value={`${nutritionImprovementRate}%`}
              helper="Anak membaik statusnya"
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
          <ChartCard title="Tren Donasi Bulanan" description="90 hari terakhir">
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
                      tick={{ fontSize: 12, fill: TEXT_COLOR }}
                      dy={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: TEXT_COLOR }}
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
          </ChartCard>

          <ChartCard title="Distribusi Geografis" description="Sebaran donasi per wilayah">
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
                      tick={{ fontSize: 12, fill: TEXT_COLOR }}
                      tickFormatter={(value) => formatCompactNumber(Number(value))}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={95}
                      tick={{ fontSize: 12, fill: TEXT_COLOR }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" fill={GREEN} radius={[0, 8, 8, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Bottom Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Penggunaan Voucher per Kategori"
            description="Kategori produk yang paling sering ditukarkan menggunakan voucher."
            icon={<Ticket size={19} />}
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={voucherCategoryData}
                  layout="vertical"
                  margin={{ top: 4, right: 34, left: 12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />

                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: TEXT_COLOR }}
                  />

                  <YAxis
                    type="category"
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 12, fill: TEXT_COLOR }}
                  />

                  <Tooltip content={<VoucherTooltip />} />

                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={18}>
                    {voucherCategoryData.map((_, index) => (
                      <Cell
                        key={`voucher-category-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}

                    <LabelList
                      dataKey="value"
                      position="right"
                      className="fill-slate-700 text-xs font-semibold"
                      formatter={(value: any) => `${value}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

<ChartCard
  title="Produk Paling Banyak Dibeli"
  description="Produk spesifik yang paling sering masuk ke transaksi penerima manfaat."
  icon={<ShoppingBasket size={19} />}
>
  <div className="h-[320px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={topProductsData}
        layout="vertical"
        margin={{ top: 4, right: 34, left: 12, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={GRID}
          horizontal={false}
        />

        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: TEXT_COLOR }}
        />

        <YAxis
          type="category"
          dataKey="product_label"
          tickLine={false}
          axisLine={false}
          width={145}
          tick={{ fontSize: 12, fill: TEXT_COLOR }}
        />

        <Tooltip content={<ProductTooltip />} />

        <Bar
          dataKey="quantity_sold"
          radius={[0, 10, 10, 0]}
          barSize={18}
        >
          {topProductsData.map((_, index) => (
            <Cell
              key={`top-product-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}

          <LabelList
            dataKey="quantity_sold"
            position="right"
            className="fill-slate-700 text-xs font-semibold"
            formatter={(value: any) => `${value}`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DonorDampak;