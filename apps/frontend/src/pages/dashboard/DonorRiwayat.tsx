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
  Plus,
  Loader2,
  CreditCard,
  QrCode,
  ChevronLeft,
  ChevronRight,
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedDonations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  useEffect(() => {
  setCurrentPage(1);
  }, [search, statusFilter]);

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
        {/* Stats Summary */}
<div className="rounded-2xl border border-border bg-card shadow-sm">
  <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
    <div className="px-6 py-6 md:px-8">
      <p className="text-sm font-semibold text-muted-foreground">Total Donasi</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-700">
        {formatIDR(totalDonated)}
      </p>
    </div>

    <div className="px-6 py-6 md:px-8">
      <p className="text-sm font-semibold text-muted-foreground">Total Transaksi</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {totalCount} transaksi
      </p>
    </div>

    <div className="px-6 py-6 md:px-8">
      <p className="text-sm font-semibold text-muted-foreground">Transaksi Berhasil</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {successCount} berhasil
      </p>
    </div>
  </div>
</div>

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
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  statusFilter === tab.key
                    ? "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
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

        {/* Transaction Table */}
<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
  {filtered.length === 0 ? (
    <div className="text-center py-14">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>

      <p className="font-semibold text-foreground mb-1">Tidak ada donasi ditemukan</p>
      <p className="text-sm text-muted-foreground mb-5">
        {search || statusFilter !== "all"
          ? "Coba ubah kata kunci atau filter status."
          : "Mulai berdonasi untuk mendukung nutrisi anak."}
      </p>

      <Button
        size="sm"
        onClick={() => navigate("/donation/create")}
        className="bg-emerald-700 hover:bg-emerald-800 gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Buat Donasi
      </Button>
    </div>
  ) : (
    <>
      <div className="px-5 py-4 sm:px-6">
        <div className="hidden grid-cols-[1.2fr_1.7fr_1.1fr_1.2fr_1fr] gap-6 border-b border-border pb-4 text-sm font-semibold text-muted-foreground md:grid">
          <div>Tanggal</div>
          <div>Jenis Donasi</div>
          <div>Metode</div>
          <div>Nominal</div>
          <div>Status</div>
        </div>

        <div className="divide-y divide-border">
          {paginatedDonations.map((d) => {
            const typeLabel =
              d.type === "subscription" ? "Donasi Langganan" : "Donasi Satu Kali";

            
            const statusLabel =
              d.status === "success"
                ? "Berhasil"
                : d.status === "pending"
                  ? "Menunggu"
                  : "Gagal";

            const statusClass =
              d.status === "success"
                ? "bg-green-100 text-green-700 border-green-200"
                : d.status === "pending"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200";

            const methodLabel =
              paymentMethodLabel[d.payment_method] || d.payment_method?.replace("_", " ") || "—";

            return (
              <div
                key={d.id}
                className="grid gap-3 py-4 md:grid-cols-[1.2fr_1.7fr_1.1fr_1.2fr_1fr] md:items-center md:gap-6"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(d.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">{typeLabel}</p>
                </div>

                <div>
                  <p className="text-sm text-foreground">{methodLabel}</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground">{formatIDR(d.amount)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </Badge>

                  {d.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => openPendingPayment(d)}
                    >
                      Bayar
                    </Button>
                  )}

                  {d.status === "success" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
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
      </div>

      {totalPages > 1 && (
  <div className="flex items-center justify-center gap-3 border-t border-border px-5 py-5">
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-lg"
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>

    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
      <Button
        key={page}
        variant={currentPage === page ? "default" : "outline"}
        size="icon"
        className={`h-9 w-9 rounded-lg ${
          currentPage === page
            ? "bg-emerald-700 text-white hover:bg-emerald-800"
            : ""
        }`}
        onClick={() => setCurrentPage(page)}
      >
        {page}
      </Button>
    ))}

    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-lg"
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
)}
    </>
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
              className="gap-2 bg-emerald-700 hover:bg-emerald-800"
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
