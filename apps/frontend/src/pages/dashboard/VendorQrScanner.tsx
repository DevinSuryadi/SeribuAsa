import { useState, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QrCode,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Search,
  Package,
  RefreshCw,
  Wallet,
  Loader2,
  ScanLine,
  ArrowRight,
  BadgeCheck,
  AlertCircle,
  Store,
  Camera,
  Keyboard,
  Image as ImageIcon,
} from "lucide-react";
import { QrCameraScanner } from "@/components/vendor/QrCameraScanner";
import { toast } from "sonner";
import { formatIDR, formatDate } from "@/lib/format";
import { apiFetch } from "@/services/api";

interface OrderItem {
  product_name?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderPreview {
  id: string;
  user_id?: string;
  beneficiary_id?: string;
  vendor_id: string;
  cart_total: number;
  total_amount?: number | string;
  status: string;
  items: OrderItem[];
  pickup_qr_code?: string;
  pickup_expires_at?: string;
  created_at: string;
  vendor_store_name?: string;
  beneficiary_name?: string;
}

type ScanStep = "scan" | "preview" | "success" | "error";

// ── Step-by-step guide shown on the right column ───────────────
const HOW_TO = [
  {
    step: 1,
    icon: QrCode,
    title: "Minta QR Penerima",
    desc: "Minta beneficiary membuka pesanannya dan tampilkan QR Pickup.",
    color: "bg-blue-600",
    ring: "ring-blue-200",
  },
  {
    step: 2,
    icon: ScanLine,
    title: "Scan atau Ketik Kode",
    desc: "Scan menggunakan kamera atau ketik kode QR secara manual.",
    color: "bg-emerald-600",
    ring: "ring-emerald-200",
  },
  {
    step: 3,
    icon: BadgeCheck,
    title: "Verifikasi & Konfirmasi",
    desc: "Periksa detail pesanan, pastikan sesuai, lalu konfirmasi pickup.",
    color: "bg-purple-600",
    ring: "ring-purple-200",
  },
  {
    step: 4,
    icon: Wallet,
    title: "Dana Masuk",
    desc: "Dana otomatis masuk ke wallet Anda setelah konfirmasi berhasil.",
    color: "bg-amber-500",
    ring: "ring-amber-200",
  },
];

const PLATFORM_FEE_RATE = 0.01; // 1% platform fee

function toAmount(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function getOrderTotal(order: OrderPreview | null): number {
  return toAmount(order?.cart_total ?? order?.total_amount);
}

function getItemSubtotal(item: OrderItem): number {
  const subtotal = toAmount(item.subtotal);
  return subtotal || toAmount(item.price) * toAmount(item.quantity);
}

function getNetEarned(order: OrderPreview | null): number {
  return getOrderTotal(order) * (1 - PLATFORM_FEE_RATE);
}

function normalizePickupCode(value: string): string {
  return value.trim().replace(/^NUTRIGUARD:ORDER:/i, "").toUpperCase();
}

function normalizeOrder(order: OrderPreview): OrderPreview {
  return {
    ...order,
    cart_total: getOrderTotal(order),
    items: (order.items || []).map((item) => ({
      ...item,
      quantity: toAmount(item.quantity),
      price: toAmount(item.price),
      subtotal: getItemSubtotal(item),
    })),
  };
}

export default function VendorQrScanner() {
  const [step, setStep] = useState<ScanStep>("scan");
  const [qrInput, setQrInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [order, setOrder] = useState<OrderPreview | null>(null);
  const [pickupCode, setPickupCode] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [netEarned, setNetEarned] = useState(0);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (overrideCode?: string) => {
    const code = normalizePickupCode(overrideCode ?? qrInput);
    if (!code) { toast.error("Masukkan kode QR terlebih dahulu"); return; }

    setSearching(true);
    setErrorMsg("");
    setPickupCode(code);
    try {
      const result = normalizeOrder(await apiFetch(`/orders/pickup/preview?qr_code=${encodeURIComponent(code)}`) as OrderPreview);
      setNetEarned(getNetEarned(result));
      setOrder(result);
      setStep("preview");
      setShowConfirmDialog(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      try {
        const orders = await apiFetch("/orders?status=pending&page_size=100") as { items: OrderPreview[] };
        const found = orders.items?.find((o) => o.pickup_qr_code === code);
        if (found) {
          const result = normalizeOrder(found);
          setNetEarned(getNetEarned(result));
          setOrder(result);
          setStep("preview");
          setShowConfirmDialog(true);
        } else {
          setErrorMsg(msg || "QR code tidak ditemukan atau tidak valid");
          setStep("error");
        }
      } catch {
        setErrorMsg(msg || "QR code tidak ditemukan");
        setStep("error");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!order) return;
    const code = pickupCode || normalizePickupCode(qrInput);
    setConfirming(true);
    try {
      const result = normalizeOrder(await apiFetch(`/orders/${order.id}/confirm-pickup`, {
        method: "POST",
        body: JSON.stringify({ qr_code: code }),
      }) as OrderPreview);
      setNetEarned(getNetEarned(result));
      setOrder(result);
      setStep("success");
      setShowConfirmDialog(false);
      toast.success("Pickup berhasil dikonfirmasi! Dana masuk ke wallet Anda.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Konfirmasi gagal";
      toast.error(msg);
      setErrorMsg(msg);
      setStep("error");
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setStep("scan");
    setQrInput("");
    setOrder(null);
    setPickupCode("");
    setShowConfirmDialog(false);
    setErrorMsg("");
    setNetEarned(0);
    setCameraMode(false);
    setCameraError(null);
  };

  /** Called when camera scans a QR — auto-fill & search */
  const handleCameraScan = (raw: string) => {
    const code = normalizePickupCode(raw);
    setQrInput(code);
    setCameraMode(false);
    void handleSearch(code);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setSearching(true);
      
      const tempId = "temp-qr-reader";
      let el = document.getElementById(tempId);
      if (!el) {
        el = document.createElement("div");
        el.id = tempId;
        el.style.display = "none";
        document.body.appendChild(el);
      }
      
      const html5QrCode = new Html5Qrcode(tempId);
      const decodedText = await html5QrCode.scanFile(file, false);
      
      const code = normalizePickupCode(decodedText);
      setQrInput(code);
      setCameraMode(false);
      void handleSearch(code);
    } catch {
      toast.error("Gagal membaca QR dari gambar. Pastikan gambar jelas.");
      setErrorMsg("Gambar QR tidak dapat dibaca");
      setStep("error");
    } finally {
      setIsUploading(false);
      setSearching(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Active step indicator for guide ───────────────────────────
  const activeGuideStep = step === "scan" ? 1 : step === "preview" ? 3 : step === "success" ? 4 : 1;

  return (
    <DashboardLayout title="Scan QR Pickup" subtitle="Konfirmasi penerimaan pesanan dari beneficiary">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT: Scanner Panel (3/5) ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* ── STEP: Scan ── */}
          {step === "scan" && (
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Header gradient */}
              <div
                className="relative p-8 text-center"
                style={{ background: "linear-gradient(135deg, #0f766e 0%, #059669 60%, #047857 100%)" }}
              >
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-teal-200/10 blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-4 mx-auto">
                    {cameraMode ? (
                      <Camera className="h-10 w-10 text-white" aria-hidden="true" />
                    ) : (
                      <QrCode className="h-10 w-10 text-white" aria-hidden="true" />
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-white mb-1">Scan QR Pickup</h2>
                  <p className="text-white/70 text-sm">
                    {cameraMode ? "Arahkan kamera ke QR penerima" : "Ketik atau tempel kode dari QR penerima"}
                  </p>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex p-3 gap-2 border-b border-border">
                <button
                  type="button"
                  onClick={() => { setCameraMode(false); setCameraError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    !cameraMode
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Keyboard className="h-4 w-4" aria-hidden="true" />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => { setCameraMode(true); setCameraError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    cameraMode
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Kamera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" aria-hidden="true" />}
                  {isUploading ? "Membaca..." : "Upload"}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>

              <div className="p-6 space-y-4">
                {/* ── Camera mode ── */}
                {cameraMode ? (
                  <div className="space-y-3">
                    {cameraError ? (
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Kamera Tidak Tersedia</p>
                          <p className="text-xs text-muted-foreground mt-1">{cameraError}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setCameraMode(false); setCameraError(null); }}
                          className="text-sm text-emerald-600 hover:underline font-medium"
                        >
                          Gunakan input manual →
                        </button>
                      </div>
                    ) : (
                      <>
                        <QrCameraScanner
                          onScan={handleCameraScan}
                          onError={(err) => setCameraError(err)}
                          className="h-[min(62vh,560px)] min-h-[360px] w-full"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Pastikan QR code terlihat jelas di dalam bingkai hijau
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  /* ── Manual mode ── */
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        id="qr-input"
                        placeholder="Contoh: 4A9B2C1D..."
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="font-mono text-sm tracking-widest h-11"
                        autoFocus
                        aria-label="Kode QR Pickup"
                      />
                      <Button
                        onClick={() => handleSearch()}
                        disabled={searching || !qrInput.trim()}
                        className="shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-700 h-11 px-5"
                      >
                        {searching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" aria-hidden="true" />
                        )}
                        {searching ? "Mencari..." : "Cari"}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Tekan <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary text-[10px] font-mono">Enter</kbd> untuk mencari
                    </p>

                    {/* Tips */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[
                        { icon: QrCode, title: "QR Otomatis", desc: "Kode terisi saat scan dari kamera", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                        { icon: Package, title: "Konfirmasi Dulu", desc: "Periksa item sebelum konfirmasi", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                      ].map(({ icon: Icon, title, desc, color, bg }, i) => (
                        <div key={i} className={`rounded-2xl ${bg} p-4 text-center`}>
                          <Icon className={`mx-auto mb-2 h-5 w-5 ${color}`} aria-hidden="true" />
                          <p className="text-xs font-semibold text-foreground mb-0.5">{title}</p>
                          <p className="text-[11px] text-muted-foreground">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          )}

          {/* ── STEP: Preview Order ── */}
          {step === "preview" && order && (
            <div className="space-y-4">
              {/* Valid banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                  <CheckCircle2 className="h-4.5 w-4.5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">QR Valid & Ditemukan</p>
                  <p className="text-xs text-muted-foreground">Periksa detail di bawah sebelum mengkonfirmasi</p>
                </div>
              </div>

              {/* Order detail card */}
              <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-5 py-3 bg-secondary/40 border-b border-border">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-semibold text-foreground">Item Pesanan</span>
                  {order.vendor_store_name && (
                    <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Store className="h-3.5 w-3.5" aria-hidden="true" />
                      {order.vendor_store_name}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
                        <Package className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {item.product_name || `Produk ${i + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatIDR(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground flex-shrink-0">
                        {formatIDR(item.subtotal || item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total + Net */}
                <div className="border-t border-border bg-secondary/20 p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Pesanan</span>
                    <span className="font-bold text-foreground">{formatIDR(order.cart_total)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      <span className="text-sm font-semibold text-foreground">Dana masuk ke wallet</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-600">
                        {formatIDR(order.cart_total * (1 - PLATFORM_FEE_RATE))}
                      </span>
                      <span className="ml-1.5 text-[10px] text-muted-foreground">setelah fee 1%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry warning */}
              {order.pickup_expires_at && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  QR berlaku hingga: <strong>{formatDate(order.pickup_expires_at)}</strong>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Batal
                </Button>
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={confirming}
                >
                  {confirming ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Konfirmasi Selesai</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: Success ── */}
          {step === "success" && (
            <div
              className="relative overflow-hidden rounded-3xl p-8 text-center shadow-xl shadow-emerald-900/10"
              style={{ background: "linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)" }}
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-5 mx-auto animate-in zoom-in-50 duration-500">
                  <CheckCircle2 className="h-12 w-12 text-white" aria-hidden="true" />
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-1">Pickup Selesai! 🎉</h2>
                <p className="text-white/70 text-sm mb-7">Dana telah dikreditkan ke wallet Anda</p>

                {/* Net earnings */}
                <div className="mb-6 rounded-2xl bg-white/15 backdrop-blur-sm p-5 mx-auto max-w-xs">
                  <p className="text-xs text-white/70 mb-1">Dana Masuk</p>
                  <p className="text-4xl font-black text-white mb-1">{formatIDR(netEarned)}</p>
                  <p className="text-xs text-white/50">Setelah potongan 1% platform fee</p>
                </div>

                {/* Order summary */}
                {order && (
                  <div className="mb-6 rounded-2xl bg-white/10 backdrop-blur-sm p-4 text-left space-y-1.5">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-white/80">{item.product_name || `Item ${i + 1}`} ×{item.quantity}</span>
                        <span className="text-white font-semibold">
                          {formatIDR(item.subtotal || item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-white/50 text-center pt-1">+{order.items.length - 3} item lainnya</p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-11"
                  onClick={reset}
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Scan QR Berikutnya
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP: Error ── */}
          {step === "error" && (
            <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-4 mx-auto">
                <XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">QR Tidak Valid</h2>
              <p className="text-sm text-muted-foreground mb-7 max-w-xs mx-auto">{errorMsg}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={reset}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Coba Lagi
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: How-to Guide (2/5) ── */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">
          {/* Guide card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600">
                <ScanLine className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground">Cara Scan Pickup</h3>
            </div>

            <ol className="space-y-4">
              {HOW_TO.map((item) => {
                const Icon = item.icon;
                const isActive = item.step === activeGuideStep;
                const isDone = item.step < activeGuideStep;
                return (
                  <li
                    key={item.step}
                    className={`flex items-start gap-3.5 transition-opacity duration-300 ${
                      isActive ? "opacity-100" : isDone ? "opacity-60" : "opacity-40"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${item.color} ${
                        isActive ? `ring-4 ${item.ring} scale-110` : ""
                      } transition-all duration-300`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-white" aria-hidden="true" />
                      ) : (
                        <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {item.title}
                        {isActive && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-normal">
                            <ArrowRight className="h-2.5 w-2.5" /> Sekarang
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Info card */}
          <div className="rounded-3xl border border-border bg-card p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Catatan Penting</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {[
                "QR Pickup hanya bisa digunakan sekali per pesanan",
                "Dana masuk ke wallet setelah pickup dikonfirmasi",
                "Platform fee 1% dipotong otomatis dari total pesanan",
                "Jika QR kadaluarsa, minta penerima refresh QR mereka",
              ].map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground mt-0.5">
                    {i + 1}
                  </span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      <Dialog
        open={showConfirmDialog && !!order}
        onOpenChange={(open: boolean) => {
          if (!confirming) setShowConfirmDialog(open);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg overflow-hidden rounded-3xl p-0">
          {order && (
            <>
              <div className="bg-emerald-600 px-6 py-5 text-white">
                <DialogHeader className="space-y-2 text-left">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
                    <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <DialogTitle className="text-xl font-black text-white">
                    Konfirmasi Pickup Pesanan
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white/75">
                    Pastikan barang sudah diterima pembeli sebelum menyelesaikan pesanan.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-emerald-700">Dana masuk ke wallet</p>
                      <p className="mt-1 text-2xl font-black text-emerald-700">
                        {formatIDR(getNetEarned(order))}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-emerald-600" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xs text-emerald-700/70">
                    Dari total {formatIDR(getOrderTotal(order))} setelah potongan fee 1%.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Kode pickup</span>
                    <span className="max-w-[13rem] truncate font-mono text-xs font-semibold text-foreground">
                      {pickupCode || order.pickup_qr_code}
                    </span>
                  </div>
                  {order.vendor_store_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Toko</span>
                      <span className="font-semibold text-foreground">{order.vendor_store_name}</span>
                    </div>
                  )}
                  {order.pickup_expires_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Berlaku hingga</span>
                      <span className="font-semibold text-foreground">{formatDate(order.pickup_expires_at)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-border">
                  <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-bold text-foreground">Ringkasan Pesanan</p>
                  </div>
                  <div className="divide-y divide-border">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                          <Package className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.product_name || `Produk ${i + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatIDR(item.price)} x {item.quantity}
                          </p>
                        </div>
                        <p className="flex-shrink-0 text-sm font-bold text-foreground">
                          {formatIDR(getItemSubtotal(item))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 border-t border-border bg-secondary/20 px-6 py-4 sm:space-x-0">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={confirming}
                >
                  Batalkan
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2 bg-emerald-600 font-semibold hover:bg-emerald-700"
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Konfirmasi
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
