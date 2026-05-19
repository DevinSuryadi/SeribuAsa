import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShoppingCart,
  Heart,
  Download,
  RefreshCw,
  AlertCircle,
  Package,
  ClipboardList,
  FileText,
  Ticket,
  Gift,
  UserCheck,
  BarChart3,
  ChevronRight,
  PieChart,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";

interface AdminStats {
  users: {
    total: number;
    donors: number;
    beneficiaries: number;
    vendors: number;
    pending_beneficiaries: number;
    pending_vendors: number;
  };
  products: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  vouchers: {
    active_count: number;
    total_balance: number;
  };
  orders: {
    total: number;
    completed: number;
  };
  redemptions: {
    total_count: number;
    total_amount: number;
  };
  donations: {
    total_amount: number;
  };
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExport, setSelectedExport] = useState("users");

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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExport = async (type: string) => {
    try {
      const token = await import("@/integrations/supabase/client").then((m) =>
        m.supabase.auth.getSession()
      );

      const response = await fetch(`${API_BASE}/admin/export/${type}`, {
        headers: {
          Authorization: `Bearer ${token.data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error("Gagal mengekspor data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${type}.csv`;
      a.click();

      window.URL.revokeObjectURL(url);
      toast.success(`Berhasil mengekspor ${type}.csv`);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengekspor data");
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Selamat datang, Admin"
        subtitle="Pantau dan kelola seluruh ekosistem SeribuAsa."
      >
        <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col gap-2.5">
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[78px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-2.5 h-3 w-24 rounded-full bg-slate-100" />
                <div className="mb-2 h-5 w-14 rounded-full bg-slate-100" />
                <div className="h-2.5 w-20 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="grid items-stretch gap-2.5 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
            <div className="h-[238px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="h-[238px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>

          <div className="grid flex-1 gap-2.5 xl:grid-cols-[minmax(0,1.26fr)_minmax(280px,0.74fr)]">
            <div className="min-h-[94px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="min-h-[94px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Selamat datang, Admin"
        subtitle="Pantau dan kelola seluruh ekosistem SeribuAsa."
      >
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>

            <div className="flex-1">
              <h3 className="mb-1 text-sm font-semibold text-red-800">
                Gagal memuat data
              </h3>
              <p className="mb-3 text-sm text-red-600">{error}</p>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                className="h-8 border-red-300 bg-white text-xs text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Coba Lagi
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingBeneficiaries = stats?.users.pending_beneficiaries || 0;
  const pendingVendors = stats?.users.pending_vendors || 0;
  const pendingProducts = stats?.products.pending || 0;
  const pendingOrders = Math.max(
    (stats?.orders.total || 0) - (stats?.orders.completed || 0),
    0
  );

  const pendingReview = pendingBeneficiaries + pendingVendors + pendingProducts;

  const donors = stats?.users.donors || 0;
  const beneficiaries = stats?.users.beneficiaries || 0;
  const vendors = stats?.users.vendors || 0;
  const totalComposition = donors + beneficiaries + vendors;
  const roleTotal = Math.max(totalComposition, 1);

  const donorDeg = totalComposition > 0 ? (donors / totalComposition) * 360 : 0;
  const beneficiaryDeg =
    totalComposition > 0 ? (beneficiaries / totalComposition) * 360 : 0;
  const vendorDeg = totalComposition > 0 ? (vendors / totalComposition) * 360 : 0;

  const pieGradient =
    totalComposition > 0
      ? `conic-gradient(
          #059669 0deg ${donorDeg}deg,
          #14b8a6 ${donorDeg}deg ${donorDeg + beneficiaryDeg}deg,
          #f59e0b ${donorDeg + beneficiaryDeg}deg ${
            donorDeg + beneficiaryDeg + vendorDeg
          }deg,
          #e2e8f0 ${donorDeg + beneficiaryDeg + vendorDeg}deg 360deg
        )`
      : "conic-gradient(#e2e8f0 0deg 360deg)";

  const userComposition = [
    {
      label: "Donatur",
      value: donors,
      percent: Math.round((donors / roleTotal) * 100),
      dotClass: "bg-emerald-600",
      textClass: "text-emerald-700",
    },
    {
      label: "Penerima",
      value: beneficiaries,
      percent: Math.round((beneficiaries / roleTotal) * 100),
      dotClass: "bg-teal-500",
      textClass: "text-teal-700",
    },
    {
      label: "Vendor",
      value: vendors,
      percent: Math.round((vendors / roleTotal) * 100),
      dotClass: "bg-amber-500",
      textClass: "text-amber-700",
    },
  ];

  const kpiCards = [
    {
      label: "Total Pengguna",
      value: stats?.users.total || 0,
      helper: "Semua peran",
      icon: Users,
      iconClass: "text-emerald-700",
      surface: "bg-emerald-50",
    },
    {
      label: "Total Donasi",
      value: formatIDR(stats?.donations.total_amount || 0),
      helper: "Dana terkumpul",
      icon: Heart,
      iconClass: "text-green-600",
      surface: "bg-green-50",
    },
    {
      label: "Perlu Ditinjau",
      value: pendingReview,
      helper: "Item menunggu tinjauan",
      icon: ClipboardList,
      iconClass: "text-amber-600",
      surface: "bg-amber-50",
    },
    {
      label: "Pesanan Selesai",
      value: stats?.orders.completed || 0,
      helper: `Dari ${stats?.orders.total || 0} pesanan`,
      icon: Package,
      iconClass: "text-sky-700",
      surface: "bg-sky-50",
    },
  ];

  const priorityTasks = [
    {
      title: "Kelayakan penerima",
      desc: "Tinjau pengajuan penerima manfaat",
      summary: `${pendingBeneficiaries} pengajuan menunggu tinjauan`,
      count: pendingBeneficiaries,
      href: "/dashboard/admin/beneficiaries",
      accent: "bg-emerald-500",
      priorityLabel: "Tinggi",
      priorityClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    },
    {
      title: "Pesanan masuk",
      desc: "Konfirmasi pesanan yang belum selesai",
      summary: `${pendingOrders} pesanan perlu diproses`,
      count: pendingOrders,
      href: "/dashboard/admin/orders",
      accent: "bg-teal-500",
      priorityLabel: "Menengah",
      priorityClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    },
    {
      title: "Produk tertunda",
      desc: "Tinjau produk yang menunggu persetujuan",
      summary: `${pendingProducts} produk menunggu tinjauan`,
      count: pendingProducts,
      href: "/dashboard/admin/products",
      accent: "bg-sky-500",
      priorityLabel: "Menengah",
      priorityClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    },
    {
      title: "Validasi vendor",
      desc: "Verifikasi akun vendor baru",
      summary: `${pendingVendors} vendor menunggu verifikasi`,
      count: pendingVendors,
      href: "/dashboard/admin/users",
      accent: "bg-lime-500",
      priorityLabel: "Rendah",
      priorityClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    },
  ];

  const activePriorityTasks = priorityTasks.filter((task) => task.count > 0);

  const exportOptions = [
    {
      label: "Pengguna",
      desc: "Data akun pengguna",
      type: "users",
      icon: Users,
    },
    {
      label: "Pesanan",
      desc: "Riwayat pesanan",
      type: "orders",
      icon: ShoppingCart,
    },
    {
      label: "Voucher",
      desc: "Data voucher aktif",
      type: "vouchers",
      icon: Ticket,
    },
    {
      label: "Penukaran",
      desc: "Riwayat penukaran",
      type: "redemptions",
      icon: Gift,
    },
  ];

  const quickLinks = [
    {
      label: "Kelola Pengguna",
      desc: "Kelola akun dan peran pengguna",
      href: "/dashboard/admin/users",
      icon: Users,
      iconWrap: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Tinjau Kelayakan",
      desc: "Tinjau pengajuan kelayakan penerima",
      href: "/dashboard/admin/beneficiaries",
      icon: UserCheck,
      iconWrap: "bg-amber-50 text-amber-700",
    },
    {
      label: "Kelola Pesanan",
      desc: "Lihat dan proses pesanan masuk",
      href: "/dashboard/admin/orders",
      icon: ShoppingCart,
      iconWrap: "bg-teal-50 text-teal-700",
    },
    {
      label: "Laporan & Analitik",
      desc: "Lihat data dan insight penting",
      href: "/dashboard/admin/reports",
      icon: BarChart3,
      iconWrap: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <DashboardLayout
      title="Selamat datang, Admin"
      subtitle="Pantau dan kelola seluruh ekosistem SeribuAsa."
    >
      <div className="relative -mx-1 flex min-h-[calc(100dvh-9.5rem)] flex-col gap-2.5 overflow-hidden rounded-[1.25rem] bg-[#fbfffc] px-1 pb-1">
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-100/30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-40 h-32 w-32 rounded-full bg-amber-50/55 blur-3xl" />

        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.024)]">
          <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="flex min-h-[80px] items-center justify-between gap-3 p-3 transition hover:bg-emerald-50/20 sm:min-h-[88px] lg:p-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700 sm:text-xs">
                      {card.label}
                    </p>
                    <div className="mt-1 text-[1.35rem] font-semibold leading-none tracking-tight text-slate-950 sm:text-[1.55rem]">
                      {card.value}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                      {card.helper}
                    </p>
                  </div>

                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${card.surface}`}
                  >
                    <Icon className={`h-4 w-4 stroke-[1.8] ${card.iconClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid items-stretch gap-2.5 xl:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.035)] ring-1 ring-slate-200">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-500 via-teal-400 to-amber-300" />

            <div className="relative flex h-full flex-col px-4 py-3.5 pl-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-950">
                    Tugas Prioritas
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Ringkasan pekerjaan yang perlu dipantau.
                  </p>
                </div>

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    activePriorityTasks.length > 0
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
                  ].join(" ")}
                >
                  {activePriorityTasks.length > 0
                    ? `${activePriorityTasks.length} aktif`
                    : "Aman"}
                </span>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden rounded-[18px] bg-slate-50/70">
                {priorityTasks.map((task, index) => {
                  const hasTask = task.count > 0;

                  return (
                    <div
                      key={task.title}
                      className={[
                        "grid flex-1 items-center gap-3 px-3.5 py-2.5 transition hover:bg-white/80 md:grid-cols-[1.25fr_0.7fr_auto_auto]",
                        index !== priorityTasks.length - 1
                          ? "border-b border-slate-100"
                          : "",
                      ].join(" ")}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                            hasTask ? task.accent : "bg-slate-300",
                          ].join(" ")}
                        />

                        <div className="min-w-0">
                          <p
                            className={[
                              "text-xs font-semibold",
                              hasTask ? "text-slate-950" : "text-slate-500",
                            ].join(" ")}
                          >
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {task.desc}
                          </p>
                        </div>
                      </div>

                      <p
                        className={[
                          "text-[11px]",
                          hasTask ? "text-slate-600" : "text-slate-400",
                        ].join(" ")}
                      >
                        {task.summary}
                      </p>

                      <span
                        className={[
                          "w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                          hasTask
                            ? task.priorityClass
                            : "bg-white text-slate-500 ring-1 ring-slate-200",
                        ].join(" ")}
                      >
                        {hasTask ? task.priorityLabel : "Aman"}
                      </span>

                      {hasTask ? (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-full border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          <Link to={task.href}>Tinjau</Link>
                        </Button>
                      ) : (
                        <span className="inline-flex h-7 items-center justify-center rounded-full bg-white px-3 text-xs font-semibold text-slate-400 ring-1 ring-slate-200">
                          Selesai
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.024)]">
            <div className="mb-3 flex items-start gap-2.5">

              <div>
                <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-950">
                  Ekspor Data
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pilih data yang ingin Anda ekspor dalam format CSV.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedExport === option.type;

                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedExport(option.type)}
                    className={[
                      "rounded-xl border p-2.5 text-left transition",
                      isSelected
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/20",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        className={[
                          "mt-0.5 h-4 w-4 flex-shrink-0",
                          isSelected ? "text-emerald-700" : "text-slate-500",
                        ].join(" ")}
                      />

                      <div>
                        <p className="text-xs font-semibold text-slate-950">
                          {option.label}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {option.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-5">
              <div className="mb-4 h-px bg-slate-100" />

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-700">Format</p>
                  <div className="flex h-9 min-w-[118px] items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4">
                    <FileText className="h-3.5 w-3.5 text-emerald-700" />
                    <span className="text-xs font-semibold text-slate-950">CSV</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleExport(selectedExport)}
                  className="h-9 rounded-lg bg-emerald-600 px-5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.16)] hover:bg-emerald-700"
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Ekspor
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid flex-1 items-stretch gap-2.5 xl:grid-cols-[minmax(0,1.26fr)_minmax(280px,0.74fr)]">
          <div className="flex min-h-[104px] flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.024)]">
            <div className="mb-2.5">
              <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-950">
                Akses Cepat
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Kelola fitur utama dengan cepat.
              </p>
            </div>

            <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="group flex min-h-[58px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/20 hover:shadow-[0_10px_20px_rgba(6,95,70,0.04)]"
                  >
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${link.iconWrap}`}
                    >
                      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-950">
                        {link.label}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-slate-500">
                        {link.desc}
                      </p>
                    </div>

                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-[104px] flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.024)]">
            <div className="mb-2.5 flex items-start gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <PieChart className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-950">
                  Komposisi Pengguna
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Distribusi role aktif.
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center rounded-full">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: pieGradient }}
                />

                <div className="relative flex h-[54px] w-[54px] flex-col items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
                  <span className="text-base font-semibold leading-none text-slate-950">
                    {totalComposition}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-500">
                    pengguna
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                {userComposition.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
                      <span className="truncate text-slate-600">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {totalComposition > 0 ? item.percent : 0}%
                      </span>
                      <span
                        className={`min-w-4 text-right font-semibold ${item.textClass}`}
                      >
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}