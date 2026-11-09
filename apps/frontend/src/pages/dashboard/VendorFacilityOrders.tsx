import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { formatDate, formatIDR } from "@/lib/format";
import {
  dispatchFacilityOrder,
  listVendorFacilityOrders,
  rejectFacilityOrder,
  type FacilityOrder,
} from "@/services/facility-orders";
import { Check, ChevronRight, Loader2, RefreshCw, Search, Truck } from "lucide-react";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "received" | "completed" | "cancelled";
type OrderTab = "all" | OrderStatus;

const pageSize = 20;

const orderTabs: { key: OrderTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "processing", label: "Dikirim" },
  { key: "received", label: "Diterima" },
  { key: "completed", label: "Disalurkan" },
  { key: "cancelled", label: "Dibatalkan" },
];

const periodOptions = [
  { value: "all", label: "Semua waktu" },
  { value: "7", label: "7 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "90 hari terakhir" },
];

const statusMeta: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Menunggu proses", className: "text-amber-700" },
  processing: { label: "Dalam pengiriman", className: "text-blue-700" },
  received: { label: "Diterima Faskes", className: "text-teal-700" },
  completed: { label: "Sudah disalurkan", className: "text-emerald-700" },
  cancelled: { label: "Dibatalkan", className: "text-slate-500" },
};

function statusOf(order: FacilityOrder): OrderStatus {
  if (order.status === "shipped") return "processing";
  if (order.status === "pending" || order.status === "processing" || order.status === "received" || order.status === "completed") {
    return order.status;
  }
  return "cancelled";
}

function hasOpenIssue(order: FacilityOrder) {
  return order.receipt_status === "discrepancy" && statusOf(order) !== "cancelled";
}

function displayStatus(order: FacilityOrder) {
  if (hasOpenIssue(order)) return { label: "Barang bermasalah", className: "text-red-600" };
  return statusMeta[statusOf(order)];
}

function needsAction(order: FacilityOrder) {
  return order.status === "pending" || hasOpenIssue(order);
}

function shortId(order: FacilityOrder) {
  return order.id.slice(0, 8);
}

function itemSummary(order: FacilityOrder) {
  return order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ");
}

function fundingNote(order: FacilityOrder) {
  if (order.funding_status === "spent") return "Dana pesanan sudah tercatat tersalurkan.";
  if (order.funding_status === "reserved") return "Dana pesanan sudah dicadangkan.";
  return "Pendanaan pesanan akan diperiksa saat diproses.";
}

function orderNotes(order: FacilityOrder) {
  const notes: { text: string; className: string }[] = [];
  if (statusOf(order) === "cancelled" && order.allocation_reason) {
    notes.push({ text: order.allocation_reason, className: "bg-slate-100 text-slate-700" });
  }
  if (hasOpenIssue(order)) {
    notes.push({ text: `Faskes melaporkan barang bermasalah: ${order.discrepancy_notes}. Lengkapi barang dan minta Faskes memeriksa ulang.`, className: "bg-red-50 text-red-800" });
  }
  if (order.receipt_status === "accepted") {
    const allocation = order.payout_status === "paid" ? "sudah dialokasikan ke Anda" : order.payout_status === "approved" ? "sedang dialokasikan sistem" : "menunggu alokasi sistem";
    const target = order.payout_status !== "paid" && order.payout_due_at ? ` Target alokasi: ${new Date(order.payout_due_at).toLocaleString("id-ID")}.` : "";
    notes.push({ text: `Barang diterima Faskes. Dana ${allocation}.${target}`, className: "bg-emerald-50 text-emerald-800" });
  }
  if (order.status === "processing" && !order.receipt_status) {
    notes.push({ text: "Pesanan sedang menuju faskes. Faskes akan mengonfirmasi langsung dari halaman pesanannya setelah barang tiba.", className: "bg-blue-50 text-blue-800" });
  }
  if (order.status === "completed" && !order.distribution) {
    notes.push({ text: "Barang sudah dikonfirmasi tiba dan menunggu diserahkan kepada keluarga tujuan.", className: "bg-amber-50 text-amber-900" });
  }
  if (order.distribution) {
    notes.push({ text: "Faskes sudah mencatat penyaluran kepada keluarga.", className: "bg-emerald-50 text-emerald-800" });
  }
  return notes;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Selesai";
  return new Date(value).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function trackingIndex(order: FacilityOrder) {
  if (statusOf(order) === "cancelled") return -1;
  if (order.distribution) return 4;
  if (order.status === "completed" || order.status === "received") return 3;
  if (order.receipt_status === "discrepancy") return 2;
  if (order.status === "processing" || order.status === "shipped") return 1;
  return 0;
}

function trackingSteps(order: FacilityOrder) {
  return [
    {
      label: "Pesanan masuk",
      time: order.created_at,
      note: order.process_due_at
        ? `Proses sebelum ${formatDateTime(order.process_due_at)} atau pesanan batal otomatis`
        : "Menunggu Anda memproses pesanan",
    },
    { label: "Dikirim ke faskes", time: order.dispatched_at, note: "Dalam perjalanan ke faskes" },
    { label: "Diterima Faskes", time: order.arrived_at, note: "Barang bermasalah, perlu dilengkapi" },
    { label: "Diterima keluarga", time: order.distribution?.distributed_at, note: "Menunggu diserahkan kepada keluarga" },
  ];
}

function OrderTracking({ order }: { order: FacilityOrder }) {
  const currentIndex = trackingIndex(order);
  if (currentIndex < 0) {
    return <p className="mt-1 text-slate-900">Pesanan ini dibatalkan sehingga tidak berlanjut ke pengiriman.</p>;
  }

  const hasIssue = hasOpenIssue(order);
  const steps = trackingSteps(order);
  return (
    <ol className="mt-2">
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step.label} aria-current={current ? "step" : undefined} className="relative flex gap-3 pb-3 last:pb-0">
            {index < steps.length - 1 && (
              <span className={`absolute left-[7px] top-4 h-full w-px ${completed ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : current
                    ? `bg-white ${hasIssue ? "border-red-500" : "border-amber-500"}`
                    : "border-slate-300 bg-white"
              }`}
            >
              {completed && <Check className="h-2.5 w-2.5" />}
              {current && <span className={`h-1.5 w-1.5 rounded-full ${hasIssue ? "bg-red-500" : "bg-amber-500"}`} />}
            </span>
            <div className="min-w-0">
              <p className={`font-medium ${completed || current ? "text-slate-900" : "text-slate-500"}`}>{step.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {completed ? formatDateTime(step.time) : current ? step.note : "Belum"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StatusLabel({ order }: { order: FacilityOrder }) {
  const meta = displayStatus(order);
  return (
    <span className={`inline-flex items-center whitespace-nowrap text-[13px] font-medium ${meta.className}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export default function VendorFacilityOrders() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);

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
  useSmartPolling(async () => { setOrders(await listVendorFacilityOrders()); }, { interval: 30000 });

  async function runAction(id: string, action: () => Promise<unknown>, success: string, failure: string) {
    setBusy(id);
    try { await action(); toast.success(success); }
    catch (err) { toast.error(err instanceof Error ? err.message : failure); }
    finally {
      // The order may have changed on the facility's side, so always reload.
      await refresh();
      setBusy("");
    }
  }

  const dispatch = (id: string) =>
    runAction(id, () => dispatchFacilityOrder(id), "Pesanan dikirim ke faskes", "Gagal memproses pesanan");

  async function reject(id: string, reason: string) {
    await runAction(id, () => rejectFacilityOrder(id, reason), "Pesanan ditolak, dana dan stok dikembalikan", "Gagal menolak pesanan");
    setRejectReason(null);
  }

  function closeDetail() {
    setSelectedId(null);
    setRejectReason(null);
  }

  const scoped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff = period === "all" ? null : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return orders
      .filter((order) => {
        const matchesTerm =
          !term ||
          (order.health_facility_name || "").toLowerCase().includes(term) ||
          order.id.toLowerCase().includes(term) ||
          order.items.some((item) => item.product_name.toLowerCase().includes(term));
        const matchesPeriod = cutoff === null || new Date(order.created_at).getTime() >= cutoff;
        return matchesTerm && matchesPeriod;
      })
      .sort((a, b) =>
        Number(needsAction(b)) - Number(needsAction(a)) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [orders, search, period]);

  const counts = useMemo(() => {
    const result: Record<OrderTab, number> = { all: scoped.length, pending: 0, processing: 0, received: 0, completed: 0, cancelled: 0 };
    scoped.forEach((order) => { result[statusOf(order)] += 1; });
    return result;
  }, [scoped]);

  const filtered = activeTab === "all" ? scoped : scoped.filter((order) => statusOf(order) === activeTab);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visibleOrders = filtered.slice(firstIndex, firstIndex + pageSize);
  const selected = orders.find((order) => order.id === selectedId) || null;
  const hasFilter = Boolean(search.trim()) || period !== "all" || activeTab !== "all";

  return (
    <DashboardLayout
      title="Pesanan Faskes"
      subtitle="Siapkan pesanan dan kirim langsung ke fasilitas kesehatan tujuan."
      actions={
        <Button variant="outline" className="rounded-full bg-white" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </Button>
      }
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <nav
          className="flex w-fit max-w-full overflow-x-auto rounded-full bg-[#ececef] p-1 [scrollbar-width:none]"
          aria-label="Filter status pesanan"
        >
          {orderTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
              >
                {tab.label} <span className="text-slate-500">{counts[tab.key]}</span>
              </button>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:flex-1 xl:w-64 xl:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              aria-label="Cari pesanan"
              className="h-9 rounded-full border-0 bg-[#ececef] pl-9 text-sm shadow-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-0"
              placeholder="Cari faskes, nomor, atau produk"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Periode pesanan"
            className="h-9 rounded-full border-0 bg-[#ececef] px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              setPage(1);
            }}
          >
            {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>

      {error && <ErrorState title="Gagal memuat pesanan" message={error} onRetry={() => void refresh()} />}

      {!(error && orders.length === 0) && (
        <section className="overflow-hidden rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
          {loading && orders.length === 0 ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-12 rounded-xl" />)}
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[15px] font-semibold tracking-tight text-slate-900">
                {orders.length === 0 ? "Belum ada pesanan dari faskes" : "Pesanan tidak ditemukan"}
              </p>
              <p className="mt-1 text-[13px] text-slate-500">
                {hasFilter ? "Coba ubah kata kunci, periode, atau status." : "Pesanan baru akan muncul di sini."}
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100 xl:hidden">
                {visibleOrders.map((order) => (
                  <li key={order.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      onClick={() => setSelectedId(order.id)}
                    >
                      <span className="min-w-0 flex-1 space-y-0.5">
                        <span className="flex items-center justify-between gap-3">
                          <strong className="truncate text-sm font-semibold text-slate-900">{order.health_facility_name || "Faskes"}</strong>
                          <StatusLabel order={order} />
                        </span>
                        <span className="block truncate text-[13px] text-slate-700">{itemSummary(order)}</span>
                        <span className="flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span className="truncate">#{shortId(order)} · {formatDate(order.created_at)}</span>
                          <strong className="shrink-0 text-[13px] font-semibold text-slate-900">{formatIDR(order.total_amount)}</strong>
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
              <table className="hidden w-full table-fixed border-collapse text-left xl:table">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                    <th className="w-[140px] px-5 py-3 font-medium">Pesanan</th>
                    <th className="w-[170px] px-3 py-3 font-medium">Faskes</th>
                    <th className="px-3 py-3 font-medium">Isi</th>
                    <th className="w-[110px] px-3 py-3 text-right font-medium">Total</th>
                    <th className="w-[160px] px-3 py-3 font-medium">Status</th>
                    <th className="w-[170px] px-5 py-3"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer border-b border-slate-100 text-[13px] transition-colors last:border-0 hover:bg-slate-50"
                      onClick={() => setSelectedId(order.id)}
                    >
                      <td className="px-5 py-2.5">
                        <strong className="block font-semibold text-slate-900">#{shortId(order)}</strong>
                        <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                      </td>
                      <td className="truncate px-3 py-2.5 text-slate-900">{order.health_facility_name || "Faskes"}</td>
                      <td className="px-3 py-2.5">
                        <span className="block truncate text-slate-900" title={itemSummary(order)}>{itemSummary(order)}</span>
                        <span className="text-xs text-slate-500">{order.items.length} item</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-900">{formatIDR(order.total_amount)}</td>
                      <td className="px-3 py-2.5"><StatusLabel order={order} /></td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              className="h-8 rounded-full px-3 text-[13px]"
                              disabled={busy === order.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                void dispatch(order.id);
                              }}
                            >
                              Proses dan kirim
                            </Button>
                          )}
                          <button
                            type="button"
                            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Lihat detail pesanan ${shortId(order)}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(order.id);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-2.5 text-[13px] text-slate-500">
                <span>{firstIndex + 1}–{firstIndex + visibleOrders.length} dari {filtered.length} pesanan</span>
                {pageCount > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full bg-slate-900/[0.06] px-3 text-[13px] font-medium text-slate-900 hover:bg-slate-900/10"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Sebelumnya
                    </Button>
                    <span className="hidden tabular-nums sm:inline">{currentPage} / {pageCount}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full bg-slate-900/[0.06] px-3 text-[13px] font-medium text-slate-900 hover:bg-slate-900/10"
                      disabled={currentPage >= pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Berikutnya
                    </Button>
                  </div>
                )}
              </footer>
            </>
          )}
        </section>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open: boolean) => { if (!open) closeDetail(); }}>
        <DialogContent className="left-auto right-3 top-3 flex h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[440px] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-[20px] p-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=open]:zoom-in-100 sm:rounded-[20px]">
          {selected && (
            <>
              <header className="border-b border-slate-100 px-5 py-4 pr-12">
                <DialogTitle className="text-[17px] font-semibold tracking-tight text-slate-900">
                  {selected.health_facility_name || "Faskes"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-[13px] text-slate-500">
                  #{shortId(selected)} · {formatDate(selected.created_at)}
                </DialogDescription>
                <div className="mt-2"><StatusLabel order={selected} /></div>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-[13px]">
                <section>
                  <h3 className="text-xs font-medium text-slate-500">Progres</h3>
                  <OrderTracking order={selected} />
                </section>

                {orderNotes(selected).map((note) => (
                  <p key={note.text} className={`rounded-xl px-3 py-2 ${note.className}`}>{note.text}</p>
                ))}

                <section>
                  <h3 className="text-xs font-medium text-slate-500">Kirim ke</h3>
                  <p className="mt-1 text-slate-900">{selected.delivery_address || "Alamat faskes belum diisi"}</p>
                  {selected.facility_phone && (
                    <a href={`tel:${selected.facility_phone}`} className="mt-1 inline-block text-emerald-700 hover:underline">
                      {selected.facility_phone}
                    </a>
                  )}
                </section>

                {hasOpenIssue(selected) && selected.receipt_evidence_url && (
                  <section>
                    <h3 className="text-xs font-medium text-slate-500">Foto dari Faskes</h3>
                    <img
                      src={selected.receipt_evidence_url}
                      alt="Foto barang saat tiba di Faskes"
                      className="mt-1 max-h-56 w-full rounded-xl bg-[#f5f5f7] object-contain"
                    />
                  </section>
                )}

                <section>
                  <h3 className="text-xs font-medium text-slate-500">Rincian</h3>
                  <ul className="mt-1 divide-y divide-slate-100">
                    {selected.items.map((item) => (
                      <li key={item.product_id} className="flex items-baseline justify-between gap-3 py-2 text-slate-900">
                        <span className="min-w-0">{item.quantity}× {item.product_name}</span>
                        <span className="shrink-0">{formatIDR(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline justify-between gap-3 border-t border-slate-200 pt-2 text-[15px] font-semibold tracking-tight text-slate-900">
                    <span>Total</span>
                    <span>{formatIDR(selected.total_amount)}</span>
                  </div>
                </section>

                {statusOf(selected) !== "cancelled" && (
                  <section>
                    <h3 className="text-xs font-medium text-slate-500">Pendanaan</h3>
                    <p className="mt-1 text-slate-900">{fundingNote(selected)}</p>
                  </section>
                )}
              </div>

              {selected.status === "pending" && (
                <footer className="space-y-2 border-t border-slate-100 p-4">
                  {rejectReason === null ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={busy === selected.id}
                        onClick={() => setRejectReason("")}
                      >
                        Tolak
                      </Button>
                      <Button
                        className="flex-1 rounded-full"
                        disabled={busy === selected.id}
                        onClick={() => { void dispatch(selected.id); }}
                      >
                        {busy === selected.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                        Proses dan kirim
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        aria-label="Alasan penolakan"
                        autoFocus
                        maxLength={500}
                        placeholder="Alasan penolakan, misalnya stok rusak"
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="rounded-full"
                          disabled={busy === selected.id}
                          onClick={() => setRejectReason(null)}
                        >
                          Batal
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 rounded-full"
                          disabled={busy === selected.id || rejectReason.trim().length < 5}
                          onClick={() => { void reject(selected.id, rejectReason.trim()); }}
                        >
                          Tolak pesanan
                        </Button>
                      </div>
                    </>
                  )}
                </footer>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
