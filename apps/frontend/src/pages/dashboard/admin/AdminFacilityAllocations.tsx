import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatIDR } from "@/lib/format";
import {
  approveFacilityAllocation, listAdminFacilityOrders, rejectFacilityAllocation,
  type FacilityOrder,
} from "@/services/facility-orders";
import { toast } from "sonner";

export default function AdminFacilityAllocations() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function refresh() {
    setLoading(true);
    try { setOrders(await listAdminFacilityOrders()); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat permintaan"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function approve(order: FacilityOrder) {
    if (!window.confirm(`Setujui alokasi ${formatIDR(order.total_amount)} untuk pesanan ini? Dana donasi akan dicadangkan.`)) return;
    setBusy(order.id);
    try { await approveFacilityAllocation(order.id); toast.success("Alokasi disetujui; Vendor dapat memproses pesanan."); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Persetujuan gagal"); }
    finally { setBusy(""); }
  }
  async function reject(order: FacilityOrder) {
    const reason = reasons[order.id]?.trim();
    if (!reason || reason.length < 5) { toast.error("Alasan penolakan minimal 5 karakter"); return; }
    if (!window.confirm("Tolak permintaan ini dan kembalikan stok produk?")) return;
    setBusy(order.id);
    try { await rejectFacilityAllocation(order.id, reason); toast.success("Permintaan ditolak."); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Penolakan gagal"); }
    finally { setBusy(""); }
  }

  const pending = orders.filter((order) => order.allocation_status === "requested");
  const decided = orders.filter((order) => order.allocation_status !== "requested");
  return <DashboardLayout title="Persetujuan Alokasi Faskes" subtitle="Tinjau permintaan bantuan sebelum dana donasi dicadangkan dan pesanan diteruskan ke Vendor." actions={<Button variant="outline" disabled={loading} onClick={() => void refresh()}>Perbarui</Button>}>
    <div className="mx-auto max-w-5xl space-y-4">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? <p className="p-6 text-muted-foreground">Memuat permintaan...</p> : <>
        <h2 className="font-semibold">Menunggu keputusan ({pending.length})</h2>
        {pending.length === 0 && <p className="rounded-xl border bg-white p-5 text-muted-foreground">Tidak ada permintaan menunggu persetujuan.</p>}
        {pending.map((order) => <article key={order.id} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">#{order.id.slice(0, 8)} · {order.health_facility_name || "Faskes"}</h3><p className="text-sm text-muted-foreground">Keluarga {order.family_name || "—"} · Vendor {order.vendor_name || "—"} · Daerah {order.service_regency_code || "—"}</p></div><strong>{formatIDR(order.total_amount)}</strong></div>
          <ul className="text-sm">{order.items.map((item) => <li key={item.product_id}>{item.quantity}× {item.product_name} · {formatIDR(item.subtotal)}</li>)}</ul>
          <p className="text-xs text-muted-foreground">Pendanaan akan diperiksa kembali saat disetujui. {order.funding_status === "not_connected" ? "Dana belum dicadangkan." : `Status dana: ${order.funding_status}.`}</p>
          <Textarea aria-label={`Alasan penolakan pesanan ${order.id.slice(0, 8)}`} placeholder="Alasan bila ditolak" maxLength={1000} value={reasons[order.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [order.id]: event.target.value }))} />
          <div className="flex flex-wrap gap-2"><Button disabled={busy === order.id} onClick={() => void approve(order)}>Setujui alokasi</Button><Button variant="outline" disabled={busy === order.id} onClick={() => void reject(order)}>Tolak dengan alasan</Button></div>
        </article>)}
        {decided.length > 0 && <><h2 className="pt-4 font-semibold">Riwayat keputusan</h2><div className="space-y-2">{decided.map((order) => <div key={order.id} className="rounded-xl border bg-white p-4 text-sm"><strong>#{order.id.slice(0, 8)} · {order.health_facility_name || "Faskes"}</strong><span className="ml-2">{order.allocation_status === "approved" ? "Disetujui" : order.allocation_status === "rejected" ? "Ditolak" : order.allocation_status === "cancelled" ? "Dibatalkan" : "Order lama"}</span>{order.allocation_reason && <p className="mt-1 text-muted-foreground">Alasan: {order.allocation_reason}</p>}</div>)}</div></>}
      </>}
    </div>
  </DashboardLayout>;
}
