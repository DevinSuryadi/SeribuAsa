import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Pause,
  Play,
  XCircle,
  Pencil,
  Heart,
  Wallet,
  QrCode,
  Landmark,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import {
  getSubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  reactivateSubscription,
  upgradeSubscription,
  changePaymentMethod,
  updateSubscriptionAmount,
  getUpgradePlans,
  type Subscription,
  type UpgradePlan,
} from "@/services/subscriptions";
import { toast } from "sonner";

const paymentMethods = [
  { id: "qris", label: "QRIS", icon: QrCode },
  { id: "va_bca", label: "VA BCA", icon: Landmark },
  { id: "va_mandiri", label: "VA Mandiri", icon: Landmark },
  { id: "gopay", label: "GoPay", icon: Wallet },
  { id: "cc", label: "Kartu Kredit", icon: CreditCard },
];

const DonorLangganan = () => {
  const { user } = useAuth();
  const [showCancel, setShowCancel] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAmount, setShowAmount] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [upgradePlans, setUpgradePlans] = useState<UpgradePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscriptions and plans
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsData, plansData] = await Promise.all([
        getSubscriptions(),
        getUpgradePlans().catch(() => []),
      ]);
      setSubscriptions(subsData);
      setUpgradePlans(plansData);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data langganan");
      toast.error("Gagal memuat data", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Show the latest non-cancelled subscription as the current managed subscription.
  const activeSubscription = useMemo(() => {
    if (subscriptions.length === 0) return null;
    return subscriptions.find((s) => s.status !== "cancelled") || subscriptions[0];
  }, [subscriptions]);

  const getSubscriptionLabel = (planName?: string | null) => {
    if (!planName || planName.trim().toLowerCase() === "custom subscription") {
      return "Donasi Bulanan";
    }
    return planName;
  };

  const currentPlan = useMemo(() => {
    if (!activeSubscription)
      return { name: "Belum ada langganan", price: 0 };
    return {
      name: getSubscriptionLabel(activeSubscription.plan_name),
      price: activeSubscription.amount,
    };
  }, [activeSubscription]);

  const totalPaid = useMemo(
    () =>
      subscriptions
        .filter((s) => s.status !== "cancelled")
        .reduce((sum, s) => sum + s.amount, 0),
    [subscriptions]
  );

  const currentPaymentMethod = useMemo(() => {
    if (!activeSubscription) return "qris";
    return activeSubscription.payment_method || "qris";
  }, [activeSubscription]);

  const currentMethodLabel =
    paymentMethods.find((m) => m.id === currentPaymentMethod)?.label || "QRIS";

  // Action handlers with real API
  const handlePauseResume = async () => {
    if (!activeSubscription) return;

    setActionLoading(true);
    try {
      if (activeSubscription.status === "paused") {
        await resumeSubscription(activeSubscription.id);
        toast.success("Langganan dilanjutkan", {
          description: "Pembayaran akan diproses sesuai jadwal",
        });
      } else {
        await pauseSubscription(activeSubscription.id);
        toast.info("Langganan dijeda", {
          description: "Pembayaran sementara dihentikan",
        });
      }
      await fetchData(); // Refresh data
    } catch (err: any) {
      toast.error("Gagal mengubah status", { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (plan: UpgradePlan) => {
    if (!activeSubscription) return;

    setActionLoading(true);
    try {
      await upgradeSubscription(activeSubscription.id, plan.id);
      toast.success(`Berhasil upgrade ke ${plan.name}!`, {
        description: `Tagihan berikutnya: ${formatIDR(plan.price)}/bulan`,
      });
      setShowUpgrade(false);
      await fetchData();
    } catch (err: any) {
      toast.error("Gagal upgrade", { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePayment = async () => {
    if (!activeSubscription || !selectedPayment) return;

    setActionLoading(true);
    try {
      await changePaymentMethod(activeSubscription.id, selectedPayment);
      const method = paymentMethods.find((m) => m.id === selectedPayment);
      toast.success("Metode pembayaran diubah", {
        description: `Sekarang menggunakan ${method?.label}`,
      });
      setShowPayment(false);
      await fetchData();
    } catch (err: any) {
      toast.error("Gagal mengubah metode", { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openAmountDialog = () => {
    if (!activeSubscription) return;
    setDraftAmount(String(Math.round(Number(activeSubscription.amount))));
    setShowAmount(true);
  };

  const handleUpdateAmount = async () => {
    if (!activeSubscription) return;

    const nextAmount = Number(draftAmount);
    if (!Number.isFinite(nextAmount) || nextAmount < 10000) {
      toast.error("Jumlah minimal Rp 10.000");
      return;
    }

    setActionLoading(true);
    try {
      await updateSubscriptionAmount(activeSubscription.id, nextAmount);
      toast.success("Nominal langganan diperbarui", {
        description: `Donasi bulanan berikutnya menjadi ${formatIDR(nextAmount)}`,
      });
      setShowAmount(false);
      await fetchData();
    } catch (err: any) {
      toast.error("Gagal memperbarui nominal", { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeSubscription) return;

    setActionLoading(true);
    try {
      await cancelSubscription(activeSubscription.id);
      toast.warning("Langganan dibatalkan", {
        description: "Langganan akan berakhir di akhir periode berjalan",
      });
      setShowCancel(false);
      await fetchData();
    } catch (err: any) {
      toast.error("Gagal membatalkan", { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!activeSubscription) return;

    setActionLoading(true);
    try {
      await reactivateSubscription(activeSubscription.id);
      toast.success("Langganan diaktifkan kembali!", {
        description: "Pembayaran akan dilanjutkan sesuai jadwal",
      });
      await fetchData();
    } catch (err: any) {
      toast.error("Gagal mengaktifkan", { description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Determine status badge
  const statusBadge = useMemo(() => {
    if (!activeSubscription) {
      return {
        label: "Tidak Aktif",
        cls: "bg-secondary text-muted-foreground border-border",
      };
    }

    switch (activeSubscription.status) {
      case "cancelled":
        return { label: "Dibatalkan", cls: "bg-red-100 text-red-700 border-red-200" };
      case "paused":
        return { label: "Dijeda", cls: "bg-amber-100 text-amber-700 border-amber-200" };
      case "active":
        return { label: "Aktif", cls: "bg-green-100 text-green-700 border-green-200" };
      default:
        return {
          label: "Tidak Aktif",
          cls: "bg-secondary text-muted-foreground border-border",
        };
    }
  }, [activeSubscription]);

  const isCancelled = activeSubscription?.status === "cancelled";
  const isPaused = activeSubscription?.status === "paused";
  const isActive = activeSubscription?.status === "active";

  const displayedSubscriptions = showAllHistory
    ? subscriptions
    : subscriptions.slice(0, 3);

  if (loading) {
    return (
      <DashboardLayout title="Kelola Langganan" subtitle="Atur langganan donasi bulanan Anda.">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-secondary" />
              <div className="space-y-2">
                <div className="h-4 w-40 bg-secondary rounded" />
                <div className="h-3 w-28 bg-secondary rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-secondary rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Kelola Langganan" subtitle="Atur langganan donasi bulanan Anda.">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">Gagal memuat data</h3>
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="border-red-300 text-red-700"
            >
              <RefreshCw className="mr-2 h-3 w-3" /> Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kelola Langganan" subtitle="Atur langganan donasi bulanan Anda.">
      <div className="space-y-5">
        {/* Active Plan Card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {currentPlan.name}
                  </h2>

                  <Badge
                    variant="outline"
                    className={`w-fit gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.cls}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusBadge.label}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight text-emerald-700">
                    {currentPlan.price > 0 ? formatIDR(currentPlan.price) : "—"}
                  </p>

                  {currentPlan.price > 0 && (
                    <span className="text-sm font-medium text-muted-foreground">
                      / bulan
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {activeSubscription
                    ? `Dimulai sejak ${formatDate(activeSubscription.created_at)}`
                    : "Belum ada langganan aktif"}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-fit rounded-lg px-4 text-sm font-semibold"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                Detail Langganan
                <ChevronRight
                  className={`ml-2 h-4 w-4 transition-transform ${
                    showDetails ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </Button>
            </div>

            {showDetails && (
              <div className="mt-6 border-t border-border pt-5">
                <div className="divide-y divide-border">
                  {[
                    {
                      label: "Metode Pembayaran",
                      value: currentMethodLabel,
                    },
                    {
                      label: "Pembayaran Berikutnya",
                      value: isCancelled
                        ? "—"
                        : activeSubscription?.next_billing_date
                          ? formatDate(activeSubscription.next_billing_date)
                          : "—",
                    },
                    {
                      label: "Total Dibayar",
                      value: totalPaid > 0 ? formatIDR(totalPaid) : "—",
                      helper:
                        totalPaid > 0
                          ? `${subscriptions.filter((s) => s.status !== "cancelled").length} transaksi`
                          : undefined,
                    },
                    {
                      label: "Status Langganan",
                      value: isCancelled
                        ? "Langganan dibatalkan"
                        : isPaused
                          ? "Langganan sedang dijeda"
                          : isActive
                            ? "Langganan berjalan normal"
                            : "Belum aktif",
                      helper: isCancelled
                        ? "Akan berakhir di akhir periode berjalan"
                        : isPaused
                          ? "Pembayaran otomatis dihentikan sementara"
                          : isActive
                            ? "Pembayaran otomatis aktif"
                            : undefined,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="grid gap-1 py-4 sm:grid-cols-[550px_1fr] sm:items-start"
                    >
                      <p className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </p>

                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.value}
                        </p>
                        {item.helper && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.helper}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {isActive && (
                <>
                  <Button
                    size="sm"
                    className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                    onClick={() => setShowUpgrade(true)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Tingkatkan Langganan"
                    )}
                  </Button>

                  <Button
                    size="sm"
                    className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                    onClick={openAmountDialog}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4 mr-2" />
                    )}
                    Edit Nominal
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-lg px-4 text-sm font-semibold"
                    onClick={() => {
                      setSelectedPayment(currentPaymentMethod);
                      setShowPayment(true);
                    }}
                    disabled={actionLoading}
                  >
                    Ganti Metode Pembayaran
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-lg px-4 text-sm font-semibold"
                    onClick={handlePauseResume}
                    disabled={actionLoading}
                  >
                    Jeda Langganan
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 sm:ml-auto"
                    onClick={() => setShowCancel(true)}
                    disabled={actionLoading}
                  >
                    Batalkan Langganan
                  </Button>
                </>
              )}

              {isPaused && (
                <>
                  <Button
                    size="sm"
                    className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                    onClick={handlePauseResume}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Lanjutkan Langganan
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setShowCancel(true)}
                    disabled={actionLoading}
                  >
                    Batalkan Langganan
                  </Button>
                </>
              )}

              {isCancelled && (
                <Button
                  size="sm"
                  className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                  onClick={handleReactivate}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Aktifkan Kembali
                </Button>
              )}

              {!activeSubscription && (
                <p className="text-sm text-muted-foreground">
                  Anda belum memiliki langganan aktif.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Riwayat Pembayaran
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Daftar transaksi langganan Anda.
            </p>
          </div>

          {subscriptions.length === 0 ? (
            <div className="border-t border-border px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>

              <p className="mb-1 text-sm font-semibold text-foreground">
                Belum ada riwayat pembayaran
              </p>
              <p className="text-xs text-muted-foreground">
                Riwayat akan muncul setelah Anda memiliki langganan aktif.
              </p>
            </div>
          ) : (
            <>
              <div className="mx-5 border-t border-border sm:mx-6">
                {/* Table Header */}
                <div className="hidden grid-cols-[180px_260px_160px_minmax(0,1fr)_120px] gap-6 border-b border-border py-3 text-sm font-semibold text-muted-foreground md:grid">
                  <div>Tanggal</div>
                  <div>Langganan</div>
                  <div>Nominal</div>
                  <div className="col-start-5 text-center">Status</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border">
                  {displayedSubscriptions.map((sub) => {
                    const statusLabel =
                      sub.status === "active"
                        ? "Berhasil"
                        : sub.status === "paused"
                          ? "Dijeda"
                          : "Dibatalkan";

                    const statusClass =
                      sub.status === "active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : sub.status === "paused"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-red-100 text-red-700 border-red-200";

                    return (
                      <div
                        key={sub.id}
                        className="grid gap-3 py-3 md:grid-cols-[180px_260px_160px_minmax(0,1fr)_120px] md:items-center md:gap-6"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatDate(sub.created_at)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {getSubscriptionLabel(sub.plan_name)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatIDR(sub.amount)}
                          </p>
                        </div>

                        <div className="md:col-start-5 md:justify-self-center">
                          <Badge
                            variant="outline"
                            className={`rounded-md border px-3 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {subscriptions.length > 3 && (
                <div className="border-t border-border px-5 py-4 text-center sm:px-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-sm font-semibold text-emerald-700 hover:bg-green-50 hover:text-emerald-800"
                    onClick={() => setShowAllHistory((prev) => !prev)}
                  >
                    {showAllHistory ? "Tampilkan lebih sedikit" : "Lihat lebih banyak"}
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        showAllHistory ? "-rotate-90" : "rotate-90"
                      }`}
                    />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tingkatkan Langganan</DialogTitle>
            <DialogDescription>
              Pilih paket yang lebih tinggi untuk dampak lebih besar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {upgradePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada paket yang dapat ditingkatkan saat ini.
              </p>
            ) : (
              upgradePlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleUpgrade(plan)}
                  disabled={actionLoading}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all text-left disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white">
                    <Heart className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {plan.description}
                    </div>
                    <div className="text-sm font-bold mt-0.5 text-rose-600">
                      {formatIDR(plan.price)}/bulan
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Amount Dialog */}
      <Dialog open={showAmount} onOpenChange={setShowAmount}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Nominal Langganan</DialogTitle>
            <DialogDescription>
              Masukkan nominal donasi bulanan baru. Perubahan berlaku untuk pembayaran berikutnya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-semibold">
                Nominal Bulanan
              </Label>
              <input
                type="number"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                min="10000"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Minimal donasi bulanan Rp 10.000.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAmount(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleUpdateAmount}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ganti Metode Pembayaran</DialogTitle>
            <DialogDescription>
              Pilih metode pembayaran baru untuk langganan Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">
                Metode Pembayaran
              </Label>
              <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <m.icon className="h-4 w-4" />
                        {m.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPayment(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleChangePayment}
                disabled={
                  !selectedPayment ||
                  selectedPayment === currentPaymentMethod ||
                  actionLoading
                }
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Batalkan Langganan?</DialogTitle>
            <DialogDescription>
              Langganan Anda akan dihentikan di akhir periode yang sudah dibayar.
              Anak yang Anda bantu mungkin kehilangan dukungan nutrisi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCancel(false)}
            >
              Tidak, Tetap Lanjut
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ya, Batalkan"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DonorLangganan;
