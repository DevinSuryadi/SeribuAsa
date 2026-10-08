import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FacilityHandoverQrModal from "@/components/order/FacilityHandoverQrModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatIDR } from "@/lib/format";
import { createHandoverToken, dispatchFacilityOrder, listVendorFacilityOrders, type FacilityOrder } from "@/services/facility-orders";
import { QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function VendorFacilityOrders() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [qr, setQr] = useState<{ orderId: string; token: string; expiresAt: string } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listVendorFacilityOrders();
      setOrders(rows);
      setQr((current) => current && rows.some((order) => order.id === current.orderId && order.status === "processing") ? current : null);
      setError("");
    }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat pesanan faskes"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function dispatch(id: string) {
    setBusy(id);
    try { await dispatchFacilityOrder(id); toast.success("Pesanan siap dikirim"); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal memproses pesanan"); }
    finally { setBusy(""); }
  }

  async function showQr(id: string) {
    setBusy(id);
    try { const result = await createHandoverToken(id); setQr({ orderId: id, token: result.token, expiresAt: result.expires_at }); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal membuat QR"); }
    finally { setBusy(""); }
  }

  return <DashboardLayout title="Pesanan Faskes" subtitle="Siapkan pesanan dan tampilkan QR ketika menyerahkannya kepada fasilitas kesehatan.">
    <div className="mx-auto max-w-[1000px] space-y-5"><div className="flex justify-end"><Button variant="outline" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" /> Segarkan</Button></div>
      {error && <p className="rounded-xl bg-destructive/5 p-4 text-destructive">{error}</p>}
      {loading ? <p className="p-6 text-muted-foreground">Memuat pesanan...</p> : orders.length === 0 ? <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">Belum ada pesanan dari faskes.</CardContent></Card> : orders.map((order) => <Card key={order.id} className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">{order.health_facility_name || "Faskes"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Pesanan {order.id.slice(0, 8)} · {formatDate(order.created_at)}</p></div><Badge variant="outline">{order.status === "pending" ? "Menunggu proses" : order.status === "processing" ? "Dalam pengiriman" : order.status === "completed" ? "Diterima" : "Dibatalkan"}</Badge></CardHeader>
        <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Kirim ke: {order.delivery_address || "Alamat faskes belum diisi"}</p>{order.items.map((item) => <div key={item.product_id} className="flex justify-between text-sm"><span>{item.quantity}× {item.product_name}</span><span>{formatIDR(item.subtotal)}</span></div>)}<p className="border-t pt-3 font-semibold">Total {formatIDR(order.total_amount)}</p><p className="text-xs text-muted-foreground">{order.funding_status === "spent" ? "Dana pesanan sudah tercatat tersalurkan." : order.funding_status === "reserved" ? "Dana pesanan sudah dicadangkan." : "Pendanaan pesanan akan diperiksa saat diproses."}</p>
          {order.status === "pending" && <Button disabled={busy === order.id} onClick={() => { void dispatch(order.id); }}>Proses dan kirim</Button>}
          {order.status === "processing" && <Button variant="outline" disabled={busy === order.id} onClick={() => { void showQr(order.id); }}><QrCode className="mr-2 h-4 w-4" /> Tampilkan QR serah terima</Button>}
        </CardContent></Card>)}
      <FacilityHandoverQrModal order={qr ? orders.find((order) => order.id === qr.orderId) || null : null} qr={qr} onClose={() => setQr(null)} onRenew={() => { if (qr) void showQr(qr.orderId); }} renewing={Boolean(qr && busy === qr.orderId)} />
    </div>
  </DashboardLayout>;
}
