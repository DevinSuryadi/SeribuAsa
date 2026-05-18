import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileText,
  Search,
  Heart,
  TrendingUp,
  CheckCircle,
  Plus,
  Loader2,
  CreditCard,
  QrCode,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import { getDonations, getPaymentLink, simulatePayment } from "@/services/donations";
import { loadMidtransScript } from "@/utils/midtrans";
import {
  downloadDonationReceipt,
  exportDonationHistory,
  triggerDownload,
} from "@/services/downloads";
import type { Donation, DonationStatus } from "@/types/donation";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { CardSkeletonGrid, ListItemSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { KpiCard, KpiCardGrid } from "@/components/dashboard/KpiCard";
import { donationStatusConfig } from "@/lib/status-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FilterKey = "all" | DonationStatus;

const filterTabs: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "success", label: "Sukses" },
  { key: "pending", label: "Menunggu" },
  { key: "failed", label: "Gagal" },
];

const paymentMethodLabel: Record<string, string> = {
  bank_transfer: "Transfer Bank",
  credit_card: "Kartu Kredit",
  e_wallet: "E-Wallet",
  gopay: "GoPay",
  midtrans: "Midtrans",
  qris: "QRIS",
  va_bca: "Virtual Account BCA",
  va_mandiri: "Virtual Account Mandiri",
};

const DonorRiwayat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedPending, setSelectedPending] = useState<Donation | null>(null);
  const [payingDonationId, setPayingDonationId] = useState<string | null>(null);

  const fetchDonations = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);
      const data = await getDonations();
      setDonations(data || []);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Gagal memuat riwayat donasi";
      setError(msg);
      toast.error("Gagal memuat riwayat donasi");
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (user) fetchDonations();
  }, [user, fetchDonations]);

  // Handle download receipt
  const handleDownloadReceipt = async (donationId: string) => {
    setDownloadingReceipt(donationId);
    try {
      const blob = await downloadDonationReceipt(donationId);
      triggerDownload(blob, `kwitansi-donasi-${donationId.slice(0, 8)}.pdf`);
      toast.success("Kwitansi berhasil diunduh");
    } catch (err: any) {
      toast.error("Gagal mengunduh kwitansi", { description: err.message });
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const openPendingPayment = (donation: Donation) => {
    setSelectedPending(donation);
  };

  const closePendingPayment = () => {
    setSelectedPending(null);
  };

  const handleContinuePayment = async () => {
    if (!selectedPending) return;

    setPayingDonationId(selectedPending.id);
    try {
      const info = await getPaymentLink(selectedPending.id);
      if (!info.snap_token) {
        toast.error("Token pembayaran belum tersedia");
        return;
      }

      const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "SB-Mid-client-XXXXX";
      const isLoaded = await loadMidtransScript(clientKey);
      if (!isLoaded) {
        toast.error("Gagal memuat layanan Midtrans");
        return;
      }

      // @ts-expect-error - window.snap is injected by the Midtrans script.
      window.snap.pay(info.snap_token, {
        onSuccess: async () => {
          try {
            await simulatePayment(selectedPending.id);
          } catch (error) {
            console.error("Failed to confirm sandbox payment:", error);
          }
          toast.success("Pembayaran berhasil diselesaikan");
          closePendingPayment();
          await fetchDonations();
        },
        onPending: () => {
          toast.info("Pembayaran masih menunggu penyelesaian");
          closePendingPayment();
          void fetchDonations();
        },
        onError: () => {
          toast.error("Pembayaran gagal diproses");
        },
        onClose: () => {
          toast.info("Popup pembayaran ditutup. Donasi tetap tersimpan sebagai pending.");
        },
      });
    } catch (err: any) {
      toast.error("Gagal membuka pembayaran", { description: err.message });
    } finally {
      setPayingDonationId(null);
    }
  };

  // Handle export history
  const handleExportHistory = async () => {
    setExporting(true);
    try {
      const blob = await exportDonationHistory("csv", {
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      const dateStr = new Date().toISOString().split("T")[0];
      triggerDownload(blob, `riwayat-donasi-${dateStr}.csv`);
      toast.success("Riwayat berhasil diekspor");
    } catch (err: any) {
      toast.error("Gagal mengekspor riwayat", { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const filtered = useMemo(
    () =>
      donations.filter((d) => {
        if (statusFilter !== "all" && d.status !== statusFilter) return false;
        if (search) {
          const typeLabel = d.type === "subscription" ? "Donasi Langganan" : "Donasi Satu Kali";
          return typeLabel.toLowerCase().includes(search.toLowerCase());
        }
        return true;
      }),
    [donations, search, statusFilter]
  );

  const totalDonated = useMemo(
    () =>
      filtered.filter((d) => d.status === "success").reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [filtered]
  );

  const totalCount = donations.length;
  const successCount = useMemo(
    () => donations.filter((d) => d.status === "success").length,
    [donations]
  );

  if (loading) {
    return (
      <DashboardLayout title="Riwayat Donasi" subtitle="Semua transaksi donasi Anda.">
        <div className="space-y-4">
          <CardSkeletonGrid count={3} columns={3} />
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <ListItemSkeleton count={5} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Riwayat Donasi" subtitle="Semua transaksi donasi Anda.">
        <ErrorState message={error} onRetry={fetchDonations} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Riwayat Donasi" subtitle="Semua transaksi donasi Anda.">
      <div className="space-y-5">
        {/* Stats Row */}
        <KpiCardGrid columns={3}>
          <KpiCard
            icon={Heart}
            label="Total Berhasil"
            value={formatIDR(totalDonated)}
            variant="rose"
          />
          <KpiCard
            icon={TrendingUp}
            label="Total Transaksi"
            value={`${totalCount}x`}
            variant="blue"
          />
          <KpiCard icon={CheckCircle} label="Sukses" value={`${successCount}x`} variant="green" />
        </KpiCardGrid>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari donasi..."
              className="pl-9 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === tab.key
                    ? "bg-rose-600 text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={handleExportHistory}
            disabled={exporting || donations.length === 0}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Unduh
          </Button>
        </div>

        {/* Transaction List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 mx-auto mb-4">
                <Heart className="h-6 w-6 text-rose-400" />
              </div>
              <p className="font-semibold text-foreground mb-1">Tidak ada donasi ditemukan</p>
              <p className="text-sm text-muted-foreground mb-5">
                {search || statusFilter !== "all"
                  ? "Coba ubah kata kunci"
                  : "Mulai berdonasi untuk mendukung nutrisi anak"}
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/donation/create")}
                className="bg-rose-600 hover:bg-rose-700 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Buat Donasi
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((d) => {
                const typeLabel =
                  d.type === "subscription" ? "Donasi Langganan" : "Donasi Satu Kali";
                const sc = donationStatusConfig[d.status] || {
                  ...donationStatusConfig.pending,
                  label: d.status,
                  icon: FileText,
                };
                const StatusIcon = sc.icon;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-50">
                      <Heart className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{typeLabel}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(d.created_at)}
                        {d.payment_method && (
                          <span className="ml-1.5 opacity-60">
                            · {d.payment_method.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3 flex-shrink-0">
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {formatIDR(d.amount)}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] border gap-0.5 ${sc.className}`}
                        >
                          <StatusIcon className="h-2.5 w-2.5" />
                          {sc.label}
                        </Badge>
                      </div>
                      {d.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => openPendingPayment(d)}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Bayar
                        </Button>
                      )}
                      {d.status === "success" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDownloadReceipt(d.id)}
                          disabled={downloadingReceipt === d.id}
                          aria-label={`Unduh kwitansi untuk donasi ${d.id.slice(0, 8)}`}
                        >
                          {downloadingReceipt === d.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedPending} onOpenChange={(open: boolean) => !open && closePendingPayment()}>
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-amber-50 px-6 py-5 border-b border-amber-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                  <CreditCard className="h-4 w-4 text-amber-700" />
                </span>
                Lanjutkan Pembayaran
              </DialogTitle>
              <DialogDescription>
                Donasi pending tetap memakai nominal, metode, dan nomor transaksi yang sama.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedPending && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">Nominal</div>
                  <div className="mt-1 font-bold text-foreground">{formatIDR(selectedPending.amount)}</div>
                </div>
                <div className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">Metode</div>
                  <div className="mt-1 font-bold text-foreground">
                    {paymentMethodLabel[selectedPending.payment_method] || selectedPending.payment_method}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">Jenis Donasi</div>
                  <div className="mt-1 font-bold text-foreground">
                    {selectedPending.type === "subscription" ? "Langganan" : "Satu Kali"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">Tanggal</div>
                  <div className="mt-1 font-bold text-foreground">{formatDate(selectedPending.created_at)}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3">
                <div className="text-xs text-muted-foreground">ID Donasi</div>
                <div className="mt-1 break-all font-mono text-xs text-foreground">{selectedPending.id}</div>
              </div>

              {selectedPending.payment_method === "qris" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-amber-700">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-amber-900">QRIS</div>
                      <p className="mt-1 text-sm text-amber-800">
                        Kode QR akan muncul di halaman Midtrans setelah pembayaran dilanjutkan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={closePendingPayment} disabled={!!payingDonationId}>
              Tutup
            </Button>
            <Button
              className="gap-2 bg-rose-600 hover:bg-rose-700"
              onClick={handleContinuePayment}
              disabled={!!payingDonationId}
            >
              {payingDonationId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Bayar Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DonorRiwayat;
