import { useState, useEffect, useMemo, useCallback } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { KpiCard, KpiCardGrid } from "@/components/dashboard/KpiCard";
import { CardSkeletonGrid } from "@/components/dashboard/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import WithdrawalQRCard from "@/components/vendor/WithdrawalQRCard";
import { useAuth } from "@/contexts/AuthContext";
import { useVendorSettlement } from "@/hooks/useVendorSettlement";
import { formatDate, formatIDR } from "@/lib/format";
import { settlementStatusConfig } from "@/lib/status-config";
import { triggerDownload } from "@/services/downloads";
import type { SettlementReport } from "@/services/reports";
import { getSettlementReport } from "@/services/reports";
import { requestSettlementPayout, exportSettlements } from "@/services/settlements";
import type { Settlement } from "@/services/settlements";
import {
  getWalletBalance,
  getWithdrawalHistory,
  redeemQrWithdrawal,
  requestQrWithdrawal,
} from "@/services/vendor-wallet";
import type { WalletBalance, Withdrawal } from "@/services/vendor-wallet";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Download,
  History,
  Loader2,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface VendorProfile {
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
}

const DEFAULT_MIN_WITHDRAWAL = 50000;

const withdrawalStatusClassName: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-700",
};

const VendorSettlement = () => {
  const { user } = useAuth();
  const { data: settlements, loading, error, refetch } = useVendorSettlement();

  const isAdmin = user?.role === "admin";
  const isVendor = user?.role === "vendor";

  const [report, setReport] = useState<SettlementReport | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeQrWithdrawal, setActiveQrWithdrawal] = useState<Withdrawal | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [qrAmount, setQrAmount] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [redeemPayload, setRedeemPayload] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    getSettlementReport(startDate, endDate)
      .then(setReport)
      .catch(() => {});
    return () => controller.abort();
  }, [startDate, endDate, user]);

  const fetchVendorProfile = useCallback(async () => {
    if (!user?.id || !isVendor) return;
    try {
      const data = await apiFetch(`/users/${user.id}`);
      setVendorProfile(data as VendorProfile);
    } catch {
      setVendorProfile(null);
    }
  }, [isVendor, user?.id]);

  const fetchVendorFinance = useCallback(async () => {
    if (!isVendor) return;

    setWalletLoading(true);
    try {
      const [walletData, withdrawalData] = await Promise.all([
        getWalletBalance(),
        getWithdrawalHistory(1, 20),
      ]);

      setWallet(walletData);
      setWithdrawals(withdrawalData.items || []);

      const latestPendingQr =
        (withdrawalData.items || []).find(
          (item) =>
            item.withdrawal_method === "qr" &&
            (item.status === "pending" || item.status === "processing") &&
            item.qr_payload
        ) || null;

      setActiveQrWithdrawal(latestPendingQr);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data withdrawal vendor";
      toast.error("Gagal memuat withdrawal vendor", { description: msg });
    } finally {
      setWalletLoading(false);
    }
  }, [isVendor]);

  useEffect(() => {
    fetchVendorProfile();
  }, [fetchVendorProfile]);

  useEffect(() => {
    fetchVendorFinance();
  }, [fetchVendorFinance]);

  const totalEarned = useMemo(() => {
    if (report?.summary?.settled_amount) return report.summary.settled_amount;
    return settlements
      .filter((settlement) => settlement.status === "paid" || settlement.status === "ready")
      .reduce((sum, settlement) => sum + (settlement.net_amount || 0), 0);
  }, [report, settlements]);

  const pendingCount = useMemo(() => {
    if (report) return report.summary.pending_count;
    return settlements.filter((settlement) => settlement.status === "ready").length;
  }, [report, settlements]);

  const pendingTotal = useMemo(() => {
    if (report?.summary?.pending_amount) return report.summary.pending_amount;
    return settlements
      .filter((settlement) => settlement.status === "ready")
      .reduce((sum, settlement) => sum + (settlement.net_amount || 0), 0);
  }, [report, settlements]);

  const walletBalance = wallet?.balance || 0;
  const pendingWithdrawals = wallet?.pending_withdrawals || 0;
  const minimumWithdrawal = wallet?.minimum_withdrawal_amount || DEFAULT_MIN_WITHDRAWAL;

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
        `Pencairan ${formatIDR(selectedSettlement.net_amount || 0)} diproses dalam 1-3 hari kerja.`
      );
      setShowClaimModal(false);
      setSelectedSettlement(null);
      refetch();
      await fetchVendorFinance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengajukan klaim";
      toast.error(msg);
    } finally {
      setClaimLoading(false);
    }
  };

  const handleExport = async () => {
    if (settlements.length === 0) {
      toast.info("Tidak ada data untuk diekspor");
      return;
    }

    setExportLoading(true);
    try {
      const blob = await exportSettlements("csv", startDate, endDate);
      const dateStr = new Date().toISOString().split("T")[0];
      triggerDownload(blob, `laporan-settlement-${dateStr}.csv`);
      toast.success("Laporan berhasil diunduh");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengekspor laporan";
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  };

  const handleGenerateQrWithdrawal = async () => {
    const amount = Number(qrAmount);
    if (!Number.isFinite(amount) || amount < minimumWithdrawal) {
      toast.error(`Minimum pencairan QR adalah ${formatIDR(minimumWithdrawal)}`);
      return;
    }

    if (amount > walletBalance) {
      toast.error("Saldo wallet tidak mencukupi");
      return;
    }

    try {
      setQrLoading(true);
      const withdrawal = await requestQrWithdrawal(amount);
      setActiveQrWithdrawal(withdrawal);
      setQrAmount("");
      toast.success("QR pencairan berhasil dibuat");
      await fetchVendorFinance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat QR pencairan";
      toast.error(msg);
    } finally {
      setQrLoading(false);
    }
  };

  const handleRedeemQr = async () => {
    const payload = redeemPayload.trim();
    if (!payload) {
      toast.error("Masukkan payload atau token QR pencairan");
      return;
    }

    try {
      setRedeemLoading(true);
      const withdrawal = await redeemQrWithdrawal(payload);
      setRedeemPayload("");
      toast.success(`Withdrawal ${formatIDR(withdrawal.amount)} berhasil dicairkan`);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memvalidasi QR pencairan";
      toast.error(msg);
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading || (isVendor && walletLoading && !wallet && withdrawals.length === 0)) {
    return (
      <DashboardLayout
        title="Riwayat Pencairan"
        subtitle="Kelola settlement dan cashout hasil penukaran voucher."
      >
        <div className="space-y-4">
          <CardSkeletonGrid count={4} columns={4} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Riwayat Pencairan"
        subtitle="Kelola settlement dan cashout hasil penukaran voucher."
      >
        <ErrorState message={error} onRetry={refetch} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Riwayat Pencairan"
      subtitle="Kelola settlement vendor dan pencairan saldo wallet hasil redemption."
    >
      <div className="space-y-5">
        <KpiCardGrid columns={4}>
          <KpiCard
            icon={Wallet}
            label={isAdmin ? "Total Dicairkan" : "Saldo Wallet"}
            value={formatIDR(isAdmin ? totalEarned : walletBalance)}
            subtitle={isVendor ? "Siap dicairkan" : "Ringkasan settlement vendor"}
            variant="green"
          />
          <KpiCard
            icon={Calendar}
            label="Menunggu Settlement"
            value={formatIDR(pendingTotal)}
            subtitle={`${pendingCount} periode`}
            variant="amber"
          />
          <KpiCard
            icon={QrCode}
            label="QR Cashout Pending"
            value={formatIDR(pendingWithdrawals)}
            subtitle={
              isVendor
                ? `${withdrawals.filter((item) => item.status === "pending").length} request`
                : "Redeem QR vendor di sini"
            }
            variant="indigo"
          />
          <KpiCard
            icon={CreditCard}
            label={isAdmin ? "Mode Admin" : "Rekening Tujuan"}
            value={isAdmin ? "Validator QR" : vendorProfile?.bank_name || "Belum diatur"}
            subtitle={
              isAdmin
                ? "Pencairan vendor via token QR"
                : vendorProfile?.bank_account_number
                  ? `****${vendorProfile.bank_account_number.slice(-4)}`
                  : "Lengkapi di profil"
            }
            variant={isAdmin || vendorProfile?.bank_account_number ? "purple" : "red"}
          />
        </KpiCardGrid>

        {report ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {[
              {
                label: "Pertumbuhan Bulanan",
                value: `${report.trends.month_over_month_growth > 0 ? "+" : ""}${report.trends.month_over_month_growth.toFixed(1)}%`,
                icon: TrendingUp,
                positive: report.trends.month_over_month_growth >= 0,
              },
              {
                label: "Rata-rata Waktu Cair",
                value: `${report.trends.average_settlement_time.toFixed(1)} hari`,
                icon: Calendar,
                positive: true,
              },
              {
                label: "Tingkat Sukses",
                value: `${report.trends.settlement_success_rate.toFixed(1)}%`,
                icon: ShieldCheck,
                positive: true,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 flex items-center gap-3 ${item.positive ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-white ${item.positive ? "border-green-200" : "border-red-200"}`}
                  >
                    <Icon
                      className={`h-4 w-4 ${item.positive ? "text-green-600" : "text-red-600"}`}
                    />
                  </div>
                  <div>
                    <div
                      className={`text-lg font-extrabold ${item.positive ? "text-green-700" : "text-red-700"}`}
                    >
                      {item.value}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {isVendor ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Pencairan Wallet via QR</h2>
                  <p className="text-xs text-muted-foreground">
                    Dana hasil redemption dikunci lalu dicairkan setelah QR divalidasi admin.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo Tersedia</span>
                  <span className="font-bold text-foreground">{formatIDR(walletBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">QR Pending</span>
                  <span className="font-medium text-foreground">
                    {formatIDR(pendingWithdrawals)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Cashout</span>
                  <span className="font-medium text-foreground">
                    {formatIDR(minimumWithdrawal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rekening Vendor</span>
                  <span className="font-medium text-foreground">
                    {vendorProfile?.bank_name || "Belum diatur"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Nominal Pencairan QR
                </label>
                <Input
                  type="number"
                  value={qrAmount}
                  onChange={(event) => setQrAmount(event.target.value)}
                  placeholder={`Min. ${formatIDR(minimumWithdrawal)}`}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Setelah QR dibuat, saldo akan direservasi sampai admin memproses pencairan.
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleGenerateQrWithdrawal}
                  disabled={qrLoading}
                >
                  {qrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  {qrLoading ? "Membuat QR..." : "Generate QR Pencairan"}
                </Button>
                <Button variant="outline" onClick={() => void fetchVendorFinance()}>
                  Refresh
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              {activeQrWithdrawal?.qr_payload ? (
                <WithdrawalQRCard
                  amount={activeQrWithdrawal.amount}
                  reference={activeQrWithdrawal.transfer_reference || "QR-WITHDRAWAL"}
                  payload={activeQrWithdrawal.qr_payload}
                />
              ) : (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <QrCode className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">Belum ada QR pencairan aktif</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Generate QR baru agar admin bisa memproses cashout saldo vendor langsung dari
                    wallet redemption.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Validasi QR Pencairan</h2>
                <p className="text-xs text-muted-foreground">
                  Tempel payload hasil scan QR vendor untuk menyelesaikan pencairan.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input
                value={redeemPayload}
                onChange={(event) => setRedeemPayload(event.target.value)}
                placeholder="Contoh: VENDOR-WITHDRAWAL:QRW-20260504-ABC123"
              />
              <Button
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleRedeemQr}
                disabled={redeemLoading}
              >
                {redeemLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {redeemLoading ? "Memvalidasi..." : "Cairkan Dana"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-xl border border-input bg-card px-3 py-2 text-sm"
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            disabled={exportLoading || settlements.length === 0}
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Unduh Laporan
          </Button>
        </div>

        {isVendor ? (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Riwayat Withdrawal Wallet</h2>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {withdrawals.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <History className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mb-1 font-semibold text-foreground">Belum ada withdrawal wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Riwayat cashout QR dan transfer bank akan muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {withdrawals.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        {item.withdrawal_method === "qr" ? (
                          <QrCode className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground">
                          {item.withdrawal_method === "qr"
                            ? "Cashout QR Vendor"
                            : "Transfer ke Rekening"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.transfer_reference || "Tanpa referensi"} • {formatDate(item.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">
                          {formatIDR(item.amount)}
                        </div>
                        <Badge
                          variant="outline"
                          className={`border text-[10px] ${withdrawalStatusClassName[item.status] || withdrawalStatusClassName.pending}`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      {item.withdrawal_method === "qr" && item.qr_payload && item.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setActiveQrWithdrawal(item)}
                        >
                          Lihat QR
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Riwayat Settlement</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {settlements.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mb-1 font-semibold text-foreground">Belum ada settlement</p>
                <p className="text-sm text-muted-foreground">
                  Settlement muncul setelah ada penukaran voucher yang diproses vendor.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {settlements.map((settlement) => {
                  const config =
                    settlementStatusConfig[
                      settlement.status as keyof typeof settlementStatusConfig
                    ] || settlementStatusConfig.calculating;
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={settlement.id}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors"
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                          settlement.status === "paid"
                            ? "bg-blue-50"
                            : settlement.status === "ready"
                              ? "bg-green-50"
                              : "bg-amber-50"
                        }`}
                      >
                        <StatusIcon
                          className={`h-4 w-4 ${
                            settlement.status === "paid"
                              ? "text-blue-600"
                              : settlement.status === "ready"
                                ? "text-green-600"
                                : "text-amber-600"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground">
                          {settlement.period_start ? formatDate(settlement.period_start) : "-"} -{" "}
                          {settlement.period_end ? formatDate(settlement.period_end) : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {settlement.vendor_store_name || "Toko Anda"}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-foreground">
                          {formatIDR(settlement.net_amount || 0)}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] border gap-0.5 ${config.className}`}
                        >
                          <StatusIcon className="h-2.5 w-2.5" /> {config.label}
                        </Badge>
                      </div>
                      {isVendor && settlement.status === "ready" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1 flex-shrink-0 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => handleClaim(settlement)}
                        >
                          <ArrowRight className="h-3 w-3" /> Klaim
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="rounded-2xl max-w-sm p-0 overflow-hidden [&>button:first-of-type]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Klaim Settlement</DialogTitle>
          </DialogHeader>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-green-50">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-green-800">Klaim Settlement</p>
                <p className="text-[10px] text-green-600">
                  Periode {selectedSettlement?.period_start ? formatDate(selectedSettlement.period_start) : "-"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowClaimModal(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <span className="text-foreground text-sm font-bold leading-none">✕</span>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2.5 text-sm">
              {[
                {
                  label: "Periode",
                  value: `${selectedSettlement?.period_start ? formatDate(selectedSettlement.period_start) : "-"} s/d ${selectedSettlement?.period_end ? formatDate(selectedSettlement.period_end) : "-"}`,
                },
                {
                  label: "Total Redemptions",
                  value: formatIDR(selectedSettlement?.total_redemptions || 0),
                },
                {
                  label: "Admin Fee",
                  value: formatIDR(selectedSettlement?.admin_fee || 0),
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-muted-foreground">{row.label}:</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2.5">
                <span className="font-semibold text-foreground">Jumlah Bersih:</span>
                <span className="font-bold text-green-600">
                  {formatIDR(selectedSettlement?.net_amount || 0)}
                </span>
              </div>
            </div>
            <Button
              className="w-full h-11 bg-green-600 hover:bg-green-700"
              onClick={handleClaimSubmit}
              disabled={claimLoading}
            >
              {claimLoading ? "Memproses..." : "Ajukan Klaim Sekarang"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowClaimModal(false)}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorSettlement;
