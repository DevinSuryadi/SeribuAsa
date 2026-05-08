import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { QrCode, Clock, Store, ShoppingBag, X, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getOrderPickupQr, cancelOrder } from "@/services/wallet";
import { formatIDR } from "@/lib/format";


interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface PickupQRData {
  order_id: string;
  qr_code: string;
  qr_value: string;
  total_amount: number;
  pickup_expires_at: string | null;
  cancel_deadline: string | null;
  vendor_name: string | null;
  items: OrderItem[];
  status: string;
}

interface Props {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
  onCancelled?: () => void;
}

/** Formats remaining time as MM:SS or HH:MM */
function formatCountdown(isoString: string): { text: string; urgent: boolean } {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return { text: "Kadaluarsa", urgent: true };
  const totalSecs = Math.floor(diff / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const urgent = diff < 5 * 60 * 1000; // < 5 min
  if (hours > 0) return { text: `${hours}j ${mins}m`, urgent: diff < 30 * 60 * 1000 };
  return { text: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`, urgent };
}

export default function OrderQrModal({ orderId, open, onClose, onCancelled }: Props) {
  const [qrData, setQrData] = useState<PickupQRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [qrCountdown, setQrCountdown] = useState<{ text: string; urgent: boolean } | null>(null);

  const fetchQR = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await getOrderPickupQr(orderId);
      setQrData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat QR";
      toast.error(msg);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [orderId, onClose]);

  useEffect(() => {
    if (open && orderId) fetchQR();
    else setQrData(null);
  }, [open, orderId, fetchQR]);

  // Countdown timers
  useEffect(() => {
    if (!qrData) return;
    const interval = setInterval(() => {
      if (qrData.pickup_expires_at) {
        setQrCountdown(formatCountdown(qrData.pickup_expires_at));
      }
      if (qrData.cancel_deadline) {
        const diff = new Date(qrData.cancel_deadline).getTime() - Date.now();
        setCanCancel(diff > 0);
        if (diff > 0) {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setCancelCountdown(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
        } else {
          setCancelCountdown(null);
          setCanCancel(false);
        }
      }
    }, 1000);
    // Init immediately
    if (qrData.pickup_expires_at) setQrCountdown(formatCountdown(qrData.pickup_expires_at));
    if (qrData.cancel_deadline) {
      const diff = new Date(qrData.cancel_deadline).getTime() - Date.now();
      setCanCancel(diff > 0);
    }
    return () => clearInterval(interval);
  }, [qrData]);

  const handleCancel = async () => {
    if (!orderId || !canCancel) return;
    setCancelling(true);
    try {
      await cancelOrder(orderId);
      toast.success("Pesanan berhasil dibatalkan. Saldo dikembalikan.");
      onCancelled?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan pesanan";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  // Simple QR SVG generator using a grid pattern
  const QRCodeDisplay = ({ value }: { value: string }) => {
    // Use a simple visual placeholder — in production use qrcode.react
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative rounded-2xl bg-white p-4 shadow-lg ring-2 ring-emerald-100">
          {/* QR visual placeholder with actual code display */}
          <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="grid grid-cols-7 gap-0.5 p-2 opacity-90">
              {Array.from({ length: 49 }, (_, i) => {
                const isActive = [0,1,2,3,4,5,6,7,14,42,43,44,45,46,47,48,6,13,20,27,34,41,10,11,12,21,22,23,30,31,32].includes(i);
                const charCode = value.charCodeAt(i % value.length) || 0;
                const show = (charCode + i) % 3 !== 0 || isActive;
                return (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-[2px] ${show ? "bg-white" : "bg-transparent"}`}
                  />
                );
              })}
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold text-white shadow">
              NUTRIGUARD
            </div>
          </div>
        </div>
        <p className="mt-3 font-mono text-xs font-bold tracking-widest text-slate-500">
          {value.slice(-16)}
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pb-5 pt-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
                <QrCode className="h-5 w-5" /> QR Pickup
              </DialogTitle>
              <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-emerald-100">Tunjukkan QR ini ke vendor</p>
          </DialogHeader>
        </div>

        <div className="space-y-4 bg-slate-50 px-5 py-5">
          {loading && (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          )}

          {!loading && qrData && (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <QRCodeDisplay value={qrData.qr_value} />
              </div>

              {/* Vendor info */}
              {qrData.vendor_name && (
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                  <Store className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">{qrData.vendor_name}</span>
                </div>
              )}

              {/* Items */}
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500">ITEM PESANAN</span>
                </div>
                <ul className="space-y-1">
                  {qrData.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700">{item.name} ×{item.quantity}</span>
                      <span className="font-semibold text-slate-900">
                        {formatIDR(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-dashed border-slate-200 pt-2">
                  <span className="text-sm font-bold text-slate-700">Total</span>
                  <span className="text-sm font-black text-emerald-600">
                    {formatIDR(qrData.total_amount)}
                  </span>
                </div>
              </div>

              {/* QR Expiry countdown */}
              {qrCountdown && (
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold
                  ${qrCountdown.urgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                  {qrCountdown.urgent
                    ? <AlertTriangle className="h-4 w-4 shrink-0" />
                    : <Clock className="h-4 w-4 shrink-0" />}
                  <span>
                    QR berlaku: <span className="font-black">{qrCountdown.text}</span>
                  </span>
                </div>
              )}

              {/* Cancel button with countdown */}
              <div className="space-y-2">
                {canCancel ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    <XCircle className="h-4 w-4" />
                    {cancelling ? "Membatalkan..." : `Batalkan (${cancelCountdown})`}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    Pesanan sudah tidak bisa dibatalkan (lewat 30 menit)
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
