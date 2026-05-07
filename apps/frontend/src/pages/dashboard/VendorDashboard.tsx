import { useState, useMemo, useCallback } from "react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Store,
  Wallet,
  Package,
  BarChart3,
  QrCode,
  ArrowRight,
  ArrowDownToLine,
  TrendingUp,
  ChevronRight,
  Boxes,
  ReceiptText,
  BanknoteArrowDown,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import { updateOrderStatus } from "@/services/orders";
import { getSalesReport } from "@/services/reports";
import { requestWithdrawal } from "@/services/vendor-wallet";
import { toast } from "sonner";
import { useVendorData } from "@/hooks/useVendorData";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { PageSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { orderStatusConfig } from "@/lib/status-config";
import foto from "@/assets/hero-vendorDashboard.svg";

const MIN_WITHDRAWAL = 50000;

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ElementType;
  iconWrapClass: string;
  iconClass: string;
  valueClass: string;
  borderClass: string;
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconWrapClass,
  iconClass,
  valueClass,
  borderClass,
}: MetricCardProps) {
  return (
    <div
      className={`flex h-full min-h-[92px] rounded-[17px] border bg-white px-3.5 py-3.5 shadow-[0_7px_18px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.055)] ${borderClass}`}
    >
      <div className="flex w-full items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
        >
          <Icon className={`h-[17px] w-[17px] ${iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`break-words text-[21px] font-black leading-none tracking-tight ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-[11.5px] font-bold leading-tight text-slate-700">{title}</p>

          <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

type VendorMenuCardProps = {
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
  icon: ElementType;
  iconWrapClass: string;
  iconClass: string;
  borderClass: string;
  disabled?: boolean;
};

function VendorMenuCard({
  title,
  desc,
  href,
  onClick,
  icon: Icon,
  iconWrapClass,
  iconClass,
  borderClass,
  disabled = false,
}: VendorMenuCardProps) {
  const content = (
    <>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${iconWrapClass}`}
      >
        <Icon className={`h-[17px] w-[17px] ${iconClass}`} />
      </div>

      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[12.5px] font-black leading-tight text-slate-900">{title}</p>

        <p className="mt-0.5 truncate text-[10.5px] font-medium leading-snug text-slate-500">
          {desc}
        </p>
      </div>

      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-slate-400 transition-all duration-200 group-hover:text-slate-600">
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </>
  );

  const className = `group flex min-h-[50px] w-full flex-1 items-center gap-2.5 rounded-[14px] border bg-white/75 px-3 py-2.5 shadow-[0_5px_14px_rgba(15,23,42,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_9px_20px_rgba(15,23,42,0.045)] ${borderClass} ${
    disabled ? "pointer-events-none opacity-60" : ""
  }`;

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

export default function VendorDashboard() {
  const { user } = useAuth();

  const {
    data: { orders, products, wallet },
    loading,
    error,
    refetch,
    refetchOrders,
  } = useVendorData();

  useSmartPolling(refetchOrders, { interval: 30000, enabled: !!user });

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [totalSalesFromReport, setTotalSalesFromReport] = useState<number>(0);

  useSmartPolling(
    async () => {
      if (!user) return;

      try {
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const reportData = await getSalesReport(startDate, endDate);

        if (reportData?.summary?.total_sales) {
          setTotalSalesFromReport(reportData.summary.total_sales);
        }
      } catch {
        // report error tidak perlu memblokir dashboard
      }
    },
    { interval: 60000, enabled: !!user }
  );

  const totalRevenue = useMemo(() => {
    if (totalSalesFromReport > 0) return totalSalesFromReport;

    return orders
      .filter((order) => order.status === "completed")
      .reduce((sum, order) => sum + parseFloat(String(order.total_amount) || "0"), 0);
  }, [totalSalesFromReport, orders]);

  const activeProducts = useMemo(
    () => products.filter((product) => product.approval_status === "approved").length,
    [products]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );

  const walletBalance = wallet?.balance || 0;
  const canWithdraw = walletBalance >= MIN_WITHDRAWAL;

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: "completed" | "cancelled") => {
      try {
        await updateOrderStatus(orderId, status);

        toast.success(`Pesanan ${status === "completed" ? "diselesaikan" : "dibatalkan"}`);

        refetchOrders();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Gagal memperbarui status";
        toast.error(message);
      }
    },
    [refetchOrders]
  );

  const handleWithdraw = useCallback(async () => {
    const amount = parseFloat(withdrawAmount);

    if (Number.isNaN(amount) || amount < MIN_WITHDRAWAL) {
      toast.error(`Minimum penarikan ${formatIDR(MIN_WITHDRAWAL)}`);
      return;
    }

    if (amount > walletBalance) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    try {
      setWithdrawLoading(true);
      await requestWithdrawal(amount);

      toast.success(`Penarikan ${formatIDR(amount)} berhasil diproses`);

      setWithdrawModalOpen(false);
      setWithdrawAmount("");
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memproses penarikan";
      toast.error(message);
    } finally {
      setWithdrawLoading(false);
    }
  }, [withdrawAmount, walletBalance, refetch]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Vendor" subtitle="Memuat data toko Anda...">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard Vendor" subtitle="Kelola produk dan penukaran voucher.">
        <ErrorState message={error} onRetry={refetch} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Toko ${user?.fullName || "Vendor"}`}
      subtitle="Kelola produk, pesanan, dan saldo toko Anda."
    >
      <div className="flex min-h-[calc(100vh-132px)] w-full max-w-none flex-col gap-3 pb-3">
        {/* Hero Wallet */}
        <section className="relative shrink-0 overflow-hidden rounded-[20px] border border-emerald-100/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,#ffffff_0%,#fbfffd_42%,#e9fbf0_100%)]" />
          <div className="absolute -right-14 bottom-0 h-40 w-40 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="absolute right-[34%] top-3 h-24 w-24 rounded-full bg-lime-100/45 blur-2xl" />

          <div className="relative z-10 grid min-h-[132px] grid-cols-1 gap-3 px-4 py-3.5 sm:px-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center lg:grid-cols-[minmax(0,0.95fr)_minmax(230px,0.75fr)_minmax(160px,0.35fr)] lg:px-5 xl:min-h-[142px]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 shadow-[0_8px_20px_rgba(16,185,129,0.08)] sm:h-14 sm:w-14">
                <Wallet className="h-6 w-6 text-emerald-700 sm:h-7 sm:w-7" />
              </div>

              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold leading-tight text-slate-600 sm:text-[13px]">
                  Saldo E-Wallet Toko
                </p>

                <h2 className="mt-1 break-words text-[28px] font-black leading-none tracking-tight text-emerald-800 sm:text-[34px]">
                  {formatIDR(walletBalance)}
                </h2>

                <p className="mt-1.5 text-[11.5px] font-medium text-slate-500 sm:text-xs">
                  Minimum penarikan:{" "}
                  <span className="font-black text-emerald-700">{formatIDR(MIN_WITHDRAWAL)}</span>
                </p>
              </div>
            </div>

            <div className="pointer-events-none hidden h-full items-end justify-center lg:flex">
              <img
                src={foto}
                alt="Ilustrasi toko vendor"
                className="h-[118px] w-full object-contain object-center xl:h-[128px]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:flex-col md:justify-self-end lg:ml-auto lg:w-full">
              <Button
                className="h-10 rounded-[13px] bg-white px-4 text-[12.5px] font-black text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.07)] hover:bg-emerald-50 disabled:opacity-60"
                onClick={() => setWithdrawModalOpen(true)}
                disabled={!canWithdraw}
              >
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Tarik Dana
              </Button>

              <Button
                variant="secondary"
                className="h-10 rounded-[13px] bg-white px-4 text-[12.5px] font-black text-emerald-700 shadow-[0_8px_20px_rgba(15,23,42,0.07)] hover:bg-emerald-50"
                asChild
              >
                <Link to="/dashboard/scan-qr">
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Pickup
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="grid w-full shrink-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Pesanan"
            value={orders.length.toString()}
            subtitle={`${pendingOrders} pending`}
            icon={ShoppingBag}
            iconWrapClass="bg-indigo-50"
            iconClass="text-indigo-600"
            valueClass="text-indigo-600"
            borderClass="border-indigo-100"
          />

          <MetricCard
            title="Pendapatan Bulan Ini"
            value={formatIDR(totalRevenue)}
            subtitle="Periode 30 hari"
            icon={TrendingUp}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
            valueClass="text-emerald-700"
            borderClass="border-emerald-100"
          />

          <MetricCard
            title="Produk Aktif"
            value={activeProducts.toString()}
            subtitle={`dari ${products.length} produk`}
            icon={Package}
            iconWrapClass="bg-orange-50"
            iconClass="text-orange-600"
            valueClass="text-orange-600"
            borderClass="border-orange-100"
          />

          <MetricCard
            title="Status Pencairan"
            value={orders.length > 0 ? "Aktif" : "-"}
            subtitle="Periode berjalan"
            icon={BarChart3}
            iconWrapClass="bg-violet-50"
            iconClass="text-violet-600"
            valueClass="text-violet-600"
            borderClass="border-violet-100"
          />
        </section>

        {/* Main */}
        <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)] lg:items-stretch">
          {/* Recent Orders */}
          <div className="flex min-h-[230px] flex-col rounded-[20px] border border-slate-200/70 bg-white p-3.5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] sm:p-4 lg:min-h-0">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-black tracking-tight text-emerald-800">
                  Pesanan Terbaru
                </h2>

                <p className="mt-0.5 text-[11.5px] font-medium text-slate-500">
                  Pantau pesanan voucher terbaru dari penerima.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-lg px-2 text-[12px] font-black text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                asChild
              >
                <Link to="/dashboard/penukaran-voucher">
                  Semua
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden rounded-[17px] border border-slate-200/80 bg-white">
              {orders.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-4 py-4 text-center">
                  <div className="flex flex-col items-center sm:flex-row sm:gap-4 sm:text-left lg:flex-col lg:text-center xl:flex-row xl:text-left">
                    <div className="mb-3 flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-indigo-50 sm:mb-0 lg:mb-3 xl:mb-0">
                      <Store className="h-6 w-6 text-indigo-500" />
                    </div>

                    <div>
                      <p className="text-[15px] font-black tracking-tight text-slate-900">
                        Belum ada pesanan
                      </p>

                      <p className="mt-1.5 max-w-md text-[11.5px] font-medium leading-5 text-slate-500">
                        Pesanan voucher penerima akan muncul di sini.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {orders.slice(0, 6).map((order) => {
                    const config = orderStatusConfig[order.status] || orderStatusConfig.pending;

                    return (
                      <div
                        key={order.id}
                        className="flex flex-col gap-3 px-3.5 py-3 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                            <Store className="h-[18px] w-[18px] text-indigo-500" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-black text-slate-900">
                              Pesanan #{String(order.id).slice(0, 8)}
                            </p>

                            <p className="mt-0.5 text-[10.5px] font-medium text-slate-500">
                              {order.created_at ? formatDate(order.created_at) : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-[12.5px] font-black text-slate-900">
                              {formatIDR(Number(order.total_amount) || 0)}
                            </p>

                            <Badge className={`mt-1 ${config.className}`}>{config.label}</Badge>
                          </div>

                          {order.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-8 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold hover:bg-emerald-700"
                                onClick={() => handleStatusUpdate(order.id, "completed")}
                              >
                                Selesai
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg px-3 text-[11px] font-bold"
                                onClick={() => handleStatusUpdate(order.id, "cancelled")}
                              >
                                Batal
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vendor Menu */}
          <div className="flex min-h-[230px] flex-col rounded-[20px] border border-slate-200/70 bg-white p-3.5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] sm:p-4 lg:min-h-0">
            <div className="mb-3 shrink-0">
              <h2 className="text-[16px] font-black tracking-tight text-slate-900">Menu Vendor</h2>

              <p className="mt-0.5 text-[11.5px] font-medium text-slate-500">
                Akses cepat untuk aktivitas utama toko.
              </p>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              <VendorMenuCard
                title="Scan QR Pickup"
                desc="Verifikasi pickup penerima"
                href="/dashboard/scan-qr"
                icon={QrCode}
                iconWrapClass="bg-indigo-50"
                iconClass="text-indigo-600"
                borderClass="border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/40"
              />

              <VendorMenuCard
                title="Kelola Produk"
                desc="Tambah & edit produk toko"
                href="/dashboard/kelola-produk"
                icon={Boxes}
                iconWrapClass="bg-orange-50"
                iconClass="text-orange-600"
                borderClass="border-orange-200 hover:border-orange-300 hover:bg-orange-50/40"
              />

              <VendorMenuCard
                title="Riwayat Pencairan"
                desc="Riwayat pencairan dana"
                href="/dashboard/settlement"
                icon={ReceiptText}
                iconWrapClass="bg-violet-50"
                iconClass="text-violet-600"
                borderClass="border-violet-200 hover:border-violet-300 hover:bg-violet-50/40"
              />

              <VendorMenuCard
                title="Tarik Dana"
                desc={`Saldo: ${formatIDR(walletBalance)}`}
                onClick={() => setWithdrawModalOpen(true)}
                icon={BanknoteArrowDown}
                iconWrapClass="bg-emerald-50"
                iconClass="text-emerald-600"
                borderClass="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/40"
                disabled={!canWithdraw}
              />
            </div>
          </div>
        </section>
      </div>

      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="rounded-[22px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-black text-slate-900">Tarik Dana</DialogTitle>

            <DialogDescription className="text-sm leading-6 text-slate-500">
              Masukkan nominal penarikan dana dari saldo toko Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-[16px] border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold text-slate-500">Saldo tersedia</p>

              <p className="mt-1 text-2xl font-black tracking-tight text-emerald-700">
                {formatIDR(walletBalance)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Minimum penarikan {formatIDR(MIN_WITHDRAWAL)}
              </p>
            </div>

            <div>
              <label
                htmlFor="withdrawAmount"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Nominal Penarikan
              </label>

              <Input
                id="withdrawAmount"
                type="number"
                min={MIN_WITHDRAWAL}
                max={walletBalance}
                placeholder="Contoh: 50000"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setWithdrawModalOpen(false)}
                disabled={withdrawLoading}
              >
                Batal
              </Button>

              <Button
                className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                onClick={handleWithdraw}
                disabled={withdrawLoading}
              >
                {withdrawLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proses Penarikan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
