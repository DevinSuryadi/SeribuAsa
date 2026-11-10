import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
import { listVendorFacilityOrders, type FacilityOrder } from "@/services/facility-orders";
import { listVendorFacilityPayouts, type FacilityPayout } from "@/services/facility-payouts";
import { requestWithdrawal } from "@/services/vendor-wallet";
import { toast } from "sonner";
import { useVendorData } from "@/hooks/useVendorData";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { PageSkeleton } from "@/components/dashboard/LoadingSkeleton";
import foto from "@/assets/hero-vendorDashboard.svg";

const MIN_WITHDRAWAL = 50000;
const REVENUE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const FACILITY_ORDERS_PATH = "/dashboard/vendor/facility-orders";
const ALLOCATIONS_PATH = "/dashboard/vendor/facility-payouts";

const tileClass = "block rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none";
const whiteCardClass = "bg-white ring-1 ring-black/[0.06]";

function orderStatus(order: FacilityOrder) {
  if (order.status === "pending") return { label: "Menunggu proses", className: "text-[#B45309]" };
  if (order.status === "processing") {
    return order.receipt_status === "discrepancy"
      ? { label: "Barang bermasalah", className: "text-[#C81E1E]" }
      : { label: "Dalam pengiriman", className: "text-[#1D4ED8]" };
  }
  if (order.status === "received") return { label: "Diterima Faskes", className: "text-[#0B6B4F]" };
  return { label: "Sudah disalurkan", className: "text-[#0B6B4F]" };
}

function itemSummary(order: FacilityOrder) {
  return order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ");
}

export default function VendorDashboard() {
  const { user } = useAuth();

  const {
    data: { wallet },
    loading,
    error,
    refetch,
  } = useVendorData();

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [payouts, setPayouts] = useState<FacilityPayout[]>([]);
  const [facilityLoading, setFacilityLoading] = useState(true);
  const [facilityError, setFacilityError] = useState("");

  const loadFacilityData = useCallback(async () => {
    const [orderRows, payoutRows] = await Promise.all([listVendorFacilityOrders(), listVendorFacilityPayouts()]);
    setOrders(orderRows);
    setPayouts(payoutRows);
  }, []);

  const loadInitialFacilityData = useCallback(async () => {
    setFacilityLoading(true);
    try {
      await loadFacilityData();
      setFacilityError("");
    } catch (err: unknown) {
      setFacilityError(err instanceof Error ? err.message : "Gagal memuat pesanan faskes");
    } finally {
      setFacilityLoading(false);
    }
  }, [loadFacilityData]);

  useEffect(() => {
    if (user) void loadInitialFacilityData();
  }, [user, loadInitialFacilityData]);

  useSmartPolling(loadFacilityData, { interval: 30000, enabled: !!user });

  const allocatedRecently = useMemo(() => {
    const since = Date.now() - REVENUE_WINDOW_MS;
    return payouts
      .filter((payout) => payout.status === "paid" && payout.paid_at && new Date(payout.paid_at).getTime() >= since)
      .reduce((sum, payout) => sum + Number(payout.amount), 0);
  }, [payouts]);

  const unpaidPayouts = useMemo(() => payouts.filter((payout) => payout.status !== "paid"), [payouts]);

  const pendingCount = useMemo(() => orders.filter((order) => order.status === "pending").length, [orders]);
  const issueCount = useMemo(
    () => orders.filter((order) => order.status === "processing" && order.receipt_status === "discrepancy").length,
    [orders]
  );
  const toHandle = pendingCount + issueCount;
  const toHandleNote = [
    pendingCount ? `${pendingCount} menunggu proses` : "",
    issueCount ? `${issueCount} barang bermasalah` : "",
  ].filter(Boolean).join(" · ") || "Tidak ada yang perlu ditangani";

  // Cancelled orders need nothing from the vendor, so they only stay on the orders page.
  const recentOrders = useMemo(
    () => orders.filter((order) => order.status !== "cancelled").slice(0, 6),
    [orders]
  );

  const walletBalance = wallet?.balance || 0;
  const canWithdraw = walletBalance >= MIN_WITHDRAWAL;

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

  if ((loading && !wallet) || facilityLoading) {
    return (
      <DashboardLayout title="Ringkasan" subtitle="Memuat data toko Anda...">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (error || facilityError) {
    return (
      <DashboardLayout title="Ringkasan" subtitle="Saldo dan pesanan toko Anda.">
        <ErrorState
          message={error || facilityError}
          onRetry={() => {
            void refetch();
            void loadInitialFacilityData();
          }}
        />
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
                <Link to="/dashboard/vendor/facility-orders">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Pesanan Faskes
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
        </div>
        <Button
          className="w-full rounded-full bg-[#0B6B4F] px-7 font-bold text-white hover:bg-[#095A43] md:w-auto lg:w-full"
          onClick={() => setWithdrawModalOpen(true)}
          disabled={!canWithdraw}
        >
          Tarik dana
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          to={FACILITY_ORDERS_PATH}
          aria-label={`${toHandle} pesanan perlu ditangani`}
          className={`${tileClass} ${toHandle > 0 ? "bg-[#FFC53D] text-[#1A1A1A]" : `${whiteCardClass} text-slate-900`}`}
        >
          <span className="block text-sm font-semibold">Perlu ditangani</span>
          <span className="mt-2 block text-[32px] font-bold leading-none tracking-tight tabular-nums">{toHandle}</span>
          <span className={`mt-2 block truncate text-[13px] ${toHandle > 0 ? "text-[#1A1A1A]/75" : "text-slate-500"}`}>{toHandleNote}</span>
        </Link>
        <Link to={ALLOCATIONS_PATH} className={`${tileClass} ${whiteCardClass} text-slate-900`}>
          <span className="block text-sm font-semibold">Dana masuk 30 hari</span>
          <span className="mt-2 block break-words text-[32px] font-bold leading-none tracking-tight tabular-nums">{formatIDR(allocatedRecently)}</span>
          <span className="mt-2 block text-[13px] text-slate-500">Sudah dialokasikan sistem</span>
        </Link>
        <Link to={ALLOCATIONS_PATH} className={`${tileClass} ${whiteCardClass} text-slate-900`}>
          <span className="block text-sm font-semibold">Menunggu alokasi</span>
          <span className="mt-2 block break-words text-[32px] font-bold leading-none tracking-tight tabular-nums">
            {formatIDR(unpaidPayouts.reduce((sum, payout) => sum + Number(payout.amount), 0))}
          </span>
          <span className="mt-2 block text-[13px] text-slate-500">{unpaidPayouts.length} pesanan</span>
        </Link>
      </section>

      <section className={`overflow-hidden rounded-2xl ${whiteCardClass}`}>
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Pesanan Terbaru</h2>
          <Link to={FACILITY_ORDERS_PATH} className="text-sm font-semibold text-[#0B6B4F] hover:underline">
            Lihat semua
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-slate-500">Pesanan dari fasilitas kesehatan akan muncul di sini.</p>
        ) : (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {recentOrders.map((order) => {
              const status = orderStatus(order);
              return (
                <li key={order.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_110px_150px_76px]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{order.health_facility_name || "Faskes"}</p>
                    <p className="text-[13px] text-slate-500">{formatDate(order.created_at)}</p>
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
                                Konfirmasi penerimaan
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
                title="Pesanan Faskes"
                desc="Konfirmasi dan kirim pesanan"
                href="/dashboard/vendor/facility-orders"
                icon={ShoppingBag}
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
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">Tarik dana</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Saldo tersedia {formatIDR(walletBalance)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="withdrawAmount" className="block text-[13px] font-semibold text-slate-700">Nominal</label>
              <Input
                id="withdrawAmount"
                type="number"
                min={MIN_WITHDRAWAL}
                max={walletBalance}
                placeholder={`Minimum ${formatIDR(MIN_WITHDRAWAL)}`}
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                className="h-11 rounded-xl text-[15px] font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setWithdrawModalOpen(false)}
                disabled={withdrawLoading}
              >
                Batal
              </Button>
              <Button className="rounded-full bg-[#0B6B4F] px-5 font-bold hover:bg-[#095A43]" onClick={handleWithdraw} disabled={withdrawLoading}>
                {withdrawLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
