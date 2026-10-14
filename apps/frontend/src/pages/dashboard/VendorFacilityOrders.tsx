import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatIDR } from "@/lib/format";
import { dispatchFacilityOrder, listVendorFacilityOrders, type FacilityOrder } from "@/services/facility-orders";
import { RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";

export default function VendorFacilityOrders() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listVendorFacilityOrders();
      setOrders(rows);
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

  return <DashboardLayout title="Pesanan Faskes" subtitle="Siapkan pesanan dan kirim langsung ke fasilitas kesehatan tujuan.">
    <div className="mx-auto max-w-[1000px] space-y-5"><div className="flex justify-end"><Button variant="outline" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" /> Segarkan</Button></div>
      {error && <p className="rounded-xl bg-destructive/5 p-4 text-destructive">{error}</p>}
      {loading ? <p className="p-6 text-muted-foreground">Memuat pesanan...</p> : orders.length === 0 ? <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">Belum ada pesanan dari faskes.</CardContent></Card> : orders.map((order) => <Card key={order.id} className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">{order.health_facility_name || "Faskes"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Pesanan {order.id.slice(0, 8)} · {formatDate(order.created_at)}</p></div><Badge variant="outline">{order.status === "pending" ? "Menunggu proses" : order.status === "processing" ? "Dalam pengiriman" : order.status === "received" ? "Diterima Faskes" : order.status === "completed" ? "Sudah disalurkan" : "Dibatalkan"}</Badge></CardHeader>
        <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Kirim ke: {order.delivery_address || "Alamat faskes belum diisi"}</p>{order.items.map((item) => <div key={item.product_id} className="flex justify-between text-sm"><span>{item.quantity}× {item.product_name}</span><span>{formatIDR(item.subtotal)}</span></div>)}<p className="border-t pt-3 font-semibold">Total {formatIDR(order.total_amount)}</p><p className="text-xs text-muted-foreground">{order.funding_status === "spent" ? "Dana pesanan sudah tercatat tersalurkan." : order.funding_status === "reserved" ? "Dana pesanan sudah dicadangkan." : "Pendanaan pesanan akan diperiksa saat diproses."}</p>
          {order.status === "pending" && <Button disabled={busy === order.id} onClick={() => { void dispatch(order.id); }}><Truck className="mr-2 h-4 w-4" /> Proses dan kirim</Button>}
          {order.receipt_status === "discrepancy" && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-800">Faskes melaporkan barang bermasalah: {order.discrepancy_notes}. Lengkapi barang dan minta Faskes memeriksa ulang.</p>}
          {order.receipt_status === "accepted" && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">Barang diterima Faskes. Pembayaran: {order.payout_status === "paid" ? "transfer tercatat" : order.payout_status === "approved" ? "disetujui Admin" : "menunggu persetujuan Admin"}. Batas transfer: {order.payout_due_at ? new Date(order.payout_due_at).toLocaleString("id-ID") : "—"}.</p>}
          {order.status === "processing" && !order.receipt_status && <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">Pesanan sedang menuju faskes. Faskes akan mengonfirmasi langsung dari halaman pesanannya setelah barang tiba.</p>}
          {order.status === "completed" && !order.distribution && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Barang sudah dikonfirmasi tiba dan menunggu diserahkan kepada keluarga tujuan.</p>}
          {order.distribution && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">Faskes sudah mencatat penyaluran kepada keluarga.</p>}
        </CardContent></Card>)}
    </div>
  </DashboardLayout>;
}
