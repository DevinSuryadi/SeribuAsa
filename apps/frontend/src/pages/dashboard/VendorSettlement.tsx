import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Loader2 } from "lucide-react";
import { formatIDR } from "@/lib/format";
import {
  requestSettlementPayout,
  exportSettlements,
} from "@/services/settlements";
import type { Settlement } from "@/services/settlements";
import { getWalletBalance, getWithdrawalHistory, requestWithdrawal } from "@/services/vendor-wallet";
import type { WalletBalance, Withdrawal } from "@/services/vendor-wallet";
import { triggerDownload } from "@/services/downloads";
import { apiFetch } from "@/services/api";
import { toast } from "sonner";
import { useVendorSettlement } from "@/hooks/useVendorSettlement";
import { ErrorState } from "@/components/dashboard/ErrorState";

interface VendorProfile {
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
}

type EntryState = "ready" | "processing" | "paid" | "failed";
type EntryTab = "all" | "ready" | "processing" | "paid";

type HistoryEntry = {
  id: string;
  title: string;
  detail: string;
  date: string;
  amount: number;
  state: EntryState;
  statusLabel: string;
  settlement?: Settlement;
};

const pageSize = 20;
const dayMs = 24 * 60 * 60 * 1000;
const cardClass = "overflow-hidden rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]";

const entryTabs: { key: EntryTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "ready", label: "Siap dicairkan" },
  { key: "processing", label: "Diproses" },
  { key: "paid", label: "Sudah cair" },
];

const periodOptions = [
  { value: "all", label: "Semua waktu" },
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "90 hari terakhir" },
  { value: "365", label: "1 tahun terakhir" },
];

const stateClass: Record<EntryState, string> = {
  ready: "text-emerald-700",
  processing: "text-amber-700",
  paid: "text-slate-500",
  failed: "text-red-600",
};

function formatShortDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function maskedAccount(bankName?: string, accountNumber?: string) {
  if (!bankName) return "";
  return accountNumber ? `${bankName} •••• ${accountNumber.slice(-4)}` : bankName;
}

function withdrawalEntry(withdrawal: Withdrawal): HistoryEntry {
  const completed = withdrawal.status === "completed";
  const failed = withdrawal.status === "failed" || withdrawal.status === "cancelled";
  const account = maskedAccount(withdrawal.bank_name, withdrawal.bank_account_number);
  return {
    id: `withdrawal-${withdrawal.id}`,
    title: "Penarikan saldo",
    detail: [formatShortDate(withdrawal.created_at), account].filter(Boolean).join(" · "),
    date: withdrawal.created_at,
    amount: withdrawal.amount || 0,
    state: completed ? "paid" : failed ? "failed" : "processing",
    statusLabel: completed ? "Sudah cair" : withdrawal.status === "cancelled" ? "Dibatalkan" : failed ? "Gagal" : "Diproses",
  };
}

function settlementEntry(settlement: Settlement): HistoryEntry {
  const paid = settlement.status === "paid";
  const ready = settlement.status === "ready";
  const cancelled = settlement.status === "cancelled";
  return {
    id: `settlement-${settlement.id}`,
    title: "Pencairan periode",
    detail: `${formatShortDate(settlement.period_start)} – ${formatShortDate(settlement.period_end)}`,
    date: settlement.period_end || settlement.created_at,
    amount: Number(settlement.net_amount || 0),
    state: paid ? "paid" : ready ? "ready" : cancelled ? "failed" : "processing",
    statusLabel: paid ? "Sudah cair" : ready ? "Siap dicairkan" : cancelled ? "Dibatalkan" : "Diproses",
    settlement,
  };
}

function sumAmount<T extends { amount?: number }>(rows: T[]) {
  return rows.reduce((total, row) => total + (row.amount || 0), 0);
}

function sumNet(rows: Settlement[]) {
  return rows.reduce((total, row) => total + Number(row.net_amount || 0), 0);
}

function SummaryFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-[15px] font-semibold tracking-tight text-slate-900">{children}</dd>
    </div>
  );
}

function DialogFacts({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-slate-100 border-y border-slate-100 text-[13px]">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="shrink-0 text-slate-500">{row.label}</dt>
          <dd className="min-w-0 break-words text-right text-slate-900">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const VendorSettlement = () => {
  const { user } = useAuth();
  const { data: settlements, loading, error, refetch } = useVendorSettlement();

  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [activeTab, setActiveTab] = useState<EntryTab>("all");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);

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

  const fetchWithdrawalHistory = useCallback(async () => {
    if (!user?.id) return;

    setWithdrawalsLoading(true);
    try {
      const data = await getWithdrawalHistory(1, 100);
      setWithdrawals(data.items || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat riwayat pencairan wallet";
      toast.error("Gagal memuat riwayat pencairan", { description: msg });
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVendorProfile();
    fetchWalletBalance();
    fetchWithdrawalHistory();
  }, [fetchVendorProfile, fetchWalletBalance, fetchWithdrawalHistory]);

  // Settlements flow into the wallet, so a withdrawal and its settlement are the same money.
  const totalPaid = useMemo(() => {
    const completed = withdrawals.filter((w) => w.status === "completed");
    return completed.length ? sumAmount(completed) : sumNet(settlements.filter((s) => s.status === "paid"));
  }, [settlements, withdrawals]);

  const totalProcessing = useMemo(() => {
    const active = withdrawals.filter((w) => w.status === "pending" || w.status === "processing");
    return active.length
      ? sumAmount(active)
      : sumNet(settlements.filter((s) => s.status === "processing" || s.status === "calculating"));
  }, [settlements, withdrawals]);

  const scoped = useMemo(() => {
    const cutoff = period === "all" ? null : Date.now() - Number(period) * dayMs;
    return [...withdrawals.map(withdrawalEntry), ...settlements.map(settlementEntry)]
      // Anything waiting on the vendor stays visible even when it is older than the period.
      .filter((entry) => cutoff === null || entry.state === "ready" || new Date(entry.date).getTime() >= cutoff)
      .sort((a, b) => Number(b.state === "ready") - Number(a.state === "ready") || new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [withdrawals, settlements, period]);

  const counts = useMemo(() => {
    const result: Record<EntryTab, number> = { all: scoped.length, ready: 0, processing: 0, paid: 0 };
    scoped.forEach((entry) => {
      if (entry.state !== "failed") result[entry.state] += 1;
    });
    return result;
  }, [scoped]);

  const filtered = activeTab === "all" ? scoped : scoped.filter((entry) => entry.state === activeTab);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visibleEntries = filtered.slice(firstIndex, firstIndex + pageSize);
  const initialLoading = (loading && settlements.length === 0) || (withdrawalsLoading && withdrawals.length === 0);

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
  const accountLabel = maskedAccount(vendorProfile?.bank_name, vendorProfile?.bank_account_number);
  const accountFacts = {
    label: "Rekening tujuan",
    value: hasBankAccount ? `${accountLabel} · ${vendorProfile?.bank_account_holder}` : "Belum diatur",
  };
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
      toast.error("Nominal pencairan melebihi saldo dompet.");
      return;
    }

    try {
      setWithdrawLoading(true);
      await requestWithdrawal(withdrawAmountValue);
      toast.success("Pencairan berhasil diajukan ke rekening bank Anda.");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      await fetchWalletBalance();
      await fetchWithdrawalHistory();
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
      const today = new Date().toISOString().split("T")[0];
      const startDate = period === "all" ? undefined : new Date(Date.now() - Number(period) * dayMs).toISOString().split("T")[0];
      const blob = await exportSettlements("csv", startDate, period === "all" ? undefined : today);
      triggerDownload(blob, `laporan-pencairan-${today}.csv`);
      toast.success("Laporan pencairan berhasil diunduh");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengunduh laporan";
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  };

  const claimButton = (settlement: Settlement) => (
    <Button
      size="sm"
      className="h-8 rounded-full px-3 text-[13px]"
      onClick={() => setSelectedSettlement(settlement)}
    >
      Ajukan cair
    </Button>
  );

  return (
    <DashboardLayout
      title="Pencairan"
      subtitle="Cairkan saldo toko ke rekening Anda dan pantau statusnya."
      actions={
        <Button variant="outline" className="rounded-full bg-white" onClick={handleExport} disabled={exportLoading}>
          {exportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Unduh laporan
        </Button>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : initialLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-52 rounded-[20px]" />
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      ) : (
        <>
          <section className={cardClass}>
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] text-slate-500">Saldo tersedia</p>
                <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-slate-900">
                  {formatIDR(walletAvailable)}
                </p>
                <p className="mt-2 text-xs text-slate-500">Minimum pencairan {formatIDR(minimumWithdrawal)}</p>
              </div>
              <Button
                className="rounded-full px-6"
                onClick={openWithdrawModal}
                disabled={withdrawLoading || walletAvailable < minimumWithdrawal}
              >
                Cairkan dana
              </Button>
            </div>
            <dl className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 bg-[#f5f5f7]/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <SummaryFact label="Sedang diproses">{formatIDR(totalProcessing)}</SummaryFact>
              <SummaryFact label="Total sudah cair">{formatIDR(totalPaid)}</SummaryFact>
              <SummaryFact label="Rekening tujuan">
                {hasBankAccount ? accountLabel : (
                  <Link to="/dashboard/profile" className="text-red-600 hover:underline">Lengkapi di Profil</Link>
                )}
              </SummaryFact>
            </dl>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav
              className="flex w-fit max-w-full overflow-x-auto rounded-full bg-[#ececef] p-1 [scrollbar-width:none]"
              aria-label="Filter status pencairan"
            >
              {entryTabs.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={active}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setPage(1);
                    }}
                  >
                    {tab.label} <span className="text-slate-500">{counts[tab.key]}</span>
                  </button>
                );
              })}
            </nav>
            <select
              aria-label="Periode pencairan"
              className="h-9 rounded-full border-0 bg-[#ececef] px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value);
                setPage(1);
              }}
            >
              {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <section className={cardClass}>
            {visibleEntries.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-[15px] font-semibold tracking-tight text-slate-900">
                  {settlements.length + withdrawals.length === 0 ? "Belum ada pencairan" : "Tidak ada pencairan pada filter ini"}
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  {settlements.length + withdrawals.length === 0
                    ? "Pencairan yang Anda ajukan akan muncul di sini."
                    : "Coba ubah status atau periode."}
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {visibleEntries.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3 px-5 py-3 text-[13px]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{entry.title}</p>
                        <p className="truncate text-xs text-slate-500">{entry.detail}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-slate-900">{formatIDR(entry.amount)}</p>
                        <p className={`text-xs font-medium ${stateClass[entry.state]}`}>{entry.statusLabel}</p>
                      </div>
                      {entry.settlement && entry.state === "ready" && (
                        <div className="shrink-0">{claimButton(entry.settlement)}</div>
                      )}
                    </li>
                  ))}
                </ul>
                <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-2.5 text-[13px] text-slate-500">
                  <span>{firstIndex + 1}–{firstIndex + visibleEntries.length} dari {filtered.length} pencairan</span>
                  {pageCount > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full bg-slate-900/[0.06] px-3 text-[13px] font-medium text-slate-900 hover:bg-slate-900/10"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <span className="hidden tabular-nums sm:inline">{currentPage} / {pageCount}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full bg-slate-900/[0.06] px-3 text-[13px] font-medium text-slate-900 hover:bg-slate-900/10"
                        disabled={currentPage >= pageCount}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        Berikutnya
                      </Button>
                    </div>
                  )}
                </footer>
              </>
            )}
          </section>
        </>
      )}

      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold tracking-tight text-slate-900">Cairkan dana</DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500">
              Saldo tersedia {formatIDR(walletAvailable)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="withdraw-amount" className="block text-xs font-medium text-slate-500">Nominal</label>
              <Input
                id="withdraw-amount"
                type="number"
                min={minimumWithdrawal}
                max={walletAvailable}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="h-11 rounded-xl border-slate-200 text-[15px] font-semibold"
                placeholder={`Minimum ${formatIDR(minimumWithdrawal)}`}
              />
            </div>

            <DialogFacts rows={[accountFacts]} />

            {!hasBankAccount && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">
                Lengkapi rekening bank di{" "}
                <Link to="/dashboard/profile" className="font-medium underline">Profil</Link>{" "}
                sebelum mencairkan dana.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawLoading}
              >
                Batal
              </Button>
              <Button
                className="rounded-full px-5"
                onClick={handleWithdrawSubmit}
                disabled={withdrawLoading || !canSubmitWithdrawal}
              >
                {withdrawLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedSettlement)} onOpenChange={(open: boolean) => { if (!open) setSelectedSettlement(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogDescription className="text-[13px] text-slate-500">Ajukan pencairan</DialogDescription>
            <DialogTitle className="text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
              {formatIDR(selectedSettlement?.net_amount || 0)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <DialogFacts
              rows={[
                { label: "Periode", value: selectedSettlement ? settlementEntry(selectedSettlement).detail : "-" },
                accountFacts,
              ]}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setSelectedSettlement(null)}
                disabled={claimLoading}
              >
                Batal
              </Button>
              <Button className="rounded-full px-5" onClick={handleClaimSubmit} disabled={claimLoading}>
                {claimLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorSettlement;
