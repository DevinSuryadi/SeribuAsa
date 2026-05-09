import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import { downloadTextFile } from "./adminUtils";
import { toast } from "sonner";
import {
  Wallet, QrCode, RefreshCw, Download, Loader2, TrendingUp,
  BarChart3, Activity, Users,
} from "lucide-react";

type AdminStatsResponse = {
  vouchers:    { active_count: number; total_balance: number };
  redemptions: { total_count: number; total_amount: number };
  users:       { beneficiaries: number };
  orders:      { completed: number; total: number };
};

const exports_ = [
  { label: "Users",       endpoint: "/admin/export/users",       filename: "users.csv",       color: "text-slate-600",   bg: "bg-slate-100" },
  { label: "Orders",      endpoint: "/admin/export/orders",      filename: "orders.csv",      color: "text-blue-600",    bg: "bg-blue-100" },
  { label: "E-Wallet",    endpoint: "/admin/export/vouchers",    filename: "ewallet.csv",     color: "text-emerald-600", bg: "bg-emerald-100" },
  { label: "Redemptions", endpoint: "/admin/export/redemptions", filename: "redemptions.csv", color: "text-purple-600",  bg: "bg-purple-100" },
] as const;

export default function AdminVouchersPage() {
  const [stats, setStats]       = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await apiFetch("/admin/stats")) as AdminStatsResponse;
      setStats(data);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memuat statistik E-Wallet");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const exportCsv = async (endpoint: string, filename: string) => {
    try {
      setExporting(filename);
      const payload = (await apiFetch(endpoint, { headers: { Accept: "text/csv" } })) as { detail?: string } | string;
      const csv = typeof payload === "string" ? payload : (payload.detail ?? "");
      downloadTextFile(filename, csv, "text/csv");
      toast.success(`Berhasil export ${filename}`);
    } catch (err: any) {
      toast.error(err?.message ?? `Gagal export ${filename}`);
    } finally { setExporting(null); }
  };

  const avgBalance = stats && stats.users.beneficiaries > 0
    ? stats.vouchers.total_balance / stats.users.beneficiaries
    : 0;
  const completionRate = stats && stats.orders.total > 0
    ? Math.round((stats.orders.completed / stats.orders.total) * 100)
    : 0;

  return (
    <DashboardLayout title="Sistem E-Wallet" subtitle="Monitor saldo escrow, aktivitas redemption, dan export data.">
      <div className="space-y-6">

        {/* Refresh */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Data diambil langsung dari sistem E-Wallet escrow.</p>
          <Button variant="outline" size="sm" className="h-9 rounded-xl gap-1.5 text-xs"
            onClick={() => void loadStats()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Dompet Aktif",        val: loading ? "–" : String(stats?.vouchers.active_count ?? 0),  icon: Wallet,    bg: "bg-emerald-50", ring: "ring-emerald-100", color: "text-emerald-700", desc: "E-wallet dengan saldo > 0" },
            { label: "Total Saldo Escrow",   val: loading ? "–" : formatIDR(stats?.vouchers.total_balance ?? 0), icon: BarChart3, bg: "bg-blue-50", ring: "ring-blue-100",  color: "text-blue-700",    desc: "Dana tertahan di sistem" },
            { label: "Total Redemption",     val: loading ? "–" : String(stats?.redemptions.total_count ?? 0), icon: QrCode,   bg: "bg-purple-50", ring: "ring-purple-100", color: "text-purple-700",  desc: "QR scan berhasil" },
            { label: "Nilai Transaksi",      val: loading ? "–" : formatIDR(stats?.redemptions.total_amount ?? 0), icon: TrendingUp, bg: "bg-rose-50", ring: "ring-rose-100", color: "text-rose-700", desc: "Total nilai redemption" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl ${s.bg} ring-1 ${s.ring} p-5`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 mb-4">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-extrabold ${s.color} leading-none mb-1`}>{s.val}</div>
              <p className="text-sm font-bold text-slate-900">{s.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rata-rata Saldo/Penerima</p>
              <div className="text-xl font-extrabold text-indigo-700">{loading ? "–" : formatIDR(avgBalance)}</div>
              <p className="text-[10px] text-muted-foreground">{stats?.users.beneficiaries ?? 0} penerima aktif</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
              <Activity className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rasio Pesanan Selesai</p>
              <div className="text-xl font-extrabold text-amber-700">{loading ? "–" : `${completionRate}%`}</div>
              <p className="text-[10px] text-muted-foreground">{stats?.orders.completed ?? 0} dari {stats?.orders.total ?? 0} pesanan</p>
            </div>
          </div>
        </div>

        {/* Export panel */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border bg-slate-50/50">
            <div className="flex items-center gap-2 mb-1">
              <Download className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">Export Data CSV</h3>
            </div>
            <p className="text-xs text-muted-foreground">Download laporan langsung dari backend admin.</p>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {exports_.map((exp) => (
              <button
                key={exp.filename}
                onClick={() => void exportCsv(exp.endpoint, exp.filename)}
                disabled={Boolean(exporting)}
                className={`flex flex-col items-center gap-2 rounded-2xl ${exp.bg} p-4 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {exporting === exp.filename
                  ? <Loader2 className={`h-6 w-6 ${exp.color} animate-spin`} />
                  : <Download className={`h-6 w-6 ${exp.color}`} />
                }
                <span className={`text-xs font-bold ${exp.color}`}>{exp.label}</span>
                <span className="text-[10px] text-muted-foreground">{exp.filename}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}