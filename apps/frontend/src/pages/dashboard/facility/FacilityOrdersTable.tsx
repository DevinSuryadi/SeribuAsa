import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import FacilityReceiptDialog from "@/components/order/FacilityReceiptDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatIDR } from "@/lib/format";
import {
  cancelFacilityOrder,
  listFacilityOrders,
  type FacilityOrder,
} from "@/services/facility-orders";
import {
  Check,
  ChevronRight,
  Circle,
  Package,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

type OrderTab =
  | "all"
  | "waiting"
  | "funding"
  | "processing"
  | "shipped"
  | "received"
  | "finished"
  | "cancelled"
  | "rejected";

const previewOrders: FacilityOrder[] = [
  {
    id: "9ed677fa-preview-order",
    family_id: "preview-family-somat",
    family_name: "Bapak Somat",
    health_facility_name: "Faskes01",
    delivery_address: "Jl. Kenanga No. 12",
    vendor_id: "preview-vendor-01",
    vendor_name: "vendor01",
    items: [
      { product_id: "preview-duck-egg", product_name: "Telur Bebek", quantity: 1, price: 4000, subtotal: 4000 },
      { product_id: "preview-rice", product_name: "Beras Subsidi Premium 1 kg", quantity: 1, price: 50000, subtotal: 50000 },
    ],
    total_amount: 54000,
    status: "pending",
    payment_status: "paid",
    funding_status: "reserved",
    funded_amount: 54000,
    spent_amount: 0,
    created_at: "2026-10-08T08:30:00.000Z",
    received_at: null,
    receipt_notes: null,
    distribution: null,
  },
  {
    id: "f14e85565-preview-order",
    family_id: "preview-family-somat",
    family_name: "Bapak Somat",
    health_facility_name: "Faskes01",
    delivery_address: "Jl. Kenanga No. 12",
    vendor_id: "preview-vendor-01",
    vendor_name: "vendor01",
    items: [
      { product_id: "preview-duck-egg-2", product_name: "Telur Bebek", quantity: 2, price: 4000, subtotal: 8000 },
      { product_id: "preview-rice-2", product_name: "Beras Subsidi Premium 1 kg", quantity: 1, price: 50000, subtotal: 50000 },
    ],
    total_amount: 58000,
    status: "pending",
    payment_status: "paid",
    funding_status: "reserved",
    funded_amount: 58000,
    spent_amount: 0,
    created_at: "2026-10-08T07:45:00.000Z",
    received_at: null,
    receipt_notes: null,
    distribution: null,
  },
];

const tabItems: { key: OrderTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "funding", label: "Menunggu dana" },
  { key: "waiting", label: "Menunggu vendor" },
  { key: "processing", label: "Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "received", label: "Diterima Faskes" },
  { key: "finished", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
  { key: "rejected", label: "Ditolak" },
];

function statusKey(order: FacilityOrder): Exclude<OrderTab, "all" | "processing"> {
  if (order.status === "cancelled") return "cancelled";
  if (order.status === "rejected") return "rejected";
  if (order.status === "pending_approval") return "funding";
  if (order.distribution || order.status === "completed") return "finished";
  if (order.status === "received") return "received";
  if (order.status === "processing") return "shipped";
  return "waiting";
}

function statusLabel(order: FacilityOrder) {
  if (order.receipt_status === "discrepancy") return "Barang bermasalah";
  const key = statusKey(order);
  if (key === "cancelled") return "Dibatalkan";
  if (key === "rejected") return "Ditolak Admin";
  if (key === "funding") return "Pesanan lama belum didanai";
  if (key === "finished") return order.distribution ? "Selesai" : "Menunggu bukti";
  if (key === "received") return "Diterima Faskes";
  if (key === "shipped") return "Dikirim";
  return "Menunggu vendor";
}

function statusClass(order: FacilityOrder) {
  if (order.receipt_status === "discrepancy") return "border-red-200 bg-red-50 text-red-700";
  const key = statusKey(order);
  if (key === "cancelled") return "border-red-200 bg-red-50 text-red-700";
  if (key === "rejected") return "border-red-200 bg-red-50 text-red-700";
  if (key === "funding") return "border-amber-200 bg-amber-50 text-amber-800";
  if (key === "finished") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (key === "received") return "border-teal-200 bg-teal-50 text-teal-700";
  if (key === "shipped") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function shortId(value: string) {
  return value.split("-")[0].slice(0, 8);
}

function itemSummary(order: FacilityOrder) {
  return order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ");
}

function progressIndex(order: FacilityOrder) {
  if (order.status === "cancelled" || order.status === "rejected") return -1;
  if (order.distribution || order.status === "completed") return 4;
  if (order.status === "received") return 3;
  if (order.status === "processing") return 2;
  if (order.status === "pending") return 0;
  return -1;
}

export default function FacilityOrdersTable() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [selected, setSelected] = useState<FacilityOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<FacilityOrder | null>(null);

  async function refresh(forceRefresh = false) {
    setLoading(true);
    try {
      setOrders(await listFacilityOrders(undefined, forceRefresh));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  const showingPreview = import.meta.env.DEV && !loading && !error && orders.length === 0;
  const rows = showingPreview ? previewOrders : orders;

  const counts = useMemo(() => {
    const result: Record<OrderTab, number> = {
      all: rows.length,
      funding: 0,
      waiting: 0,
      processing: 0,
      shipped: 0,
      received: 0,
      finished: 0,
      cancelled: 0,
      rejected: 0,
    };
    rows.forEach((order) => {
      result[statusKey(order)] += 1;
    });
    return result;
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      activeTab === "all"
        ? rows
        : rows.filter((order) => statusKey(order) === activeTab),
    [activeTab, rows],
  );

  async function cancel(order: FacilityOrder) {
    if (showingPreview) {
      toast.info("Ini adalah data contoh. Pembatalan tidak dikirim ke server.");
      return;
    }
    if (!window.confirm("Batalkan pesanan ini? Stok dan dana yang dicadangkan akan dikembalikan.")) return;
    setBusy(order.id);
    try {
      await cancelFacilityOrder(order.id);
      toast.success("Pesanan dibatalkan");
      setSelected(null);
      await refresh(true);
    } catch (cancelError) {
      toast.error(cancelError instanceof Error ? cancelError.message : "Gagal membatalkan pesanan");
    } finally {
      setBusy("");
    }
  }

  const steps = selected
    ? [
        { label: "Menunggu vendor", note: "Vendor belum mengonfirmasi" },
        { label: "Diproses vendor", note: "Belum" },
        { label: "Dikirim ke faskes", note: "Belum" },
        { label: "Diterima Faskes", note: "Menunggu pemeriksaan" },
        { label: "Diterima keluarga", note: "Belum" },
      ]
    : [];
  const currentProgress = selected ? progressIndex(selected) : -1;

  return (
    <DashboardLayout
      title={
        <span className="flex flex-wrap items-center gap-2">
          Pesanan
          {showingPreview && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-800">
              Data contoh
            </Badge>
          )}
        </span>
      }
      subtitle="Pantau pesanan, konfirmasi barang tiba di Faskes, lalu catat penyaluran kepada keluarga."
      actions={
        <>
          <Button variant="outline" className="rounded-xl bg-white" onClick={() => void refresh(true)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Perbarui
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/dashboard/health-facility/catalog">
              <Plus className="mr-2 h-4 w-4" />
              Pesan pangan
            </Link>
          </Button>
        </>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-4" aria-label="Filter status pesanan">
          {tabItems.filter((tab) => tab.key !== "funding" || counts.funding > 0).map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`relative shrink-0 px-4 py-4 text-sm font-semibold transition-colors ${
                activeTab === tab.key ? "text-emerald-700" : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} {counts[tab.key]}
              {activeTab === tab.key && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-600" />
              )}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 rounded-xl" />)}
          </div>
        ) : error ? (
          <ErrorState
            className="m-4"
            title="Gagal memuat pesanan"
            message={error}
            onRetry={() => void refresh(true)}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />}
            title="Belum ada pesanan"
            description="Pesan pangan dari katalog untuk keluarga yang terdaftar."
            action={{ label: "Pesan pangan", onClick: () => navigate("/dashboard/health-facility/catalog") }}
          />
        ) : filteredRows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-semibold text-slate-900">Tidak ada pesanan pada status ini</p>
            <p className="mt-1 text-sm text-slate-500">Pesanan akan muncul otomatis ketika statusnya berubah.</p>
          </div>
        ) : (
          <>
          <ul className="divide-y divide-slate-100 lg:hidden">
            {filteredRows.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-4 text-left text-sm transition-colors hover:bg-emerald-50/40"
                  onClick={() => setSelected(order)}
                >
                  <span className="min-w-0 flex-1 space-y-2">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-slate-900">#{shortId(order.id)}</strong>
                      <Badge variant="outline" className={statusClass(order)}>
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel(order)}
                      </Badge>
                    </span>
                    <span className="block font-medium text-slate-900">{order.family_name || "Keluarga"}</span>
                    <span className="block truncate text-slate-600">{itemSummary(order)}</span>
                    <span className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{order.vendor_name || "Vendor"} · {formatDate(order.created_at)}</span>
                      <strong className="text-sm text-slate-900">{formatIDR(order.total_amount)}</strong>
                    </span>
                  </span>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="px-5 py-3">Pesanan</th>
                  <th className="px-4 py-3">Keluarga</th>
                  <th className="px-4 py-3">Isi</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-slate-100 text-sm transition-colors last:border-0 hover:bg-emerald-50/40"
                    onClick={() => setSelected(order)}
                  >
                    <td className="px-5 py-4 align-top">
                      <strong className="block text-slate-900">#{shortId(order.id)}</strong>
                      <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                    </td>
                    <td className="px-4 py-4 align-top font-medium text-slate-900">{order.family_name || "Keluarga"}</td>
                    <td className="max-w-[340px] px-4 py-4 align-top">
                      <span className="block truncate text-slate-900">{itemSummary(order)}</span>
                      <span className="text-xs text-slate-500">{order.items.length} item</span>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">{order.vendor_name || "Vendor"}</td>
                    <td className="px-4 py-4 text-right align-top font-semibold text-slate-900">{formatIDR(order.total_amount)}</td>
                    <td className="px-4 py-4 align-top">
                      <Badge variant="outline" className={statusClass(order)}>
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel(order)}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 align-top"><ChevronRight className="h-4 w-4 text-slate-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-transparent"
            aria-label="Tutup detail pesanan"
            onClick={() => setSelected(null)}
          />
          <aside
            className="relative z-10 flex h-full w-full max-w-[500px] flex-col border-l border-slate-200 bg-white shadow-[-18px_0_45px_rgba(15,23,42,0.14)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs text-slate-500">Pesanan</p>
                <h2 id="order-detail-title" className="mt-0.5 text-xl font-bold text-slate-950">#{shortId(selected.id)}</h2>
                <Badge variant="outline" className={`mt-2 ${statusClass(selected)}`}>
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel(selected)}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setSelected(null)} aria-label="Tutup">
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto">
              <section className="grid grid-cols-3 gap-4 border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs text-slate-500">Keluarga</p>
                  <p className="mt-1 font-semibold text-slate-900">{selected.family_name || "Keluarga"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Vendor</p>
                  <p className="mt-1 font-semibold text-slate-900">{selected.vendor_name || "Vendor"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dibuat</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDate(selected.created_at)}</p>
                </div>
              </section>

              <section className="border-b border-slate-100 px-6 py-5">
                <h3 className="mb-4 text-sm font-bold text-slate-900">Progres</h3>
                <ol className="space-y-0">
                  {steps.map((step, index) => {
                    const completed = currentProgress > index;
                    const current = currentProgress === index;
                    return (
                      <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < steps.length - 1 && (
                          <span className={`absolute left-[7px] top-4 h-full w-px ${completed ? "bg-emerald-400" : "bg-slate-200"}`} />
                        )}
                        <span className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                          completed ? "border-emerald-500 bg-emerald-500 text-white" : current ? "border-amber-500" : "border-slate-300"
                        }`}>
                          {completed ? <Check className="h-2.5 w-2.5" /> : current ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> : <Circle className="h-0 w-0" />}
                        </span>
                        <div>
                          <p className={`text-sm font-semibold ${current || completed ? "text-slate-900" : "text-slate-500"}`}>{step.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {completed ? "Selesai" : current ? step.note : "Belum"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <section className="px-6 py-5">
                {selected.allocation_status === "rejected" && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">Alokasi ditolak: {selected.allocation_reason || "Tidak memenuhi syarat"}</p>}
                {selected.receipt_status === "discrepancy" && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">Ketidaksesuaian: {selected.discrepancy_notes}. Periksa kembali setelah Vendor melengkapi barang.</p>}
                {selected.arrived_at && <p className="mb-3 text-sm text-slate-600">Barang tiba: {new Date(selected.arrived_at).toLocaleString("id-ID")}. {selected.payout_due_at && `Batas transfer Vendor: ${new Date(selected.payout_due_at).toLocaleString("id-ID")}.`}</p>}
                <h3 className="mb-3 text-sm font-bold text-slate-900">Rincian</h3>
                <div className="divide-y divide-slate-100">
                  {selected.items.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="text-slate-700">{item.quantity}× {item.product_name}</span>
                      <span className="font-medium text-slate-900">{formatIDR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-bold">
                  <span>Total</span>
                  <span>{formatIDR(selected.total_amount)}</span>
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
              {(selected.status === "pending" || selected.status === "pending_approval") ? (
                <Button
                  variant="outline"
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={busy === selected.id}
                  onClick={() => void cancel(selected)}
                >
                  Batalkan pesanan
                </Button>
              ) : <span />}

              {selected.status === "processing" && selected.receipt_status !== "accepted" && !showingPreview && <Button className="rounded-xl" onClick={() => { setReceiptOrder(selected); setSelected(null); }}>Konfirmasi barang tiba</Button>}
              {!selected.distribution && (selected.status === "received" || selected.status === "completed") && (
                showingPreview ? (
                  <Button className="rounded-xl" onClick={() => toast.info("Aksi unggah tersedia untuk pesanan asli.")}>
                    Unggah bukti penerimaan
                  </Button>
                ) : (
                  <Button asChild className="rounded-xl">
                    <Link to={`/dashboard/health-facility/families/${selected.family_id}/redemptions`}>
                      Unggah bukti penerimaan
                    </Link>
                  </Button>
                )
              )}
              {selected.distribution && (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to={`/dashboard/health-facility/families/${selected.family_id}/redemptions`}>
                    Lihat bukti penerimaan
                  </Link>
                </Button>
              )}
            </footer>
          </aside>
        </div>
      )}
      <FacilityReceiptDialog order={receiptOrder} onClose={() => setReceiptOrder(null)} onSaved={(updated) => { setSelected(updated); setOrders((rows) => rows.map((row) => row.id === updated.id ? updated : row)); }} />
    </DashboardLayout>
  );
}
