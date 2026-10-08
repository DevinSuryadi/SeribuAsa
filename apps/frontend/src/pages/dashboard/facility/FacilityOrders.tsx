import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatIDR } from "@/lib/format";
import { cancelFacilityOrder, listFacilityOrders, type FacilityOrder } from "@/services/facility-orders";
import { Package, Plus, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const statusLabel: Record<FacilityOrder["status"], string> = {
  pending: "Menunggu vendor", processing: "Dalam pengiriman", completed: "Diterima faskes", cancelled: "Dibatalkan",
};

export default function FacilityOrders() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function refresh() {
    setLoading(true);
    try { setOrders(await listFacilityOrders()); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat pesanan"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function cancel(id: string) {
    if (!window.confirm("Batalkan pesanan ini? Stok produk akan dikembalikan.")) return;
    setBusy(id);
    try { await cancelFacilityOrder(id); toast.success("Pesanan dibatalkan"); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal membatalkan pesanan"); }
    finally { setBusy(""); }
  }

  return <DashboardLayout title="Pesanan Pangan" subtitle="Pantau pesanan untuk keluarga dan bukti penerimaan di fasilitas kesehatan.">
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={refresh}><RefreshCw className="mr-2 h-4 w-4" /> Segarkan</Button><Button asChild><Link to="/dashboard/health-facility/catalog"><Plus className="mr-2 h-4 w-4" /> Pesan Pangan</Link></Button></div>
      {error && <p className="rounded-xl bg-destructive/5 p-4 text-destructive">{error}</p>}
      {loading ? <p className="p-6 text-muted-foreground">Memuat pesanan...</p> : orders.length === 0 ? <Card className="rounded-2xl"><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><Package className="h-8 w-8 text-primary" /><p>Belum ada pesanan faskes.</p><Button asChild variant="outline"><Link to="/dashboard/health-facility/catalog">Lihat katalog</Link></Button></CardContent></Card> : orders.map((order) => <Card key={order.id} className="rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">{order.family_name || "Keluarga"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Pesanan {order.id.slice(0, 8)} · {formatDate(order.created_at)} · {order.vendor_name || "Vendor"}</p></div><Badge variant="outline">{statusLabel[order.status]}</Badge></CardHeader>
        <CardContent className="space-y-3"><div className="space-y-1">{order.items.map((item) => <div key={item.product_id} className="flex justify-between gap-3 text-sm"><span>{item.quantity}× {item.product_name}</span><span>{formatIDR(item.subtotal)}</span></div>)}</div>
          <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatIDR(order.total_amount)}</span></div>
          <p className="text-xs text-muted-foreground">{order.funding_status === "spent" ? "Dana donasi tersalurkan dan tercatat untuk donatur." : order.funding_status === "reserved" ? "Dana donasi dicadangkan hingga QR penerimaan dikonfirmasi." : "Pesanan lama ini belum memiliki catatan pendanaan pool."}</p>
          {order.received_at && <p className="text-sm text-emerald-700">Diterima faskes pada {formatDate(order.received_at)}.</p>}
          {order.status === "pending" && <Button variant="outline" disabled={busy === order.id} onClick={() => cancel(order.id)}>Batalkan pesanan</Button>}
          {order.status === "processing" && <Button asChild><Link to="/dashboard/health-facility/handover"><QrCode className="mr-2 h-4 w-4" /> Scan QR vendor</Link></Button>}
          {order.status === "completed" && <Button asChild variant="outline"><Link to={`/dashboard/health-facility/families/${order.family_id}/redemptions`}>Lihat riwayat penukaran</Link></Button>}
        </CardContent>
      </Card>)}
    </div>
  </DashboardLayout>;
}
