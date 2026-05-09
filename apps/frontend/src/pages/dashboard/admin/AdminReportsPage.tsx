import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Download, Loader2, RefreshCw,
  Package, ShoppingCart, TrendingUp, Users, Wallet,
  BarChart3, Map, Activity, Heart,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import {
  getRegionalReport, getDemographicsReport,
  type RegionalReport, type DemographicsReport,
} from "@/services/reports";
import { downloadTextFile } from "./adminUtils";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminStats = {
  users:       { total: number; donors: number; beneficiaries: number; vendors: number; pending_beneficiaries: number; pending_vendors: number };
  products:    { total: number; pending: number; approved: number; rejected: number };
  vouchers:    { active_count: number; total_balance: number };
  orders:      { total: number; completed: number; pending: number };
  redemptions: { total_count: number; total_amount: number };
  donations:   { total_amount: number; success_count: number; pending_count: number; failed_count: number; refunded_count: number; unallocated_success_count: number };
};

const EXPORTS = [
  { label: "Users",       endpoint: "/admin/export/users",       filename: "users.csv",       icon: Users,       color: "text-slate-600",   bg: "bg-slate-100",   ring: "ring-slate-200" },
  { label: "Orders",      endpoint: "/admin/export/orders",      filename: "orders.csv",      icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-100",    ring: "ring-blue-200" },
  { label: "E-Wallet",    endpoint: "/admin/export/vouchers",    filename: "ewallet.csv",     icon: Wallet,      color: "text-emerald-600", bg: "bg-emerald-100", ring: "ring-emerald-200" },
  { label: "Redemptions", endpoint: "/admin/export/redemptions", filename: "redemptions.csv", icon: BarChart3,   color: "text-purple-600",  bg: "bg-purple-100",  ring: "ring-purple-200" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(v?: string | Date | null) {
  if (!v) return "–";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return "–";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d);
}

function ProgressBar({ value, max, color = "bg-indigo-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, color }: { icon: React.ElementType; title: string; subtitle?: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color ?? "bg-slate-100"} border border-black/5`}>
        <Icon className="h-4 w-4 text-slate-700" />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground leading-none">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [stats, setStats]                   = useState<AdminStats | null>(null);
  const [regional, setRegional]             = useState<RegionalReport | null>(null);
  const [demographics, setDemographics]     = useState<DemographicsReport | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [exporting, setExporting]           = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [sr, rr, dr] = await Promise.allSettled([
        apiFetch("/admin/stats") as Promise<AdminStats>,
        getRegionalReport(),
        getDemographicsReport(),
      ]);
      if (sr.status === "fulfilled") setStats(sr.value);
      else setError(sr.reason?.message ?? "Gagal memuat ringkasan");
      if (rr.status === "fulfilled") setRegional(rr.value);
      if (dr.status === "fulfilled") setDemographics(dr.value);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleExport = async (endpoint: string, filename: string) => {
    try {
      setExporting(filename);
      const payload = (await apiFetch(endpoint, { headers: { Accept: "text/csv" } })) as string | { detail?: string };
      const csv = typeof payload === "string" ? payload : (payload.detail ?? "");
      downloadTextFile(filename, csv, "text/csv");
      toast.success(`Berhasil export ${filename}`);
    } catch (err: any) {
      toast.error(err?.message ?? `Gagal export ${filename}`);
    } finally { setExporting(null); }
  };

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Total Pengguna",    val: stats.users.total,                      sub: `${stats.users.donors}D · ${stats.users.beneficiaries}P · ${stats.users.vendors}V`,    icon: Users,        color: "text-slate-700",   bg: "bg-slate-50",   ring: "ring-slate-100" },
      { label: "Total Donasi",      val: formatIDR(stats.donations.total_amount), sub: `${stats.donations.success_count} berhasil`,                                         icon: Heart,        color: "text-rose-700",    bg: "bg-rose-50",    ring: "ring-rose-100" },
      { label: "Saldo E-Wallet",    val: formatIDR(stats.vouchers.total_balance), sub: `${stats.vouchers.active_count} dompet aktif`,                                       icon: Wallet,       color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-100" },
      { label: "Pesanan Selesai",   val: stats.orders.completed,                  sub: `dari ${stats.orders.total} total pesanan`,                                           icon: ShoppingCart, color: "text-blue-700",    bg: "bg-blue-50",    ring: "ring-blue-100" },
      { label: "Produk Aktif",      val: stats.products.total,                    sub: `${stats.products.pending} pending review`,                                           icon: Package,      color: "text-indigo-700",  bg: "bg-indigo-50",  ring: "ring-indigo-100" },
      { label: "Total Redemption",  val: formatIDR(stats.redemptions.total_amount), sub: `${stats.redemptions.total_count} transaksi`,                                      icon: TrendingUp,   color: "text-orange-700",  bg: "bg-orange-50",  ring: "ring-orange-100" },
    ];
  }, [stats]);

  const completionRate = stats?.orders.total
    ? Math.round((stats.orders.completed / stats.orders.total) * 100)
    : 0;
  const allocationRate = stats?.donations.success_count
    ? Math.round(((stats.donations.success_count - (stats.donations.unallocated_success_count ?? 0)) / stats.donations.success_count) * 100)
    : 0;

  return (
    <DashboardLayout title="Laporan & Analitik" subtitle="Ringkasan sistem, laporan regional, demografi, dan ekspor CSV.">
      <div className="space-y-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {loading ? "Memuat data…" : "Data diambil langsung dari backend."}
          </p>
          <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5 text-xs"
            onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-sm">
            <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span className="text-rose-700">{error}</span>
          </div>
        )}

        {/* ── KPI Grid ── */}
        {loading && !stats ? (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
                <div className="h-9 w-9 rounded-xl bg-secondary" />
                <div className="h-6 w-24 bg-secondary rounded-lg" />
                <div className="h-3 w-16 bg-secondary rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {kpis.map((k) => (
              <div key={k.label} className={`rounded-2xl ring-1 ${k.ring} ${k.bg} p-4`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 mb-3">
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <div className={`text-2xl font-extrabold ${k.color} leading-none truncate`}>{k.val}</div>
                <p className="text-xs font-semibold text-slate-800 mt-1 leading-tight">{k.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Operational Metrics ── */}
        {stats && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <SectionHeader icon={Activity} title="Metrik Operasional" subtitle="Rasio performa sistem secara keseluruhan" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Pesanan Selesai",       val: completionRate,  max: 100, current: stats.orders.completed,    total: stats.orders.total,            color: "bg-emerald-500" },
                { label: "Alokasi Donasi",         val: allocationRate,  max: 100, current: stats.donations.success_count - (stats.donations.unallocated_success_count ?? 0), total: stats.donations.success_count, color: "bg-blue-500" },
                { label: "Produk Disetujui",       val: stats.products.total > 0 ? Math.round((stats.products.approved / stats.products.total) * 100) : 0, max: 100, current: stats.products.approved, total: stats.products.total, color: "bg-indigo-500" },
                { label: "Penerima Terverifikasi", val: stats.users.total > 0 ? Math.round((stats.users.beneficiaries / stats.users.total) * 100) : 0, max: 100, current: stats.users.beneficiaries, total: stats.users.total, color: "bg-purple-500" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-border bg-slate-50/50 p-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground">{m.label}</p>
                    <span className="text-lg font-extrabold text-foreground">{m.val}%</span>
                  </div>
                  <ProgressBar value={m.val} max={100} color={m.color} />
                  <p className="text-[10px] text-muted-foreground mt-2">{m.current} dari {m.total}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Regional & Demographics ── */}
        <div className="grid gap-6 xl:grid-cols-2">

          {/* Regional */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <SectionHeader icon={Map} title="Regional Report" subtitle={regional ? `Periode ${fmtDate(regional.period?.start_date)} – ${fmtDate(regional.period?.end_date)}` : "Memuat…"} />
            {!regional ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-secondary animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Coverage */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Penerima", val: regional.coverage.total_beneficiaries },
                    { label: "Anak",     val: regional.coverage.total_children },
                    { label: "Vendor",   val: regional.coverage.total_vendors },
                    { label: "Kecamatan",val: regional.coverage.districts_covered },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="text-lg font-extrabold text-foreground">{c.val}</div>
                      <div className="text-xs font-semibold text-muted-foreground">{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Stunting + Budget */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Stunting Rate</p>
                    <div className="text-2xl font-extrabold text-rose-600">{regional.stunting_rate.current.toFixed(1)}%</div>
                    <p className="text-[10px] text-muted-foreground">
                      Sebelumnya {regional.stunting_rate.previous.toFixed(1)}% · {regional.stunting_rate.trend}
                    </p>
                    <ProgressBar value={regional.stunting_rate.current} max={100} color="bg-rose-400" />
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Budget Utilization</p>
                    <div className="text-2xl font-extrabold text-blue-600">{regional.budget_utilization.percentage.toFixed(1)}%</div>
                    <p className="text-[10px] text-muted-foreground">
                      {formatIDR(regional.budget_utilization.utilized)} / {formatIDR(regional.budget_utilization.allocated)}
                    </p>
                    <ProgressBar value={regional.budget_utilization.percentage} max={100} color="bg-blue-500" />
                  </div>
                </div>

                {/* District table */}
                {regional.district_breakdown.length > 0 && (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border">
                          <th className="py-2 pl-4 pr-2 text-left font-bold text-muted-foreground uppercase tracking-wider">Kecamatan</th>
                          <th className="py-2 px-2 text-right font-bold text-muted-foreground uppercase tracking-wider">Penerima</th>
                          <th className="py-2 px-2 text-right font-bold text-muted-foreground uppercase tracking-wider">Anak</th>
                          <th className="py-2 pl-2 pr-4 text-right font-bold text-muted-foreground uppercase tracking-wider">Stunting</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regional.district_breakdown.map((d) => (
                          <tr key={d.district} className="border-b border-border/50 hover:bg-slate-50/60">
                            <td className="py-2 pl-4 pr-2 font-semibold text-foreground">{d.district}</td>
                            <td className="py-2 px-2 text-right text-muted-foreground">{d.beneficiaries}</td>
                            <td className="py-2 px-2 text-right text-muted-foreground">{d.children}</td>
                            <td className="py-2 pl-2 pr-4 text-right">
                              <span className={d.stunting_rate > 20 ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                                {d.stunting_rate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Demographics */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <SectionHeader icon={BarChart3} title="Demographics Report" subtitle="Distribusi data penerima manfaat" />
            {!demographics ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-secondary animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-5">
                {[
                  { title: "Distribusi Usia",           items: demographics.age_distribution,    color: "bg-blue-500" },
                  { title: "Distribusi Gender",          items: demographics.gender_distribution,  color: "bg-purple-500" },
                  { title: "Status Nutrisi",             items: demographics.nutrition_status,     color: "bg-emerald-500" },
                  { title: "Klasifikasi FIES",           items: demographics.fies_classification,  color: "bg-rose-500" },
                ].map((section) => (
                  <div key={section.title}>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{section.title}</p>
                    {section.items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Belum ada data.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {section.items.map((item) => (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className="w-24 text-xs font-semibold text-foreground truncate flex-shrink-0">{item.label}</div>
                            <div className="flex-1">
                              <ProgressBar value={item.percentage} max={100} color={section.color} />
                            </div>
                            <div className="text-[10px] text-muted-foreground w-8 flex-shrink-0 text-right">{item.count}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Export Panel ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-bold text-foreground">Export Data CSV</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Download laporan dari backend admin dalam format CSV.</p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EXPORTS.map((exp) => {
              const isExporting = exporting === exp.filename;
              return (
                <button
                  key={exp.filename}
                  onClick={() => void handleExport(exp.endpoint, exp.filename)}
                  disabled={Boolean(exporting)}
                  className={`group flex flex-col items-center gap-2.5 rounded-2xl ${exp.bg} ring-1 ${exp.ring} p-5 transition-all hover:shadow-md hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400`}
                >
                  {isExporting
                    ? <Loader2 className={`h-7 w-7 ${exp.color} animate-spin`} />
                    : <exp.icon className={`h-7 w-7 ${exp.color} transition-transform group-hover:scale-110`} />
                  }
                  <div className="text-center">
                    <p className={`text-sm font-bold ${exp.color}`}>{exp.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{exp.filename}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-semibold ${exp.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <Download className="h-3 w-3" /> Download
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
