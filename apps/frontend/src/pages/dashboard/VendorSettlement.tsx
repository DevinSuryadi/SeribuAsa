import { useState, useEffect, useMemo, useCallback } from "react";
import type { ElementType } from "react";
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
  CreditCard,
  Download,
  Wallet,
  Calendar,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  Clock3,
  Landmark,
  ArrowRight,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import {
  requestSettlementPayout,
  exportSettlements,
} from "@/services/settlements";
import type { Settlement } from "@/services/settlements";
import { getWalletBalance, requestWithdrawal } from "@/services/vendor-wallet";
import type { WalletBalance } from "@/services/vendor-wallet";
import { triggerDownload } from "@/services/downloads";
import type { SettlementReport } from "@/services/reports";
import { getSettlementReport } from "@/services/reports";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";
import { useVendorSettlement } from "@/hooks/useVendorSettlement";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { CardSkeletonGrid } from "@/components/dashboard/LoadingSkeleton";
import { settlementStatusConfig } from "@/lib/status-config";

interface VendorProfile {
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
}

type ViewFilter = "all" | "paid" | "ready" | "processing" | "calculating";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ElementType;
  iconWrapClass: string;
  iconClass: string;
  valueClass: string;
  borderClass: string;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconWrapClass,
  iconClass,
  valueClass,
  borderClass,
}: StatCardProps) {
  return (
    <div
      className={`flex h-full min-h-[104px] rounded-[18px] border bg-white px-3.5 py-3.5 shadow-[0_7px_18px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.055)] ${borderClass}`}
    >
      <div className="flex w-full items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${iconWrapClass}`}
        >
          <Icon className={`h-[17px] w-[17px] ${iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`break-words text-[22px] font-black leading-none tracking-tight sm:text-[24px] ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-[12px] font-bold leading-tight text-slate-700">
            {title}
          </p>

          <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

type InsightCardProps = {
  title: string;
  value: string;
  icon: ElementType;
  iconWrapClass: string;
  iconClass: string;
  valueClass: string;
};

function InsightCard({
  title,
  value,
  icon: Icon,
  iconWrapClass,
  iconClass,
  valueClass,
}: InsightCardProps) {
  return (
    <div className="flex h-full min-h-[74px] rounded-[17px] border border-slate-200/70 bg-white px-3.5 py-3 shadow-[0_7px_18px_rgba(15,23,42,0.035)]">
      <div className="flex w-full items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${iconWrapClass}`}
        >
          <Icon className={`h-[17px] w-[17px] ${iconClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`break-words text-[21px] font-black leading-none tracking-tight sm:text-[22px] ${valueClass}`}
          >
            {value}
          </p>
          <p className="mt-1 text-[11.5px] font-semibold text-slate-600">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    paid: "Sudah Cair",
    ready: "Siap Dicairkan",
    pending: "Menunggu Proses",
    processing: "Diproses",
    failed: "Gagal",
    cancelled: "Dibatalkan",
  };

  return labels[status] || "Menunggu Proses";
};

const VendorSettlement = () => {
  const { user } = useAuth();
  const { data: settlements, loading, error, refetch } = useVendorSettlement();

  const [report, setReport] = useState<SettlementReport | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null
  );
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] =
    useState<Settlement | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (!user) return;

    getSettlementReport(startDate, endDate)
      .then(setReport)
      .catch(() => {
        // Tidak wajib, halaman tetap bisa berjalan tanpa laporan analitik.
      });
  }, [startDate, endDate, user]);

  const fetchVendorProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await apiFetch(`/users/${user.id}`);
      setVendorProfile(data as VendorProfile);
    } catch {
      // Tidak wajib, fallback ke teks belum diatur.
    }
  }, [user?.id]);

  const fetchWalletBalance = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await getWalletBalance();
      setWalletBalance(data);
      setVendorProfile((prev) => ({
        bank_name: data.bank_name || prev?.bank_name,
        bank_account_number: data.bank_account_number || prev?.bank_account_number,
        bank_account_holder: data.bank_account_holder || prev?.bank_account_holder,
      }));
    } catch {
      // Halaman tetap bisa menampilkan riwayat pencairan lama.
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVendorProfile();
    fetchWalletBalance();
  }, [fetchVendorProfile, fetchWalletBalance]);

  const totalPaidCount = useMemo(
    () => settlements.filter((s) => s.status === "paid").length,
    [settlements]
  );

  const totalEarned = useMemo(() => {
    if (report?.summary?.settled_amount) return report.summary.settled_amount;

    return settlements
      .filter((s) => s.status === "paid" || s.status === "ready")
      .reduce((a, b) => a + (b.net_amount || 0), 0);
  }, [report, settlements]);

  const pendingCount = useMemo(() => {
    if (report?.summary?.pending_count) return report.summary.pending_count;

    return settlements.filter(
      (s) => s.status === "ready" || s.status === "processing" || s.status === "calculating"
    ).length;
  }, [report, settlements]);

  const pendingTotal = useMemo(() => {
    if (report?.summary?.pending_amount) return report.summary.pending_amount;

    return settlements
      .filter((s) => s.status === "ready" || s.status === "processing" || s.status === "calculating")
      .reduce((a, b) => a + (b.net_amount || 0), 0);
  }, [report, settlements]);

  const monthGrowth = report?.trends?.month_over_month_growth ?? 0;
  const avgSettlementTime = report?.trends?.average_settlement_time ?? 0;
  const successRate = report?.trends?.settlement_success_rate ?? 0;

  const filteredSettlements = useMemo(() => {
    if (viewFilter === "all") return settlements;
    return settlements.filter((s) => s.status === viewFilter);
  }, [settlements, viewFilter]);

  const handleClaim = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setShowClaimModal(true);
  };

  const handleClaimSubmit = async () => {
    if (!selectedSettlement) return;

    try {
      setClaimLoading(true);
      await requestSettlementPayout(selectedSettlement.id);

      toast.success(
        `Pencairan ${formatIDR(
          selectedSettlement.net_amount || 0
        )} diproses dalam 1-3 hari kerja.`
      );

      setShowClaimModal(false);
      setSelectedSettlement(null);
      refetch();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengajukan pencairan";
      toast.error(msg);
    } finally {
      setClaimLoading(false);
    }
  };

  const walletAvailable = walletBalance?.balance ?? 0;
  const minimumWithdrawal = walletBalance?.minimum_withdrawal_amount ?? 50000;
  const hasBankAccount = Boolean(
    vendorProfile?.bank_name &&
      vendorProfile?.bank_account_number &&
      vendorProfile?.bank_account_holder
  );
  const withdrawAmountValue = Number(withdrawAmount || 0);
  const canSubmitWithdrawal =
    hasBankAccount &&
    withdrawAmountValue >= minimumWithdrawal &&
    withdrawAmountValue <= walletAvailable;

  const openWithdrawModal = () => {
    setWithdrawAmount(walletAvailable > 0 ? String(Math.floor(walletAvailable)) : "");
    setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = async () => {
    if (!hasBankAccount) {
      toast.error("Lengkapi rekening bank di halaman profil terlebih dahulu.");
      return;
    }

    if (withdrawAmountValue < minimumWithdrawal) {
      toast.error(`Minimum pencairan adalah ${formatIDR(minimumWithdrawal)}.`);
      return;
    }

    if (withdrawAmountValue > walletAvailable) {
      toast.error("Nominal pencairan melebihi saldo wallet.");
      return;
    }

    try {
      setWithdrawLoading(true);
      await requestWithdrawal(withdrawAmountValue);
      toast.success("Pencairan berhasil diajukan ke rekening bank Anda.");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      await fetchWalletBalance();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengajukan pencairan";
      toast.error(msg);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleExport = async () => {
    if (settlements.length === 0) {
      toast.info("Tidak ada data pencairan untuk diunduh");
      return;
    }

    setExportLoading(true);

    try {
      const blob = await exportSettlements("csv", startDate, endDate);
      const dateStr = new Date().toISOString().split("T")[0];
      triggerDownload(blob, `laporan-pencairan-${dateStr}.csv`);
      toast.success("Laporan pencairan berhasil diunduh");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengunduh laporan";
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Riwayat Pencairan"
        subtitle="Riwayat pencairan dana voucher yang telah ditukarkan."
      >
        <div className="space-y-4">
          <CardSkeletonGrid count={6} columns={3} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Riwayat Pencairan"
        subtitle="Riwayat pencairan dana voucher yang telah ditukarkan."
      >
        <ErrorState message={error} onRetry={refetch} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Riwayat Pencairan"
      subtitle="Riwayat pencairan dana voucher yang telah ditukarkan."
    >
      <div className="flex min-h-[calc(100vh-132px)] w-full max-w-none flex-col gap-3 pb-3">
        {/* Ringkasan Utama */}
        <section className="grid w-full shrink-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Dicairkan"
            value={formatIDR(totalEarned)}
            subtitle={`${totalPaidCount} pencairan berhasil`}
            icon={Wallet}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
            valueClass="text-emerald-700"
            borderClass="border-emerald-100"
          />

          <StatCard
            title="Menunggu Cair"
            value={formatIDR(pendingTotal)}
            subtitle={`${pendingCount} pencairan aktif`}
            icon={Calendar}
            iconWrapClass="bg-amber-50"
            iconClass="text-amber-600"
            valueClass="text-amber-600"
            borderClass="border-amber-100"
          />

          <StatCard
            title="Rekening Tujuan"
            value={vendorProfile?.bank_name || "Belum diatur"}
            subtitle={
              vendorProfile?.bank_account_number
                ? `****${vendorProfile.bank_account_number.slice(-4)}`
                : "Lengkapi rekening di profil"
            }
            icon={Landmark}
            iconWrapClass={
              vendorProfile?.bank_account_number ? "bg-indigo-50" : "bg-red-50"
            }
            iconClass={
              vendorProfile?.bank_account_number
                ? "text-indigo-600"
                : "text-red-500"
            }
            valueClass={
              vendorProfile?.bank_account_number
                ? "text-indigo-700"
                : "text-red-500"
            }
            borderClass={
              vendorProfile?.bank_account_number
                ? "border-indigo-100"
                : "border-red-100"
            }
          />

          <StatCard
            title="Saldo Wallet"
            value={formatIDR(walletAvailable)}
            subtitle={`Minimum cair ${formatIDR(minimumWithdrawal)}`}
            icon={Clock3}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
            valueClass="text-emerald-700"
            borderClass="border-emerald-100"
          />
        </section>

        {/* Insight */}
        <section className="grid w-full shrink-0 grid-cols-1 items-stretch gap-3 md:grid-cols-3">
          <InsightCard
            title="Pertumbuhan Bulanan"
            value={`${monthGrowth.toFixed(1)}%`}
            icon={TrendingUp}
            iconWrapClass={monthGrowth >= 0 ? "bg-emerald-50" : "bg-red-50"}
            iconClass={monthGrowth >= 0 ? "text-emerald-600" : "text-red-500"}
            valueClass={monthGrowth >= 0 ? "text-emerald-700" : "text-red-500"}
          />

          <InsightCard
            title="Rata-rata Waktu Cair"
            value={`${avgSettlementTime.toFixed(1)} hari`}
            icon={Calendar}
            iconWrapClass="bg-indigo-50"
            iconClass="text-indigo-600"
            valueClass="text-indigo-700"
          />

          <InsightCard
            title="Tingkat Keberhasilan"
            value={`${successRate.toFixed(1)}%`}
            icon={ArrowUpRight}
            iconWrapClass="bg-emerald-50"
            iconClass="text-emerald-600"
            valueClass="text-emerald-700"
          />
        </section>

        {/* Filter dan Aksi */}
        <section className="w-full shrink-0 rounded-[18px] border border-slate-200/70 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[150px_150px]">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                  Dari
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] outline-none transition focus:border-indigo-300"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                  Sampai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] outline-none transition focus:border-indigo-300"
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:justify-end">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {[
                  { label: "Semua", value: "all" as ViewFilter },
                  { label: "Sudah Cair", value: "paid" as ViewFilter },
                  { label: "Siap Cair", value: "ready" as ViewFilter },
                  { label: "Diproses", value: "processing" as ViewFilter },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setViewFilter(item.value)}
                    className={`h-9 rounded-xl px-3 text-[11.5px] font-bold transition ${
                      viewFilter === item.value
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <Button
                onClick={openWithdrawModal}
                disabled={withdrawLoading || walletAvailable < minimumWithdrawal}
                className="h-9 rounded-xl bg-emerald-600 px-4 text-[11.5px] font-bold hover:bg-emerald-700"
              >
                {withdrawLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="mr-2 h-4 w-4" />
                )}
                Cairkan Dana
              </Button>

              <Button
                onClick={handleExport}
                disabled={exportLoading}
                className="h-9 rounded-xl bg-slate-900 px-4 text-[11.5px] font-bold hover:bg-slate-800"
              >
                {exportLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Unduh Laporan
              </Button>
            </div>
          </div>
        </section>

        {/* Daftar Pencairan */}
        <section className="flex w-full flex-1 flex-col rounded-[20px] border border-slate-200/70 bg-white p-3.5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] sm:p-4">
          <div className="mb-3 flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[16px] font-black tracking-tight text-slate-900">
                Daftar Pencairan
              </h2>
              <p className="mt-0.5 text-[11.5px] font-medium text-slate-500">
                {filteredSettlements.length} pencairan ditemukan
              </p>
            </div>
          </div>

          {filteredSettlements.length === 0 ? (
            <div className="flex min-h-[110px] flex-1 items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center">
              <div className="flex flex-col items-center sm:flex-row sm:gap-4 sm:text-left">
                <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 sm:mb-0">
                  <CreditCard className="h-5 w-5 text-slate-500" />
                </div>

                <div>
                  <p className="text-[16px] font-black tracking-tight text-slate-900">
                    Belum ada pencairan
                  </p>

                  <p className="mt-1 max-w-md text-[11.5px] leading-5 text-slate-500">
                    Riwayat pencairan akan muncul setelah ada penukaran voucher
                    yang berhasil diproses.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid flex-1 grid-cols-1 items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredSettlements.map((settlement) => {
                const statusMeta =
                  settlementStatusConfig[
                    settlement.status as keyof typeof settlementStatusConfig
                  ] || settlementStatusConfig.pending;

                const canClaim = settlement.status === "ready";
                const statusLabel = getStatusLabel(settlement.status);

                return (
                  <div
                    key={settlement.id}
                    className="rounded-[17px] border border-slate-200/80 bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-indigo-50">
                        <Wallet className="h-[18px] w-[18px] text-indigo-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-black leading-tight text-slate-900">
                          Pencairan #{String(settlement.id).slice(0, 8)}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`border text-[10px] font-bold ${statusMeta.className}`}
                          >
                            {statusLabel}
                          </Badge>

                          <span className="text-[10.5px] font-medium text-slate-500">
                            ID pencairan dana vendor
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <div className="rounded-[13px] bg-slate-50 px-3 py-2.5">
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                          Nominal
                        </p>
                        <p className="mt-1 truncate text-[13px] font-black text-slate-900">
                          {formatIDR(settlement.net_amount || 0)}
                        </p>
                      </div>

                      <div className="rounded-[13px] bg-slate-50 px-3 py-2.5">
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">
                          Status
                        </p>
                        <p className="mt-1 truncate text-[13px] font-black text-slate-700">
                          {statusLabel}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {canClaim ? (
                        <Button
                          onClick={() => handleClaim(settlement)}
                          className="h-9 w-full rounded-xl bg-emerald-600 px-4 text-[11.5px] font-bold hover:bg-emerald-700"
                        >
                          Ajukan Cair
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          disabled
                          className="h-9 w-full rounded-xl px-4 text-[11.5px] font-bold"
                        >
                          Tidak tersedia
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="rounded-[22px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-black tracking-tight text-slate-900">
              Cairkan Dana Wallet
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Dana akan ditarik dari saldo vendor ke rekening yang terdaftar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            <div className="rounded-[16px] border border-emerald-100 bg-emerald-50/70 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Saldo tersedia
              </p>
              <p className="mt-1 text-[25px] font-black tracking-tight text-emerald-700">
                {formatIDR(walletAvailable)}
              </p>
              <p className="mt-1 text-[11px] font-medium text-emerald-700/75">
                Minimum pencairan {formatIDR(minimumWithdrawal)}
              </p>
            </div>

            <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Rekening tujuan
              </p>
              <p className="mt-2 text-[13px] font-black text-slate-900">
                {vendorProfile?.bank_name || "Belum diatur"}
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                {vendorProfile?.bank_account_holder ||
                  "Nama pemilik rekening belum diatur"}
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                {vendorProfile?.bank_account_number
                  ? `****${vendorProfile.bank_account_number.slice(-4)}`
                  : "Nomor rekening belum diatur"}
              </p>
            </div>

            {!hasBankAccount && (
              <div className="rounded-[14px] border border-red-100 bg-red-50 px-3.5 py-3 text-[12px] font-medium text-red-700">
                Lengkapi rekening bank di halaman Profil sebelum mencairkan dana.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold text-slate-700">
                Nominal pencairan
              </label>
              <input
                type="number"
                min={minimumWithdrawal}
                max={walletAvailable}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold outline-none transition focus:border-emerald-300"
                placeholder={`Minimum ${formatIDR(minimumWithdrawal)}`}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawLoading}
              >
                Batal
              </Button>

              <Button
                className="h-10 rounded-xl bg-emerald-600 px-5 font-bold hover:bg-emerald-700"
                onClick={handleWithdrawSubmit}
                disabled={withdrawLoading || !canSubmitWithdrawal}
              >
                {withdrawLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Konfirmasi Cairkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="rounded-[22px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-black tracking-tight text-slate-900">
              Ajukan Pencairan
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Konfirmasi pencairan dana ke rekening tujuan Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            <div className="rounded-[16px] border border-emerald-100 bg-emerald-50/70 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Nominal cair
              </p>
              <p className="mt-1 text-[25px] font-black tracking-tight text-emerald-700">
                {formatIDR(selectedSettlement?.net_amount || 0)}
              </p>
            </div>

            <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">
                Rekening tujuan
              </p>

              <p className="mt-2 text-[13px] font-black text-slate-900">
                {vendorProfile?.bank_name || "Belum diatur"}
              </p>

              <p className="mt-1 text-[12px] text-slate-500">
                {vendorProfile?.bank_account_holder ||
                  "Nama pemilik rekening belum diatur"}
              </p>

              <p className="mt-1 text-[12px] text-slate-500">
                {vendorProfile?.bank_account_number
                  ? `****${vendorProfile.bank_account_number.slice(-4)}`
                  : "Nomor rekening belum diatur"}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() => setShowClaimModal(false)}
                disabled={claimLoading}
              >
                Batal
              </Button>

              <Button
                className="h-10 rounded-xl bg-emerald-600 px-5 font-bold hover:bg-emerald-700"
                onClick={handleClaimSubmit}
                disabled={claimLoading}
              >
                {claimLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Konfirmasi Cairkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorSettlement;
