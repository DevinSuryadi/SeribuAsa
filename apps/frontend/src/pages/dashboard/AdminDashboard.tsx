import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Users,
  Wallet,
  ShoppingCart,
  QrCode,
  Heart,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Store,
  Shield,
  Package,
  ClipboardList,
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";

interface AdminStats {
  users: { total: number; donors: number; beneficiaries: number; vendors: number; pending_beneficiaries: number; pending_vendors: number };
  products: { total: number; pending: number; approved: number; rejected: number };
  vouchers: { active_count: number; total_balance: number }; // backend still uses vouchers key
  orders: { total: number; completed: number; pending?: number };
  redemptions: { total_count: number; total_amount: number };
  donations: { total_amount: number };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/admin/stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExport = async (type: string) => {
    try {
      const token = await import("@/integrations/supabase/client").then((m) => m.supabase.auth.getSession());
      const response = await fetch(`${API_BASE}/admin/export/${type}`, {
        headers: { Authorization: `Bearer ${token.data.session?.access_token}` },
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${type}.csv`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Berhasil export ${type}.csv`);
    } catch (err: any) {
      toast.error(err.message || "Gagal export");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Admin" subtitle="Kelola sistem dan data NutriGuard.">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse">
              <div className="h-10 w-10 rounded-2xl bg-secondary mb-4" />
              <div className="h-8 w-28 bg-secondary rounded-lg mb-2" />
              <div className="h-4 w-20 bg-secondary rounded-md" />
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard Admin" subtitle="Kelola sistem dan data NutriGuard.">
        <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6 sm:p-8 flex items-start gap-5 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-100/80 shadow-inner">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 text-lg mb-1.5">Gagal memuat data</h3>
            <p className="text-sm text-red-600/90 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchStats} className="border-red-300 text-red-700 bg-white hover:bg-red-50 hover:text-red-800 shadow-sm transition-all rounded-xl h-9">
              <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const completionRate = stats?.orders.total
    ? Math.round(((stats.orders.completed || 0) / stats.orders.total) * 100)
    : 0;

  const totalPending =
    (stats?.users.pending_beneficiaries ?? 0) +
    (stats?.users.pending_vendors ?? 0) +
    (stats?.products.pending ?? 0);

  return (
    <DashboardLayout title="Dashboard Admin 🛡️" subtitle="Pantau dan kelola seluruh ekosistem NutriGuard.">
      <div className="space-y-8">
        {/* Premium Hero Summary Bar */}
        <div className="rounded-[2rem] p-6 sm:p-8 relative overflow-hidden shadow-lg border border-slate-800/20" 
             style={{ background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)" }}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { label: "Total Donasi Terkumpul", value: formatIDR(stats?.donations.total_amount || 0), icon: Heart, color: "text-rose-300", bg: "bg-rose-500/20", iconColor: "text-rose-400" },
              { label: "Total Saldo E-Wallet", value: formatIDR(stats?.vouchers.total_balance || 0), icon: Wallet, color: "text-emerald-300", bg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
              { label: "Total Transaksi Selesai", value: formatIDR(stats?.redemptions.total_amount || 0), icon: QrCode, color: "text-blue-300", bg: "bg-blue-500/20", iconColor: "text-blue-400" },
              { label: "Rasio Pesanan Selesai", value: `${completionRate}%`, icon: Activity, color: "text-purple-300", bg: "bg-purple-500/20", iconColor: "text-purple-400" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="relative group">
                  <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${item.bg} mb-4 ring-1 ring-white/10 shadow-inner backdrop-blur-md`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor}`} />
                  </div>
                  <div className={`text-xl sm:text-3xl font-black tracking-tight ${item.color} mb-1.5 drop-shadow-sm`}>{item.value}</div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide uppercase">{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Alerts */}
        {totalPending > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 shadow-sm">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 mt-0.5">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 mb-1">Perlu Tindakan — {totalPending} item menunggu review</p>
              <div className="flex flex-wrap gap-2">
                {(stats?.users.pending_beneficiaries ?? 0) > 0 && (
                  <Link to="/dashboard/admin/beneficiaries" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg px-2.5 py-1 transition-colors">
                    <Users className="h-3 w-3" />
                    {stats?.users.pending_beneficiaries} penerima pending
                  </Link>
                )}
                {(stats?.users.pending_vendors ?? 0) > 0 && (
                  <Link to="/dashboard/admin/users" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg px-2.5 py-1 transition-colors">
                    <Store className="h-3 w-3" />
                    {stats?.users.pending_vendors} vendor pending
                  </Link>
                )}
                {(stats?.products.pending ?? 0) > 0 && (
                  <Link to="/dashboard/admin/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg px-2.5 py-1 transition-colors">
                    <Package className="h-3 w-3" />
                    {stats?.products.pending} produk pending
                  </Link>
                )}
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          </div>
        )}

        {/* Bento Box Layout */}
        <div className="grid gap-6 xl:grid-cols-3">
          
          {/* Main Content Area - Span 2 */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Quick Actions Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card rounded-[2rem] p-3 pl-6 border border-border shadow-sm">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">Export Laporan CSV</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {[
                  { label: "Users", type: "users", variant: "default" as const },
                  { label: "Orders", type: "orders", variant: "secondary" as const },
                  { label: "E-Wallet", type: "vouchers", variant: "secondary" as const },
                  { label: "Redemptions", type: "redemptions", variant: "secondary" as const },
                ].map((exp) => (
                  <Button
                    key={exp.type}
                    variant={exp.variant}
                    size="sm"
                    onClick={() => handleExport(exp.type)}
                    className="rounded-xl font-medium h-9"
                  >
                    {exp.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Demographics Bento — compact grid */}
            <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Users className="h-3.5 w-3.5 text-slate-700" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">Demografi Pengguna</h2>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">{stats?.users.total || 0} total</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total",    value: stats?.users.total || 0,         sub: "Semua role",     icon: Users,  color: "text-slate-700",   bg: "bg-slate-50",   ring: "ring-slate-100" },
                  { label: "Donatur",  value: stats?.users.donors || 0,        sub: "Aktif",          icon: Heart,  color: "text-rose-600",    bg: "bg-rose-50",    ring: "ring-rose-100" },
                  { label: "Penerima", value: stats?.users.beneficiaries || 0, sub: "Terverifikasi",  icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" },
                  { label: "Vendor",   value: stats?.users.vendors || 0,       sub: "Mitra toko",     icon: Store,  color: "text-indigo-600", bg: "bg-indigo-50",  ring: "ring-indigo-100" },
                ].map((card) => {
                  const Icon = card.icon
                  return (
                    <div key={card.label} className={`flex items-center gap-3 rounded-xl ring-1 ${card.ring} ${card.bg} p-3.5`}>
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5`}>
                        <Icon className={`h-4 w-4 ${card.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xl font-extrabold ${card.color} leading-none`}>{card.value}</div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{card.label}</p>
                        <p className="text-[10px] text-slate-500">{card.sub}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance Metrics Bento */}
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Performa Sistem</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Total Saldo E-Wallet", val: formatIDR(stats?.vouchers.total_balance || 0), desc: `${stats?.vouchers.active_count || 0} dompet aktif`, icon: Wallet, color: "text-emerald-700", bg: "bg-emerald-50/50" },
                  { title: "Total Redemption", val: formatIDR(stats?.redemptions.total_amount || 0), desc: `${stats?.redemptions.total_count || 0} transaksi berhasil`, icon: QrCode, color: "text-blue-700", bg: "bg-blue-50/50" },
                  { title: "Pesanan Selesai", val: (stats?.orders.completed || 0).toString(), desc: `Dari total ${stats?.orders.total || 0} pesanan`, icon: ShoppingCart, color: "text-orange-700", bg: "bg-orange-50/50" },
                  { title: "Total Donasi Masuk", val: formatIDR(stats?.donations.total_amount || 0), desc: "Pendanaan terkumpul", icon: TrendingUp, color: "text-rose-700", bg: "bg-rose-50/50" },
                ].map((metric) => (
                  <div key={metric.title} className={`flex items-center gap-4 rounded-2xl border border-border ${metric.bg} p-4`}>
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                      <metric.icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{metric.title}</p>
                      <p className={`text-lg font-extrabold truncate ${metric.color}`}>{metric.val}</p>
                      <p className="text-[11px] text-muted-foreground/80">{metric.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          {/* Sidebar Menu - Span 1 */}
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-border bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-foreground">Menu Manajemen</h2>
                </div>
                <p className="text-xs text-muted-foreground">Akses kontrol penuh operasional sistem</p>
              </div>
              
              <div className="p-3 space-y-1 flex-1">
                {[
                  { label: "Kelola Pengguna",   desc: `${stats?.users.total || 0} akun terdaftar`,           icon: Users,        href: "/dashboard/admin/users",          bg: "bg-slate-100",   color: "text-slate-700",   badge: null },
                  { label: "Kelola Produk",      desc: `${stats?.products.approved || 0} disetujui`,           icon: Package,      href: "/dashboard/admin/products",       bg: "bg-indigo-100",  color: "text-indigo-700",  badge: stats?.products.pending || null },
                  { label: "Review Penerima",    desc: `${stats?.users.beneficiaries || 0} penerima aktif`,    icon: ClipboardList, href: "/dashboard/admin/beneficiaries", bg: "bg-amber-100",   color: "text-amber-700",   badge: stats?.users.pending_beneficiaries || null },
                  { label: "Sistem E-Wallet",    desc: "Pantau escrow & alokasi",                             icon: Wallet,       href: "/dashboard/admin/vouchers",       bg: "bg-emerald-100", color: "text-emerald-700", badge: null },
                  { label: "Kelola Donasi",      desc: formatIDR(stats?.donations.total_amount || 0),          icon: Heart,        href: "/dashboard/admin/donations",      bg: "bg-rose-100",    color: "text-rose-700",    badge: null },
                  { label: "Monitor Pesanan",    desc: `${stats?.orders.completed || 0} dari ${stats?.orders.total || 0} selesai`, icon: ShoppingCart, href: "/dashboard/admin/orders", bg: "bg-blue-100", color: "text-blue-700", badge: stats?.orders.pending || null },
                  { label: "Laporan & Analitik", desc: "Dashboard insight khusus",                            icon: Activity,     href: "/dashboard/admin/reports",        bg: "bg-purple-100",  color: "text-purple-700",  badge: null },
                ].map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-slate-50 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-200"
                    >
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${link.bg} shadow-inner transition-transform group-hover:scale-105`}>
                        <Icon className={`h-5 w-5 ${link.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{link.label}</div>
                        <div className="text-[10px] font-medium text-slate-500">{link.desc}</div>
                      </div>
                      {link.badge ? (
                        <span className="flex-shrink-0 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 ring-1 ring-amber-200">
                          {link.badge}
                        </span>
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
