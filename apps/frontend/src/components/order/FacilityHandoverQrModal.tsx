import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Clock, Copy, MapPin, QrCode, RefreshCw, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatIDR } from "@/lib/format";
import type { FacilityOrder } from "@/services/facility-orders";

type HandoverQr = { token: string; expiresAt: string };

function remainingTime(expiresAt: string) {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return { expired: seconds === 0, text: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}` };
}

export default function FacilityHandoverQrModal({ order, qr, onClose, onRenew, renewing }: {
  order: FacilityOrder | null;
  qr: HandoverQr | null;
  onClose: () => void;
  onRenew: () => void;
  renewing: boolean;
}) {
  const [countdown, setCountdown] = useState({ expired: false, text: "15:00" });

  useEffect(() => {
    if (!qr) return;
    const update = () => setCountdown(remainingTime(qr.expiresAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [qr]);

  async function copyCode() {
    if (!qr) return;
    try { await navigator.clipboard.writeText(qr.token); toast.success("Kode QR disalin"); }
    catch { toast.error("Kode tidak dapat disalin. Tampilkan QR untuk dipindai faskes."); }
  }

  return (
    <Dialog open={Boolean(order && qr)} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl [&>button]:hidden">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pb-5 pt-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between"><DialogTitle className="flex items-center gap-2 text-lg font-bold text-white"><QrCode className="h-5 w-5" /> QR Serah Terima</DialogTitle><button type="button" onClick={onClose} aria-label="Tutup QR" className="rounded-full p-1 hover:bg-white/20"><X className="h-4 w-4" /></button></div>
            <p className="mt-1 text-sm text-emerald-100">Tunjukkan QR ini kepada akun faskes saat barang tiba.</p>
          </DialogHeader>
        </div>
        {order && qr && <div className="space-y-4 bg-slate-50 px-5 py-5">
          {countdown.expired ? <div className="rounded-xl bg-red-50 p-5 text-center text-sm font-semibold text-red-700">QR telah kedaluwarsa. Buat QR baru sebelum serah terima.</div> : <div className="flex flex-col items-center gap-3">
            <div className="relative rounded-2xl bg-white p-4 shadow-lg ring-2 ring-emerald-100"><QRCodeCanvas value={qr.token} size={176} level="M" includeMargin className="rounded-xl" /><span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold text-white shadow">SERIBUASA</span></div>
            <span className="pt-2 font-mono text-xs font-bold tracking-widest text-slate-500">{qr.token.slice(-16)}</span>
          </div>}
          <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm"><span className="text-sm font-semibold text-slate-700">{order.health_facility_name || "Fasilitas kesehatan"}</span><span className="text-xs text-slate-500">#{order.id.slice(0, 8)}</span></div>
          {order.delivery_address && <div className="flex gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-600 shadow-sm"><MapPin className="h-4 w-4 shrink-0 text-emerald-600" />{order.delivery_address}</div>}
          <div className="rounded-xl bg-white p-3 shadow-sm"><div className="mb-2 flex items-center gap-1.5"><ShoppingBag className="h-3.5 w-3.5 text-slate-500" /><span className="text-xs font-semibold text-slate-500">ITEM PESANAN</span></div><ul className="space-y-1">{order.items.map((item) => <li key={item.product_id} className="flex justify-between gap-3 text-sm"><span className="text-slate-700">{item.product_name} ×{item.quantity}</span><span className="font-semibold text-slate-900">{formatIDR(item.subtotal)}</span></li>)}</ul><div className="mt-2 flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm font-bold"><span>Nilai pesanan</span><span className="text-emerald-600">{formatIDR(order.total_amount)}</span></div></div>
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${countdown.expired || Number(countdown.text.slice(0, 2)) < 3 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}><Clock className="h-4 w-4" />QR berlaku: <strong>{countdown.expired ? "Kedaluwarsa" : countdown.text}</strong></div>
          <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => { void copyCode(); }} disabled={countdown.expired}><Copy className="mr-2 h-4 w-4" /> Salin kode</Button><Button variant="outline" className="flex-1" onClick={onRenew} disabled={renewing}><RefreshCw className={`mr-2 h-4 w-4 ${renewing ? "animate-spin" : ""}`} /> QR baru</Button></div>
          <p className="text-center text-xs leading-5 text-slate-500">QR baru membatalkan QR sebelumnya. Pendanaan pesanan ini belum terhubung.</p>
        </div>}
      </DialogContent>
    </Dialog>
  );
}
