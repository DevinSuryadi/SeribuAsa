import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { formatDate, formatIDR } from "@/lib/format";
import { getMyFacility, listFamilies, type Facility, type Family } from "@/services/facility-families";
import { listFacilityOrders, type FacilityOrder } from "@/services/facility-orders";
import heroImage from "@/assets/hero-beneficiaryDashboard.svg";

const WORK_LIMIT = 6;
const FAMILIES_PATH = "/dashboard/health-facility/families";
const ORDERS_PATH = "/dashboard/health-facility/orders";
const HISTORY_PATH = "/dashboard/health-facility/redemptions";

const shadowClass = "shadow-[0_1px_2px_rgba(16,32,26,0.05),0_12px_28px_-16px_rgba(16,32,26,0.28)]";
const cardClass = `rounded-2xl bg-white ${shadowClass}`;
const tileClass = `block rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none ${shadowClass}`;
const headingClass = "text-lg font-bold tracking-tight text-slate-900";
const linkClass = "shrink-0 text-sm font-semibold text-[#0B6B4F] hover:underline";
const tileLabelClass = "block text-sm font-semibold";
const tileValueClass = "mt-2 block break-words text-[32px] font-bold leading-none tracking-tight tabular-nums";
const statValueClass = "mt-1 text-2xl font-bold leading-none tracking-tight text-slate-900 tabular-nums";
const noteClass = "text-[13px] text-slate-500";
const rowButtonClass = "h-8 shrink-0 rounded-full bg-[#0B6B4F] px-3 text-[13px] font-bold hover:bg-[#095A43]";

// Colors pass the palette check; the gray slot means "no data yet" and stays neutral.
const riskSegments = [
  { key: "severe", label: "Rawan tinggi", color: "#C81E1E" },
  { key: "moderate", label: "Rawan sedang", color: "#C47F00" },
  { key: "food_secure", label: "Rawan rendah", color: "#0E8A63" },
  { key: "unassessed", label: "Belum disurvei", color: "#C5CCC9" },
] as const;

type RiskKey = (typeof riskSegments)[number]["key"];

type WorkRow = {
  key: string;
  title: string;
  note: string;
  dot?: string;
  count?: number;
  to: string;
  action: string;
};

function riskOf(family: Family): RiskKey {
  const classification = family.latest_fies?.classification;
  return classification === "severe" || classification === "moderate" || classification === "food_secure"
    ? classification
    : "unassessed";
}

function isThisMonth(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function isClosed(order: FacilityOrder) {
  return order.status === "cancelled" || order.status === "rejected";
}

function isAwaitingProof(order: FacilityOrder) {
  return !order.distribution && (order.status === "received" || order.status === "completed");
}

function Dot({ color }: { color: string }) {
  return <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

export default function HealthFacilityDashboard() {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyFacility()
      .then(async (facilityData) => {
        const isApproved = facilityData.approval_status === "approved";
        const [familyData, orderData] = isApproved
          ? await Promise.all([listFamilies(), listFacilityOrders()])
          : [[], []];
        if (active) { setFacility(facilityData); setFamilies(familyData); setOrders(orderData); }
      })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Gagal memuat data fasilitas"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const approved = facility?.approval_status === "approved";
  useSmartPolling(async () => { setOrders(await listFacilityOrders()); }, { interval: 30000, enabled: approved });

  const pipeline = useMemo(() => ({
    waiting: orders.filter((order) => order.status === "pending" || order.status === "pending_approval").length,
    shipped: orders.filter((order) => order.status === "processing" || order.status === "shipped").length,
    atFacility: orders.filter(isAwaitingProof).length,
    delivered: orders.filter((order) => Boolean(order.distribution)).length,
  }), [orders]);

  const unsurveyed = useMemo(
    () => families.filter((family) => !isThisMonth(family.latest_fies?.survey_date)).length,
    [families]
  );

  const riskCounts = useMemo(() => {
    const result: Record<RiskKey, number> = { severe: 0, moderate: 0, food_secure: 0, unassessed: 0 };
    families.forEach((family) => { result[riskOf(family)] += 1; });
    return result;
  }, [families]);

  const monthly = useMemo(() => {
    const delivered = orders.filter((order) => isThisMonth(order.distribution?.distributed_at));
    return {
      families: new Set(delivered.map((order) => order.family_id)).size,
      amount: delivered.reduce((sum, order) => sum + Number(order.total_amount), 0),
    };
  }, [orders]);

  const stuckShipments = orders.filter((order) => order.status === "shipped").length;
  const actionItems = [
    {
      key: "confirm",
      short: "konfirmasi barang",
      title: "Barang tiba perlu dikonfirmasi",
      note: "Periksa barang yang sudah dikirim vendor",
      count: orders.filter((order) => order.status === "processing" && order.receipt_status !== "discrepancy").length,
      to: ORDERS_PATH,
    },
    {
      key: "issue",
      short: "barang bermasalah",
      title: "Barang bermasalah",
      note: "Periksa ulang setelah vendor melengkapi",
      count: orders.filter((order) => order.status === "processing" && order.receipt_status === "discrepancy").length,
      to: ORDERS_PATH,
    },
    {
      key: "proof",
      short: "unggah bukti",
      title: "Bukti penyerahan belum diunggah",
      note: "Barang sudah di faskes, belum tercatat ke keluarga",
      count: pipeline.atFacility,
      to: ORDERS_PATH,
    },
    {
      key: "stuck",
      short: "cek pengiriman",
      title: "Pengiriman perlu dicek Admin",
      note: "Statusnya belum bisa dikonfirmasi dari sini",
      count: stuckShipments,
      to: ORDERS_PATH,
    },
    {
      key: "survey",
      short: "survei",
      title: "Keluarga belum disurvei bulan ini",
      note: "Lengkapi survei FIES bulan ini",
      count: unsurveyed,
      to: FAMILIES_PATH,
    },
  ].filter((item) => item.count > 0);
  const attentionTotal = actionItems.reduce((sum, item) => sum + item.count, 0);
  const attentionNote = actionItems.map((item) => `${item.count} ${item.short}`).join(" · ") || "Tidak ada yang perlu ditangani";

  const priorityFamilies = useMemo(() => {
    const assisted = new Set(orders.filter((order) => !isClosed(order) && !order.distribution).map((order) => order.family_id));
    return families
      .filter((family) => ["severe", "moderate"].includes(riskOf(family)) && !assisted.has(family.id))
      .sort((a, b) => (b.latest_fies?.score ?? 0) - (a.latest_fies?.score ?? 0));
  }, [families, orders]);

  const workRows: WorkRow[] = [
    ...actionItems.map(({ key, title, note, count, to }) => ({ key, title, note, count, to, action: "Buka" })),
    ...priorityFamilies.map((family) => {
      const segment = riskSegments.find((item) => item.key === riskOf(family));
      return {
        key: family.id,
        title: family.head_name,
        note: `${segment?.label} · FIES ${family.latest_fies?.score}/8 · ${formatDate(family.latest_fies?.survey_date || "")}`,
        dot: segment?.color,
        to: `${FAMILIES_PATH}/${family.id}/catalog`,
        action: "Pesan pangan",
      };
    }),
  ].slice(0, WORK_LIMIT);

  const surveyed = families.length - unsurveyed;
  const surveyCoverage = families.length ? Math.round((surveyed / families.length) * 100) : 0;
  const pipelineSteps = [
    { label: "Menunggu vendor", value: pipeline.waiting, note: "Belum diproses" },
    { label: "Dikirim", value: pipeline.shipped, note: stuckShipments ? `${stuckShipments} perlu dicek` : "Dalam perjalanan" },
    { label: "Tiba di faskes", value: pipeline.atFacility, note: "Belum ke keluarga" },
    { label: "Disalurkan", value: pipeline.delivered, note: "Sudah ke keluarga" },
  ];

  return (
    <DashboardLayout title="Dashboard Fasilitas Kesehatan" subtitle="Prioritas bantuan dan kondisi keluarga binaan Anda.">
      <section className="grid grid-cols-1 items-center gap-4 rounded-2xl bg-[#E6F4EC] px-6 py-3 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,0.95fr)_minmax(230px,0.75fr)_180px]">
        <div className="min-w-0">
          <p className="break-words text-[32px] font-bold leading-none tracking-tight text-[#0B6B4F]">
            {facility?.name || "Kelola penerima manfaat"}
          </p>
        </div>
        <div className="pointer-events-none hidden h-full items-end justify-center lg:flex">
          <img
            src={heroImage}
            alt="Ilustrasi keluarga penerima bantuan"
            className="h-[88px] w-full object-contain object-center"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
        {approved && (
          <Button asChild className="w-full rounded-full bg-[#0B6B4F] px-7 font-bold text-white hover:bg-[#095A43] md:w-auto lg:w-full">
            <Link to="/dashboard/health-facility/catalog">Pesan pangan</Link>
          </Button>
        )}
      </section>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {facility && !approved && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {facility.approval_status === "rejected"
            ? `Pendaftaran Faskes ditolak: ${facility.review_reason || "Hubungi Admin untuk penjelasan."}`
            : "Pendaftaran Faskes menunggu persetujuan Admin. Pengelolaan keluarga dan pemesanan tersedia setelah disetujui."}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}
        </div>
      ) : approved && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              to={ORDERS_PATH}
              aria-label={`${attentionTotal} hal perlu ditindak`}
              className={`${tileClass} ${attentionTotal > 0 ? "bg-[#FFC53D] text-[#1A1A1A]" : "bg-white text-slate-900"}`}
            >
              <span className={tileLabelClass}>Perlu ditindak</span>
              <span className={tileValueClass}>{attentionTotal}</span>
              <span className={`mt-2 block truncate text-[13px] ${attentionTotal > 0 ? "text-[#1A1A1A]/75" : "text-slate-500"}`}>{attentionNote}</span>
            </Link>
            <Link to={FAMILIES_PATH} className={`${tileClass} bg-white text-slate-900`}>
              <span className={tileLabelClass}>Keluarga rawan tinggi</span>
              <span className={tileValueClass}>{riskCounts.severe}</span>
              <span className={`mt-2 block ${noteClass}`}>dari {families.length} keluarga binaan</span>
            </Link>
            <Link to={HISTORY_PATH} className={`${tileClass} bg-white text-slate-900`}>
              <span className={tileLabelClass}>Tersalurkan bulan ini</span>
              <span className={tileValueClass}>{formatIDR(monthly.amount)}</span>
              <span className={`mt-2 block ${noteClass}`}>{monthly.families} keluarga terbantu</span>
            </Link>
          </section>

          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
              <h2 className={headingClass}>Daftar kerja</h2>
              <Link to={FAMILIES_PATH} className={linkClass}>Lihat keluarga</Link>
            </div>

            {workRows.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-slate-500">
                {families.length === 0
                  ? "Belum ada keluarga terdaftar. Buka menu Keluarga untuk mendaftarkan keluarga pertama."
                  : "Tidak ada yang perlu dikerjakan saat ini."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {workRows.map((row) => (
                  <li key={row.key} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{row.title}</p>
                      <p className={`flex items-center gap-1.5 ${noteClass}`}>
                        {row.dot && <Dot color={row.dot} />}
                        <span className="truncate">{row.note}</span>
                      </p>
                    </div>
                    {row.count !== undefined && (
                      <span className="shrink-0 text-[15px] font-bold text-slate-900 tabular-nums">{row.count}</span>
                    )}
                    <Button asChild size="sm" className={rowButtonClass}>
                      <Link to={row.to}>{row.action}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={headingClass}>Perjalanan bantuan</h2>
                <Link to={ORDERS_PATH} className={linkClass}>Lihat pesanan</Link>
              </div>
              <ol className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
                {pipelineSteps.map((step) => (
                  <li key={step.label} className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                    <p className={statValueClass}>{step.value}</p>
                    <p className={`mt-1 truncate ${noteClass}`}>{step.note}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={`${cardClass} p-5`}>
              <h2 className={headingClass}>Kondisi keluarga binaan</h2>
              {families.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Belum ada keluarga terdaftar.</p>
              ) : (
                <>
                  <div className="mt-4 flex gap-0.5" role="img" aria-label={riskSegments.map((segment) => `${segment.label} ${riskCounts[segment.key]}`).join(", ")}>
                    {riskSegments.filter((segment) => riskCounts[segment.key] > 0).map((segment) => (
                      <div key={segment.key} className="group relative -my-2 min-w-2 py-2" style={{ flexGrow: riskCounts[segment.key], flexBasis: 0 }}>
                        <div className="h-3 rounded" style={{ backgroundColor: segment.color }} />
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
                          {segment.label}: {riskCounts[segment.key]} keluarga ({Math.round((riskCounts[segment.key] / families.length) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {riskSegments.map((segment) => (
                      <div key={segment.key} className="flex items-center gap-2">
                        <Dot color={segment.color} />
                        <dt className="min-w-0 flex-1 truncate text-slate-600">{segment.label}</dt>
                        <dd className="font-bold text-slate-900 tabular-nums">{riskCounts[segment.key]}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-slate-600">Disurvei bulan ini</span>
                      <span className="font-bold text-slate-900 tabular-nums">{surveyed} dari {families.length}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded bg-[#E6F4EC]">
                      <div className="h-full rounded bg-[#0E8A63]" style={{ width: `${surveyCoverage}%` }} />
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
