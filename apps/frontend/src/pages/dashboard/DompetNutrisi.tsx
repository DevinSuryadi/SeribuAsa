import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVoucherData } from "@/hooks/useVoucherData";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  Info,
  RefreshCw,
  ShoppingBasket,
  Ticket,
  Flame,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  Plus,
  Clock,
} from "lucide-react";
import { formatIDR, formatDate } from "@/lib/format";
import VoucherQRDisplay from "@/components/voucher/VoucherQRDisplay";
import type { Voucher, VoucherTransaction } from "@/types";

const allowedCategories = [
  {
    name: "Makanan Pokok",
    emoji: "🌾",
    desc: "Beras, jagung, ubi",
    color: "bg-amber-50 border-amber-200",
  },
  { name: "Protein", emoji: "🥩", desc: "Daging, ikan, telur", color: "bg-red-50 border-red-200" },
  {
    name: "Susu & Olahan",
    emoji: "🥛",
    desc: "Susu, keju, yogurt",
    color: "bg-blue-50 border-blue-200",
  },
  {
    name: "Sayuran",
    emoji: "🥬",
    desc: "Semua jenis sayuran",
    color: "bg-green-50 border-green-200",
  },
  {
    name: "Buah-buahan",
    emoji: "🍎",
    desc: "Semua jenis buah",
    color: "bg-rose-50 border-rose-200",
  },
  {
    name: "Kacang-kacangan",
    emoji: "🫘",
    desc: "Kedelai, kacang hijau",
    color: "bg-orange-50 border-orange-200",
  },
];

const DompetNutrisi = () => {
  const navigate = useNavigate();
  const { data: balance, transactions, loading, error, refetch } = useVoucherData();

  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const totalBalance = balance?.total_balance || 0;
  const activeVouchers: Voucher[] = balance?.active_vouchers || [];
  const expiringSoon = balance?.expiring_soon?.count || 0;
  const expiringAmount = balance?.expiring_soon?.total_amount || 0;

  const openQR = (v: Voucher) => {
    setSelectedVoucher(v);
    setShowQRModal(true);
  };

  const expiryDate = activeVouchers[0]?.expiry_date
    ? new Date(activeVouchers[0].expiry_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const primaryVoucher = activeVouchers[0];

  // Usage progress: out of a reference max (e.g. Rp 2.000.000 typical monthly allocation)
  const usageMax = Math.max(totalBalance, 2_000_000);
  const usagePct = Math.round((totalBalance / usageMax) * 100);

  if (loading) {
    return (
      <DashboardLayout
        title="Dompet Nutrisi"
        subtitle="Saldo e-voucher dan riwayat transaksi Anda."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data voucher...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Dompet Nutrisi"
        subtitle="Saldo e-voucher dan riwayat transaksi Anda."
      >
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">Gagal memuat data</h3>
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="border-destructive/30 text-destructive"
            >
              <RefreshCw className="mr-2 h-3 w-3" /> Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dompet Nutrisi" subtitle="Saldo e-voucher dan riwayat transaksi Anda.">
      <div className="space-y-6">
        {/* ── Hero Balance Card ── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 60%, #047857 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 top-16 h-20 w-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-white/80" />
                <p className="text-sm text-white/80 font-medium">Saldo E-Voucher</p>
              </div>
              <div className="text-4xl font-extrabold text-white tracking-tight mb-3">
                {formatIDR(totalBalance)}
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/70 rounded-full transition-all duration-700"
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {activeVouchers.length} Voucher Aktif
                </Badge>
                {expiryDate && (
                  <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    Berlaku s/d {expiryDate}
                  </Badge>
                )}
              </div>
            </div>

            {/* QR Button */}
            <button
              onClick={() => primaryVoucher && openQR(primaryVoucher)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
              title={primaryVoucher ? "Tampilkan QR Voucher" : "Belum ada voucher aktif"}
              disabled={!primaryVoucher}
            >
              <div
                className={`h-16 w-16 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform ${primaryVoucher ? "group-hover:scale-110 cursor-pointer" : "opacity-40"}`}
              >
                <QrCode className="h-10 w-10 text-green-700" />
              </div>
              <span className="text-[10px] text-white/70">
                {primaryVoucher ? "Tap QR" : "Tidak ada"}
              </span>
            </button>
          </div>

          {/* Expiring warning */}
          {expiringSoon > 0 && (
            <div className="relative z-10 mt-4 rounded-xl bg-amber-400/20 border border-amber-300/30 p-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-200 flex-shrink-0" />
              <p className="text-xs text-amber-100">
                <strong>{expiringSoon} voucher</strong> ({formatIDR(expiringAmount)}) segera
                kadaluarsa — gunakan sebelum terlambat!
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="relative z-10 mt-4 pt-4 border-t border-white/20 flex items-center gap-4">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Total Voucher</p>
              <p className="text-lg font-bold text-white">{activeVouchers.length}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">
                Hampir Kadaluarsa
              </p>
              <p className="text-lg font-bold text-white">{expiringSoon}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                className="bg-white text-green-700 hover:bg-green-50 border-0 font-semibold text-xs gap-1.5"
                onClick={() => navigate("/dashboard/katalog")}
              >
                <ShoppingBasket className="h-3.5 w-3.5" /> Belanja
              </Button>
              <Button
                size="sm"
                className="bg-white/10 border border-white/40 text-white hover:bg-white/20 font-semibold text-xs gap-1.5"
                onClick={() => navigate("/dashboard/penukaran-voucher")}
              >
                <Ticket className="h-3.5 w-3.5" /> Tukar
              </Button>
            </div>
          </div>
        </div>

        {/* ── Active Vouchers ── */}
        {activeVouchers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Voucher Aktif</h2>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {activeVouchers.length} voucher
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50">
              {activeVouchers.slice(0, 4).map((v: Voucher, i: number) => (
                <div key={v.id || i} className="p-4 hover:bg-secondary/20 transition-colors">
                  <VoucherQRDisplay
                    code={v.code || `VCH-${i + 1}`}
                    balance={v.remaining_amount || v.amount || 0}
                    expiryDate={v.expiry_date}
                    compact
                  />
                  <button
                    onClick={() => openQR(v)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold text-green-700 hover:bg-green-50 transition-colors border border-green-200 group"
                  >
                    <QrCode className="h-3 w-3" />
                    Tampilkan QR Besar
                    <ChevronRight className="h-3 w-3 ml-auto group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ))}
              {activeVouchers.length > 4 && (
                <div className="p-3 text-center">
                  <button
                    className="text-xs text-primary font-semibold flex items-center gap-1 mx-auto hover:underline"
                    onClick={() => navigate("/dashboard/vouchers")}
                  >
                    <Plus className="h-3 w-3" />
                    Lihat {activeVouchers.length - 4} voucher lainnya
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Allowed Categories ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Kategori yang Diperbolehkan</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allowedCategories.map((cat) => (
              <div
                key={cat.name}
                className={`rounded-xl border p-3 flex items-center gap-2.5 transition-transform hover:scale-[1.02] ${cat.color}`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <p className="text-[11px] text-amber-800">
              Voucher <strong>hanya untuk bahan pangan bergizi</strong>. Makanan olahan, junk food,
              dan minuman kemasan tidak diperbolehkan.
            </p>
          </div>
        </div>

        {/* ── Transaction History ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Riwayat Transaksi Voucher</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Perubahan saldo voucher masuk & keluar
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5"
              onClick={refetch}
            >
              <RefreshCw className="h-3 w-3" /> Perbarui
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mx-auto mb-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Belum ada transaksi voucher
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Riwayat perubahan saldo voucher Anda akan muncul di sini
                </p>
                <p className="text-[10px] text-muted-foreground/70 mb-4 px-8">
                  Untuk melihat status pengiriman barang, kunjungi menu{" "}
                  <strong>Riwayat Pesanan</strong>
                </p>
                <Button size="sm" onClick={() => navigate("/dashboard/katalog")}>
                  <ShoppingBasket className="h-3.5 w-3.5 mr-1.5" /> Mulai Belanja
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((t: VoucherTransaction) => {
                  const isCredit = t.type === "allocation";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${
                            isCredit ? "bg-green-100" : "bg-rose-50"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-rose-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {t.description || (isCredit ? "Alokasi Voucher" : "Penukaran Voucher")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.date ? formatDate(t.date) : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-foreground"}`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatIDR(Math.abs(t.amount || 0))}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${isCredit ? "bg-green-50 text-green-700 border-green-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}
                        >
                          {isCredit ? "Masuk" : "Keluar"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QR Modal ── */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="rounded-2xl max-w-sm p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>QR Voucher {selectedVoucher?.code}</DialogTitle>
          </DialogHeader>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-green-50">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
                <Wallet className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-green-800">SeribuAsa</p>
                <p className="text-[10px] text-green-600">E-Voucher Nutrisi</p>
              </div>
            </div>
            <button
              onClick={() => setShowQRModal(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>
          {selectedVoucher && (
            <VoucherQRDisplay
              code={selectedVoucher.code || ""}
              balance={selectedVoucher.remaining_amount || selectedVoucher.amount || 0}
              expiryDate={selectedVoucher.expiry_date}
              compact={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DompetNutrisi;
