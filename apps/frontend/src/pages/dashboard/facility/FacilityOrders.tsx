import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatIDR } from "@/lib/format";
import {
  cancelFacilityOrder,
  listFacilityOrders,
  type FacilityOrder,
} from "@/services/facility-orders";
import { ArrowRight, CheckCircle2, Package, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function orderStatus(order: FacilityOrder) {
  if (order.status === "cancelled") return "Dibatalkan";
  if (order.distribution) return "Sudah disalurkan";
  if (order.status === "completed") return "Menunggu bukti";
  if (order.status === "processing") return "Dikirim vendor";
  return "Menunggu vendor";
}

export default function FacilityOrders() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function refresh(forceRefresh = false) {
    setLoading(true);
    try { setOrders(await listFacilityOrders(undefined, forceRefresh)); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat pesanan"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function cancel(id: string) {
    if (!window.confirm("Batalkan pesanan ini? Stok produk dan dana yang dicadangkan akan dikembalikan.")) return;
    setBusy(id);
    try { await cancelFacilityOrder(id); toast.success("Pesanan dibatalkan"); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal membatalkan pesanan"); }
    finally { setBusy(""); }
  }

  return <DashboardLayout title="Pesanan Pangan" subtitle="Pantau pesanan dari vendor. Bukti penerimaan dicatat pada halaman bantuan masing-masing keluarga.">
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => { void refresh(true); }} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Segarkan</Button><Button asChild><Link to="/dashboard/health-facility/catalog"><Plus className="mr-2 h-4 w-4" /> Pesan Pangan</Link></Button></div>
      {error && <p role="alert" className="rounded-xl bg-destructive/5 p-4 text-destructive">{error}</p>}
      {loading ? <p className="p-6 text-muted-foreground">Memuat pesanan...</p> : orders.length === 0 ? <Card className="rounded-2xl"><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><Package className="h-8 w-8 text-primary" /><p>Belum ada pesanan faskes.</p><Button asChild variant="outline"><Link to="/dashboard/health-facility/catalog">Lihat katalog</Link></Button></CardContent></Card> : orders.map((order) => <Card key={order.id} className="rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-base">Untuk {order.family_name || "Keluarga"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Pesanan {order.id.slice(0, 8)} · {formatDate(order.created_at)} · {order.vendor_name || "Vendor"}</p></div><Badge variant="outline">{orderStatus(order)}</Badge></CardHeader>
        <CardContent className="space-y-3"><div className="space-y-1">{order.items.map((item) => <div key={item.product_id} className="flex justify-between gap-3 text-sm"><span>{item.quantity}× {item.product_name}</span><span>{formatIDR(item.subtotal)}</span></div>)}</div>
          <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatIDR(order.total_amount)}</span></div>
          {order.status === "processing" && <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">Pesanan sedang dikirim vendor. Setelah bantuan benar-benar diserahkan kepada keluarga, unggah bukti penerimaannya pada halaman keluarga.</p>}
          {order.status === "completed" && !order.distribution && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Pesanan lama ini belum memiliki bukti penerimaan keluarga. Lengkapi bukti melalui halaman keluarga.</p>}
          {order.distribution && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> Bantuan sudah disalurkan</p><p className="mt-1 text-xs">Diterima oleh {order.distribution.recipient_name || "anggota keluarga"} pada {formatDate(order.distribution.distributed_at)}.</p></div>}
          {order.status === "pending" && <Button variant="outline" disabled={busy === order.id} onClick={() => { void cancel(order.id); }}>Batalkan pesanan</Button>}
          {(order.status === "processing" || (order.status === "completed" && !order.distribution)) && <Button asChild><Link to={`/dashboard/health-facility/families/${order.family_id}/redemptions`}>Buka bantuan keluarga <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
          {order.distribution && <Button asChild variant="outline"><Link to={`/dashboard/health-facility/families/${order.family_id}/redemptions`}>Lihat bukti penerimaan</Link></Button>}
        </CardContent>
      </Card>)}
    </div>
  </DashboardLayout>;
}
