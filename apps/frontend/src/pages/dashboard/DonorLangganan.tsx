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
  ArrowUp,
  Baby,
  CheckCircle,
  Heart,
  Wallet,
  QrCode,
  Landmark,
  AlertCircle,
  RefreshCw,
  Calendar,
  TrendingUp,
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
  const [selectedPayment, setSelectedPayment] = useState("");
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
        getUpgradePlans().catch(() => []), // Graceful fallback if plans endpoint not ready
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

  // Get active subscription (first active one, or first one if none active)
  const activeSubscription = useMemo(() => {
    if (subscriptions.length === 0) return null;
    const active = subscriptions.find((s) => s.status === "active");
    return active || subscriptions[0];
  }, [subscriptions]);

  const currentPlan = useMemo(() => {
    if (!activeSubscription) return { name: "Belum ada langganan", price: 0, icon: Baby };
    return {
      name:
        activeSubscription.plan_name || `Langganan ${formatIDR(activeSubscription.amount)}/bulan`,
      price: activeSubscription.amount,
      icon: Baby,
    };
  }, [activeSubscription]);

  const totalPaid = useMemo(
    () =>
      subscriptions.filter((s) => s.status !== "cancelled").reduce((sum, s) => sum + s.amount, 0),
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
        toast.info("Langganan dijeda", { description: "Pembayaran sementara dihentikan" });
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
      return { label: "Tidak Aktif", cls: "bg-secondary text-muted-foreground border-border" };
    }

    switch (activeSubscription.status) {
      case "cancelled":
        return { label: "Dibatalkan", cls: "bg-red-100 text-red-700 border-red-200" };
      case "paused":
        return { label: "Dijeda", cls: "bg-amber-100 text-amber-700 border-amber-200" };
      case "active":
        return { label: "Aktif", cls: "bg-green-100 text-green-700 border-green-200" };
      default:
        return { label: "Tidak Aktif", cls: "bg-secondary text-muted-foreground border-border" };
    }
  }, [activeSubscription]);

  const isCancelled = activeSubscription?.status === "cancelled";
  const isPaused = activeSubscription?.status === "paused";
  const isActive = activeSubscription?.status === "active";

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

  const PlanIcon = currentPlan.icon;

  return (
    <DashboardLayout title="Kelola Langganan" subtitle="Atur langganan donasi bulanan Anda.">
      <div className="space-y-5">
        {/* Active Plan Card */}
        <div
          className={`rounded-2xl border p-5 ${isCancelled ? "border-red-200 bg-red-50/40" : activeSubscription ? "border-rose-200 bg-rose-50/30" : "border-border bg-card"}`}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isCancelled ? "bg-red-100" : "bg-rose-100"}`}
              >
                <PlanIcon className={`h-6 w-6 ${isCancelled ? "text-red-600" : "text-rose-600"}`} />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{currentPlan.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {activeSubscription
                    ? `Sejak ${formatDate(activeSubscription.created_at)}`
                    : "Belum ada langganan aktif"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`border text-xs ${statusBadge.cls}`}>
              {statusBadge.label}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              {
                icon: Heart,
                label: "Jumlah",
                value: currentPlan.price > 0 ? `${formatIDR(currentPlan.price)}/bln` : "—",
                color: "text-rose-600",
                bg: "bg-rose-50",
              },
              {
                icon: CreditCard,
                label: "Metode",
                value: currentMethodLabel,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Calendar,
                label: "Pembayaran Berikutnya",
                value: isCancelled
                  ? "—"
                  : activeSubscription?.next_billing_date
                    ? formatDate(activeSubscription.next_billing_date)
                    : "—",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: TrendingUp,
                label: "Total Dibayar",
                value: totalPaid > 0 ? formatIDR(totalPaid) : "—",
                color: "text-green-600",
                bg: "bg-green-50",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`rounded-xl p-3 ${s.bg} flex items-center gap-2.5`}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className={`text-sm font-bold truncate ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {isActive && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={handlePauseResume}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isPaused ? (
                    <Play className="h-3.5 w-3.5" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                  {isPaused ? "Lanjutkan" : "Jeda"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setShowUpgrade(true)}
                  disabled={actionLoading}
                >
                  <ArrowUp className="h-3.5 w-3.5" /> Upgrade
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setSelectedPayment(currentPaymentMethod);
                    setShowPayment(true);
                  }}
                  disabled={actionLoading}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Ganti Metode
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowCancel(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="h-3.5 w-3.5" /> Batalkan
                </Button>
              </>
            )}
            {isCancelled && (
              <Button
                size="sm"
                className="gap-1.5 bg-rose-600 hover:bg-rose-700"
                onClick={handleReactivate}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Aktifkan Kembali
              </Button>
            )}
            {!activeSubscription && (
              <p className="text-sm text-muted-foreground">Anda belum memiliki langganan aktif.</p>
            )}
          </div>
        </div>

        {/* Billing History */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Riwayat Pembayaran</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {subscriptions.length === 0 ? (
              <div className="text-center py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mx-auto mb-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Belum ada riwayat pembayaran
                </p>
                <p className="text-xs text-muted-foreground">
                  Riwayat akan muncul setelah Anda memiliki langganan aktif
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${sub.status === "active" ? "bg-green-100" : sub.status === "paused" ? "bg-amber-100" : "bg-red-100"}`}
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${sub.status === "active" ? "text-green-600" : sub.status === "paused" ? "text-amber-600" : "text-red-600"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {sub.plan_name || "Donasi Langganan"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(sub.created_at)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-foreground">
                        {formatIDR(sub.amount)}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] border ${
                          sub.status === "active"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : sub.status === "paused"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {sub.status === "active"
                          ? "Aktif"
                          : sub.status === "paused"
                            ? "Dijeda"
                            : "Dibatalkan"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Upgrade Langganan</DialogTitle>
            <DialogDescription>
              Pilih paket yang lebih tinggi untuk dampak lebih besar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {upgradePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada paket upgrade tersedia saat ini.
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
                    <div className="text-xs text-muted-foreground">{plan.description}</div>
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
              <Label className="text-sm font-semibold mb-1.5 block">Metode Pembayaran</Label>
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
              <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleChangePayment}
                disabled={
                  !selectedPayment || selectedPayment === currentPaymentMethod || actionLoading
                }
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
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
              Langganan Anda akan dihentikan di akhir periode yang sudah dibayar. Anak yang Anda
              bantu mungkin kehilangan dukungan nutrisi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancel(false)}>
              Tidak, Tetap Lanjut
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Batalkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DonorLangganan;
