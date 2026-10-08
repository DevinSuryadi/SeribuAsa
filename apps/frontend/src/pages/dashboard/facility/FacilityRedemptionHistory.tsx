import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIDR } from "@/lib/format";
import { listFacilityRedemptions, type FacilityOrder } from "@/services/facility-orders";
import { ArrowLeft, CheckCircle2, History, RefreshCw } from "lucide-react";

function formatReceivedAt(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
}

export default function FacilityRedemptionHistory() {
  const { familyId } = useParams<{ familyId: string }>();
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setOrders([]);
    listFacilityRedemptions(familyId)
      .then((rows) => { if (active) setOrders(rows); })
      .catch((err: unknown) => { if (active) { setOrders([]); setError(err instanceof Error ? err.message : "Gagal memuat riwayat penukaran"); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [familyId, refreshKey]);

  const totalItems = useMemo(() => orders.reduce((sum, order) =>
    sum + order.items.reduce((count, item) => count + item.quantity, 0), 0), [orders]);
  const familyCount = useMemo(() => new Set(orders.map((order) => order.family_id)).size, [orders]);
  const vendorCount = useMemo(() => new Set(orders.map((order) => order.vendor_id)).size, [orders]);
  const familyName = familyId ? orders[0]?.family_name : null;

  return (
    <DashboardLayout title="Riwayat Penukaran" subtitle={familyId ? `Serah terima pesanan ${familyName ? `untuk ${familyName}` : "keluarga ini"}.` : "Serah terima pesanan seluruh keluarga di fasilitas kesehatan Anda."}>
      <div className="mx-auto max-w-[1100px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {familyId ? <Button asChild variant="ghost" className="pl-0 text-primary"><Link to={`/dashboard/health-facility/families/${familyId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke ringkasan</Link></Button> : <span />}
          <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Perbarui</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="flex items-center gap-3 p-5"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">Serah terima selesai</p><p className="text-2xl font-bold">{loading ? "…" : orders.length}</p></div></CardContent></Card>
          <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="flex items-center gap-3 p-5"><span className="rounded-xl bg-primary/10 p-3 text-primary"><History className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">Jumlah item diterima</p><p className="text-2xl font-bold">{loading ? "…" : totalItems}</p></div></CardContent></Card>
          <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="flex items-center gap-3 p-5"><span className="rounded-xl bg-amber-50 p-3 text-amber-700"><History className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">{familyId ? "Vendor tercatat" : "Keluarga tercatat"}</p><p className="text-2xl font-bold">{loading ? "…" : familyId ? vendorCount : familyCount}</p></div></CardContent></Card>
        </div>

        {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
        {loading ? <Card className="rounded-2xl"><CardContent className="p-8 text-center text-muted-foreground">Memuat riwayat penukaran...</CardContent></Card> : !error && orders.length === 0 ? <Card className="rounded-2xl border-dashed"><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><History className="h-8 w-8 text-primary/60" /><h2 className="font-semibold">Belum ada serah terima</h2><p className="max-w-sm text-sm text-muted-foreground">Riwayat akan muncul setelah vendor menampilkan QR dan fasilitas kesehatan mengonfirmasi penerimaan pesanan.</p><Button asChild variant="outline"><Link to="/dashboard/health-facility/orders">Lihat pesanan</Link></Button></CardContent></Card> : orders.map((order) => (
          <Card key={order.id} className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1"><CardTitle className="text-base">{order.family_name || "Keluarga"}</CardTitle><p className="text-xs text-muted-foreground">Pesanan {order.id.slice(0, 8)} · {order.vendor_name || "Vendor"}</p>{order.received_at && <p className="text-xs text-muted-foreground">Diterima {formatReceivedAt(order.received_at)}</p>}</div>
              <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Diterima faskes</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 rounded-xl bg-secondary/20 p-4">{order.items.map((item) => <div key={item.product_id} className="flex justify-between gap-3 text-sm"><span>{item.quantity}× {item.product_name}</span><span>{formatIDR(item.subtotal)}</span></div>)}</div>
              <div className="flex justify-between border-t pt-3 text-sm font-semibold"><span>Nilai pesanan tercatat</span><span>{formatIDR(order.total_amount)}</span></div>
              {order.receipt_notes && <p className="text-sm text-muted-foreground">Catatan penerimaan: {order.receipt_notes}</p>}
              {!familyId && <Button asChild size="sm" variant="outline"><Link to={`/dashboard/health-facility/families/${order.family_id}/redemptions`}>Lihat riwayat keluarga</Link></Button>}
            </CardContent>
          </Card>
        ))}
        <p className="text-xs leading-5 text-muted-foreground">Riwayat ini mencatat penerimaan dari vendor oleh faskes. Penyaluran kepada keluarga dan penggunaan dana donasi belum dicatat dalam alur ini.</p>
      </div>
    </DashboardLayout>
  );
}
