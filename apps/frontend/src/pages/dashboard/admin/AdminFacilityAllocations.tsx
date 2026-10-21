import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatIDR } from "@/lib/format";
import { listAdminFacilityOrders, type FacilityOrder } from "@/services/facility-orders";

const statusLabels: Record<FacilityOrder["status"], string> = {
  pending_approval: "Pesanan lama belum didanai",
  pending: "Menunggu vendor",
  processing: "Dalam pengiriman",
  received: "Diterima Faskes",
  completed: "Sudah disalurkan",
  cancelled: "Dibatalkan",
  rejected: "Ditolak (riwayat)",
};

const fundingLabels: Record<FacilityOrder["funding_status"], string> = {
  not_connected: "Belum dicadangkan",
  partial: "Didanai sebagian",
  reserved: "Dicadangkan",
  spent: "Terpakai",
};

export default function AdminFacilityAllocations() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setOrders(await listAdminFacilityOrders());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);

  const reserved = orders.reduce((sum, order) => sum + Number(order.funded_amount) - Number(order.spent_amount), 0);
  const spent = orders.reduce((sum, order) => sum + Number(order.spent_amount), 0);

  return (
    <DashboardLayout
      title="Monitoring Pesanan Faskes"
      subtitle="Pantau pesanan langsung dari Faskes ke vendor serta penggunaan dana donasinya."
      actions={<Button variant="outline" disabled={loading} onClick={() => void refresh()}>Perbarui</Button>}
    >
      <div className="mx-auto max-w-5xl space-y-4">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <p className="p-6 text-muted-foreground">Memuat pesanan...</p> : <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total pesanan", value: orders.length },
              { label: "Dana dicadangkan", value: formatIDR(reserved) },
              { label: "Dana terpakai", value: formatIDR(spent) },
            ].map((item) => <div key={item.label} className="rounded-xl border bg-white p-4"><p className="text-sm text-muted-foreground">{item.label}</p><strong className="mt-1 block text-lg">{item.value}</strong></div>)}
          </div>
          {orders.length === 0 && <p className="rounded-xl border bg-white p-5 text-muted-foreground">Belum ada pesanan dari Faskes.</p>}
          {orders.map((order) => <article key={order.id} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="font-semibold">#{order.id.slice(0, 8)} / {order.health_facility_name || "Faskes"}</h3>
                <p className="text-sm text-muted-foreground">Keluarga {order.family_name || "-"} / Vendor {order.vendor_name || "-"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.created_at)} / Daerah {order.service_regency_code || "-"}</p>
              </div>
              <div className="space-y-1 text-right"><strong className="block">{formatIDR(order.total_amount)}</strong><Badge variant="outline">{statusLabels[order.status] || order.status}</Badge></div>
            </div>
            <ul className="text-sm">{order.items.map((item) => <li key={item.product_id}>{item.quantity} x {item.product_name} / {formatIDR(item.subtotal)}</li>)}</ul>
            <p className="text-sm text-muted-foreground">Pendanaan: {fundingLabels[order.funding_status]} / Dicadangkan {formatIDR(Number(order.funded_amount) - Number(order.spent_amount))} / Terpakai {formatIDR(order.spent_amount)}</p>
            {order.allocation_reason && <p className="text-sm text-muted-foreground">Catatan riwayat: {order.allocation_reason}</p>}
            {order.discrepancy_notes && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Laporan Faskes: {order.discrepancy_notes}</p>}
          </article>)}
        </>}
      </div>
    </DashboardLayout>
  );
}
