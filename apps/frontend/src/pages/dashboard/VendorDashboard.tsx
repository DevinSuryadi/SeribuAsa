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
import { Loader2 } from "lucide-react";
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
  if (order.status === "processing" || order.status === "shipped") {
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
    <DashboardLayout title={`Toko ${user?.fullName || "Vendor"}`} subtitle="Saldo dan pesanan toko Anda.">
      <section className="grid grid-cols-1 items-center gap-4 rounded-2xl bg-[#E6F4EC] px-6 py-3 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,0.95fr)_minmax(230px,0.75fr)_180px]">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0B6B4F]">Saldo tersedia</p>
          <p className="mt-1 break-words text-[32px] font-bold leading-none tracking-tight text-[#0B6B4F] tabular-nums">
            {formatIDR(walletBalance)}
          </p>
          {!canWithdraw && (
            <p className="mt-2 text-[13px] text-slate-600">Minimum penarikan {formatIDR(MIN_WITHDRAWAL)}</p>
          )}
        </div>
        <div className="pointer-events-none hidden h-full items-end justify-center lg:flex">
          <img
            src={foto}
            alt="Ilustrasi toko vendor"
            className="h-[88px] w-full object-contain object-center"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
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
                  <p className="hidden truncate text-[13px] text-slate-600 md:block" title={itemSummary(order)}>{itemSummary(order)}</p>
                  <p className="text-right font-bold text-slate-900 tabular-nums">{formatIDR(Number(order.total_amount) || 0)}</p>
                  <p className={`text-[13px] font-semibold ${status.className}`}>{status.label}</p>
                  <div className="justify-self-end">
                    {order.status === "pending" && (
                      <Button size="sm" className="h-8 rounded-full bg-[#0B6B4F] px-3 text-[13px] font-bold hover:bg-[#095A43]" asChild>
                        <Link to={FACILITY_ORDERS_PATH}>Proses</Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
