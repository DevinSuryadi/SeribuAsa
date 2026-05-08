import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Store,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Search,
  Package,
  AlertCircle,
  RefreshCw,
  Wallet,
  Loader2,
} from "lucide-react";
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
  user_id: string;
  vendor_id: string;
  cart_total: number;
  status: string;
  items: OrderItem[];
  pickup_qr_code?: string;
  pickup_expires_at?: string;
  created_at: string;
}

type ScanStep = "scan" | "preview" | "success" | "error";

export default function VendorQrScanner() {
  const [step, setStep] = useState<ScanStep>("scan");
  const [qrInput, setQrInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [order, setOrder] = useState<OrderPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [netEarned, setNetEarned] = useState(0);

  const handleSearch = async () => {
    const code = qrInput.trim().replace("NUTRIGUARD:ORDER:", "").toUpperCase();
    if (!code) { toast.error("Masukkan kode QR terlebih dahulu"); return; }

    setSearching(true);
    setErrorMsg("");
    try {
      // Attempt direct confirm
      const result = await apiFetch(`/orders/${code}/confirm-pickup`, {
        method: "POST",
        body: JSON.stringify({ qr_code: code }),
      }) as OrderPreview;
      setNetEarned((result.cart_total ?? 0) * 0.99);
      setOrder(result);
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      // Try fetching pending orders to preview
      try {
        const orders = await apiFetch("/orders?status=pending") as { items: OrderPreview[] };
        const found = orders.items?.find(
          (o) => o.pickup_qr_code === code
        );
        if (found) {
          setOrder(found);
          setStep("preview");
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
    const code = qrInput.trim().replace("NUTRIGUARD:ORDER:", "").toUpperCase();
    setConfirming(true);
    try {
      const result = await apiFetch(`/orders/${order.id}/confirm-pickup`, {
        method: "POST",
        body: JSON.stringify({ qr_code: code }),
      }) as OrderPreview;
      setNetEarned((result.cart_total ?? 0) * 0.99);
      setOrder(result);
      setStep("success");
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
    setErrorMsg("");
    setNetEarned(0);
  };

  return (
    <DashboardLayout title="Scan QR Pickup" role="vendor">
      <div className="mx-auto max-w-lg space-y-5 px-4 pb-10 pt-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Scan QR Pickup</h1>
          <p className="mt-1 text-sm text-slate-500">
            Scan QR code dari aplikasi penerima untuk mengkonfirmasi pengambilan barang
          </p>
        </div>

        {/* ── STEP: Scan ─────────────────────────────────────────────── */}
        {step === "scan" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
                <QrCode className="h-10 w-10 text-white" />
              </div>
            </div>

            <h2 className="mb-1 text-center text-lg font-bold text-slate-900">
              Masukkan Kode QR
            </h2>
            <p className="mb-5 text-center text-sm text-slate-500">
              Scan QR dari HP penerima atau ketik kodenya
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Contoh: 4A9B2C1D..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="font-mono text-sm tracking-wider"
                autoFocus
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !qrInput.trim()}
                className="shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Cari
              </Button>
            </div>

            {/* Info cards */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: QrCode, text: "Minta penerima buka pesanan di app", color: "text-emerald-600", bg: "bg-emerald-50" },
                { icon: Package, text: "Konfirmasi setelah barang diserahkan", color: "text-blue-600", bg: "bg-blue-50" },
              ].map(({ icon: Icon, text, color, bg }, i) => (
                <div key={i} className={`rounded-2xl ${bg} p-3 text-center`}>
                  <Icon className={`mx-auto mb-1.5 h-5 w-5 ${color}`} />
                  <p className="text-xs text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: Preview Order ────────────────────────────────────── */}
        {step === "preview" && order && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">QR Valid!</p>
                  <p className="text-xs text-slate-500">Pesanan ditemukan — periksa detail sebelum konfirmasi</p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Item Pesanan</span>
                </div>
                <ul className="space-y-1.5">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700">
                        {item.product_name || `Item ${i + 1}`} ×{item.quantity}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatIDR(item.subtotal || item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-dashed border-slate-200 pt-2.5">
                  <span className="text-sm font-bold text-slate-700">Total</span>
                  <span className="text-base font-black text-emerald-600">
                    {formatIDR(order.cart_total)}
                  </span>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Dana masuk ke wallet Anda</span>
                </div>
                <span className="text-sm font-black text-emerald-700">
                  {formatIDR(order.cart_total * 0.99)}
                  <span className="ml-1 text-[10px] font-normal text-emerald-600">(net -1%)</span>
                </span>
              </div>

              {order.pickup_expires_at && (
                <p className="mb-4 text-center text-xs text-amber-600">
                  ⏱ QR berlaku hingga: {formatDate(order.pickup_expires_at)}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={reset}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Memproses...</>
                  ) : (
                    <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Konfirmasi Selesai</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Success ─────────────────────────────────────────── */}
        {step === "success" && (
          <div className="rounded-3xl border-0 bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white shadow-xl shadow-emerald-200">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-1 text-2xl font-black">Selesai! 🎉</h2>
            <p className="mb-4 text-sm text-emerald-100">Pickup berhasil dikonfirmasi</p>

            <div className="mb-6 rounded-2xl bg-white/15 p-4 backdrop-blur">
              <p className="text-xs text-emerald-100">Dana masuk ke wallet Anda</p>
              <p className="text-3xl font-black">{formatIDR(netEarned)}</p>
              <p className="text-xs text-emerald-200">Setelah potongan 1% platform fee</p>
            </div>

            <Button
              className="w-full gap-2 bg-white text-emerald-700 hover:bg-emerald-50"
              onClick={reset}
            >
              <QrCode className="h-4 w-4" />
              Scan QR Berikutnya
            </Button>
          </div>
        )}

        {/* ── STEP: Error ────────────────────────────────────────────── */}
        {step === "error" && (
          <div className="rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-slate-900">QR Tidak Valid</h2>
            <p className="mb-5 text-sm text-slate-500">{errorMsg}</p>
            <Button
              variant="outline"
              className="w-full gap-2 border-slate-200"
              onClick={reset}
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
