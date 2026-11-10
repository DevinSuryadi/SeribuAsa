import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatIDR } from "@/lib/format";
import {
  confirmVendorFacilityOrder,
  dispatchFacilityOrder,
  listVendorFacilityOrders,
  rejectVendorFacilityOrder,
  type FacilityOrder,
} from "@/services/facility-orders";
import { RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<FacilityOrder["status"], string> = {
  pending_approval: "Menunggu pendanaan",
  pending: "Menunggu konfirmasi",
  processing: "Diproses vendor",
  shipped: "Dalam pengiriman",
  received: "Diterima Faskes",
  completed: "Sudah disalurkan",
  cancelled: "Dibatalkan",
  rejected: "Ditolak",
};

export default function VendorFacilityOrders() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [rejectionOrder, setRejectionOrder] = useState<FacilityOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setOrders(await listVendorFacilityOrders());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan faskes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function runAction(
    id: string,
    action: () => Promise<FacilityOrder>,
    successMessage: string,
  ): Promise<boolean> {
    if (busy) return false;
    setBusy(id);
    try {
      const updated = await action();
      setOrders((rows) => rows.map((order) => order.id === updated.id ? updated : order));
      toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses pesanan");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function reject(event: React.FormEvent) {
    event.preventDefault();
    const reason = rejectionReason.trim();
    if (!rejectionOrder || !reason) return;
    const saved = await runAction(
      rejectionOrder.id,
      () => rejectVendorFacilityOrder(rejectionOrder.id, reason),
      "Pesanan ditolak. Stok dan dana yang dicadangkan telah dikembalikan.",
    );
    if (saved) setRejectionOrder(null);
  }

  return (
    <DashboardLayout title="Pesanan Faskes" subtitle="Siapkan pesanan dan kirim langsung ke fasilitas kesehatan tujuan.">
      <div className="mx-auto max-w-[1000px] space-y-5">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading || Boolean(busy)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Segarkan
          </Button>
        </div>
        {error && <p className="rounded-xl bg-destructive/5 p-4 text-destructive">{error}</p>}
        {loading ? (
          <p className="p-6 text-muted-foreground">Memuat pesanan...</p>
        ) : orders.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-muted-foreground">Belum ada pesanan dari faskes.</CardContent>
          </Card>
        ) : orders.map((order) => (
          <Card key={order.id} className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{order.health_facility_name || "Faskes"}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Pesanan {order.id.slice(0, 8)} · {formatDate(order.created_at)}</p>
              </div>
              <Badge variant="outline">{statusLabels[order.status]}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Kirim ke: {order.delivery_address || "Alamat faskes belum diisi"}</p>
              {order.items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span>{item.quantity}× {item.product_name}</span>
                  <span>{formatIDR(item.subtotal)}</span>
                </div>
              ))}
              <p className="border-t pt-3 font-semibold">Total {formatIDR(order.total_amount)}</p>
              <p className="text-xs text-muted-foreground">
                {order.status === "rejected" || order.status === "cancelled"
                  ? "Dana yang dicadangkan telah dikembalikan ke pool donasi."
                  : order.funding_status === "spent"
                    ? "Dana pesanan sudah tercatat tersalurkan."
                    : order.funding_status === "reserved"
                      ? "Dana pesanan sudah dicadangkan."
                      : "Pendanaan pesanan akan diperiksa saat diproses."}
              </p>
              {order.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button disabled={Boolean(busy)} onClick={() => void runAction(order.id, () => confirmVendorFacilityOrder(order.id), "Pesanan dikonfirmasi dan sedang diproses.")}>
                    Konfirmasi pesanan
                  </Button>
                  <Button variant="outline" disabled={Boolean(busy)} onClick={() => { setRejectionOrder(order); setRejectionReason(""); }}>
                    Tolak pesanan
                  </Button>
                </div>
              )}
              {order.status === "processing" && (
                <Button disabled={Boolean(busy)} onClick={() => void runAction(order.id, () => dispatchFacilityOrder(order.id), "Pesanan ditandai sedang dikirim.")}>
                  <Truck className="mr-2 h-4 w-4" /> Kirim pesanan
                </Button>
              )}
              {order.vendor_rejection_reason && (
                <p className="rounded-xl bg-red-50 p-3 text-xs text-red-800">Alasan penolakan: {order.vendor_rejection_reason}</p>
              )}
              {order.receipt_status === "discrepancy" && (
                <p className="rounded-xl bg-red-50 p-3 text-xs text-red-800">Faskes melaporkan barang bermasalah: {order.discrepancy_notes}. Lengkapi barang dan minta Faskes memeriksa ulang.</p>
              )}
              {order.receipt_status === "accepted" && (
                <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">Barang diterima Faskes. Pembayaran: {order.payout_status === "paid" ? "transfer tercatat" : order.payout_status === "approved" ? "disetujui Admin" : "menunggu persetujuan Admin"}. Batas transfer: {order.payout_due_at ? new Date(order.payout_due_at).toLocaleString("id-ID") : "—"}.</p>
              )}
              {order.status === "shipped" && !order.receipt_status && (
                <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">Pesanan sedang menuju faskes. Faskes akan mengonfirmasi langsung dari halaman pesanannya setelah barang tiba.</p>
              )}
              {order.status === "completed" && !order.distribution && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Barang sudah dikonfirmasi tiba dan menunggu diserahkan kepada keluarga tujuan.</p>
              )}
              {order.distribution && (
                <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">Faskes sudah mencatat penyaluran kepada keluarga.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={Boolean(rejectionOrder)} onOpenChange={(open: boolean) => { if (!open && !busy) setRejectionOrder(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Tolak pesanan</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void reject(event)}>
            <div className="space-y-1">
              <Label htmlFor="vendor-rejection-reason">Alasan penolakan</Label>
              <Textarea id="vendor-rejection-reason" required maxLength={1000} disabled={Boolean(busy)} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => setRejectionOrder(null)}>Batal</Button>
              <Button type="submit" disabled={Boolean(busy) || !rejectionReason.trim()}>{busy ? "Menyimpan..." : "Tolak pesanan"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
