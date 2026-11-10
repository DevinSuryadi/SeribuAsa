import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorState } from "@/components/dashboard/ErrorState";
import FacilityReceiptDialog from "@/components/order/FacilityReceiptDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { formatDate, formatIDR } from "@/lib/format";
import {
  cancelFacilityOrder,
  listFacilityOrders,
  type FacilityOrder,
} from "@/services/facility-orders";
import { Check, ChevronRight, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

type OrderStatus = "waiting" | "shipped" | "received" | "finished" | "cancelled";
type OrderTab = "all" | OrderStatus;

const pageSize = 20;

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

const orderTabs: { key: OrderTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "waiting", label: "Menunggu" },
  { key: "shipped", label: "Dikirim" },
  { key: "received", label: "Diterima" },
  { key: "finished", label: "Disalurkan" },
  { key: "cancelled", label: "Dibatalkan" },
];

const periodOptions = [
  { value: "all", label: "Semua waktu" },
  { value: "7", label: "7 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "90 hari terakhir" },
];

function statusKey(order: FacilityOrder): OrderStatus {
  if (order.status === "cancelled" || order.status === "rejected") return "cancelled";
  if (order.distribution || order.status === "completed") return "finished";
  if (order.status === "received") return "received";
  if (order.status === "shipped") return "shipped";
  return "waiting";
}

function hasOpenIssue(order: FacilityOrder) {
  return order.receipt_status === "discrepancy" && order.status === "shipped";
}

function displayStatus(order: FacilityOrder) {
  if (hasOpenIssue(order)) return { label: "Barang bermasalah", className: "text-red-600" };
  if (order.status === "rejected") {
    return { label: order.vendor_rejected_at ? "Ditolak Vendor" : "Ditolak Admin", className: "text-slate-500" };
  }
  if (order.status === "pending_approval") return { label: "Pesanan lama belum didanai", className: "text-amber-700" };
  const key = statusKey(order);
  if (key === "cancelled") return { label: "Dibatalkan", className: "text-slate-500" };
  if (key === "finished") {
    return order.distribution
      ? { label: "Sudah disalurkan", className: "text-emerald-700" }
      : { label: "Menunggu bukti", className: "text-amber-700" };
  }
  if (key === "received") return { label: "Diterima Faskes", className: "text-teal-700" };
  if (key === "shipped") return { label: "Dalam pengiriman", className: "text-blue-700" };
  if (order.status === "processing") return { label: "Diproses vendor", className: "text-blue-700" };
  return { label: "Menunggu vendor", className: "text-amber-700" };
}

function needsAction(order: FacilityOrder) {
  if (order.status === "pending_approval" || order.status === "shipped") return true;
  return !order.distribution && (order.status === "received" || order.status === "completed");
}

function shortId(order: FacilityOrder) {
  return order.id.split("-")[0].slice(0, 8);
}

function itemSummary(order: FacilityOrder) {
  return order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Selesai";
  return new Date(value).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function orderNotes(order: FacilityOrder) {
  const notes: { text: string; className: string }[] = [];
  if (statusKey(order) === "cancelled" && order.allocation_reason) {
    notes.push({ text: order.allocation_reason, className: "bg-slate-100 text-slate-700" });
  }
  if (order.vendor_rejection_reason) {
    notes.push({ text: `Ditolak Vendor: ${order.vendor_rejection_reason}`, className: "bg-red-50 text-red-800" });
  }
  if (hasOpenIssue(order)) {
    notes.push({ text: `Ketidaksesuaian: ${order.discrepancy_notes}. Periksa kembali setelah Vendor melengkapi barang.`, className: "bg-red-50 text-red-800" });
  }
  return notes;
}

// Same five steps the vendor sees: ordered, prepared, shipped, received by the facility, given to the family.
function trackingIndex(order: FacilityOrder) {
  if (statusKey(order) === "cancelled" || order.status === "pending_approval") return -1;
  if (order.distribution) return 5;
  if (order.status === "completed" || order.status === "received") return 4;
  if (order.status === "shipped") return order.receipt_status === "discrepancy" ? 3 : 2;
  if (order.status === "processing") return 1;
  return 0;
}

function OrderTracking({ order }: { order: FacilityOrder }) {
  const currentIndex = trackingIndex(order);
  if (currentIndex < 0) {
    return <p className="mt-1 text-slate-900">Pesanan ini tidak berlanjut ke pengiriman.</p>;
  }

  const hasIssue = hasOpenIssue(order);
  const steps = [
    { label: "Pesanan dibuat", time: order.created_at, note: "Menunggu vendor mengonfirmasi pesanan" },
    { label: "Disiapkan vendor", time: order.vendor_confirmed_at, note: "Vendor sedang menyiapkan pesanan" },
    { label: "Dalam pengiriman", time: order.dispatched_at, note: "Konfirmasi setelah barang tiba di faskes" },
    { label: "Diterima Faskes", time: order.arrived_at, note: "Barang bermasalah, menunggu vendor melengkapi" },
    { label: "Diterima keluarga", time: order.distribution?.distributed_at, note: "Unggah bukti setelah bantuan diserahkan kepada keluarga" },
  ];
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

export default function FacilityOrdersTable() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<FacilityOrder | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setOrders(await listFacilityOrders());
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

  useSmartPolling(async () => { setOrders(await listFacilityOrders()); }, { interval: 30000 });

  const showingPreview = import.meta.env.DEV && !loading && !error && orders.length === 0;
  const rows = useMemo(() => (showingPreview ? previewOrders : orders), [showingPreview, orders]);

  const scoped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff = period === "all" ? null : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return rows
      .filter((order) => {
        const matchesTerm =
          !term ||
          (order.family_name || "").toLowerCase().includes(term) ||
          (order.vendor_name || "").toLowerCase().includes(term) ||
          order.id.toLowerCase().includes(term) ||
          order.items.some((item) => item.product_name.toLowerCase().includes(term));
        const matchesPeriod = cutoff === null || new Date(order.created_at).getTime() >= cutoff;
        return matchesTerm && matchesPeriod;
      })
      .sort((a, b) =>
        Number(needsAction(b)) - Number(needsAction(a)) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [rows, search, period]);

  const counts = useMemo(() => {
    const result: Record<OrderTab, number> = { all: scoped.length, waiting: 0, shipped: 0, received: 0, finished: 0, cancelled: 0 };
    scoped.forEach((order) => { result[statusKey(order)] += 1; });
    return result;
  }, [scoped]);

  const filtered = activeTab === "all" ? scoped : scoped.filter((order) => statusKey(order) === activeTab);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visibleOrders = filtered.slice(firstIndex, firstIndex + pageSize);
  const selected = rows.find((order) => order.id === selectedId) || null;
  const hasFilter = Boolean(search.trim()) || period !== "all" || activeTab !== "all";

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
      await refresh();
    } catch (cancelError) {
      toast.error(cancelError instanceof Error ? cancelError.message : "Gagal membatalkan pesanan");
    } finally {
      setBusy("");
    }
  }

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
          <Button variant="outline" className="rounded-full bg-white" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/dashboard/health-facility/catalog">Pesan pangan</Link>
          </Button>
        </>
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
              placeholder="Cari keluarga, nomor, atau produk"
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

      {!(error && rows.length === 0) && (
        <section className="overflow-hidden rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
          {loading && rows.length === 0 ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-12 rounded-xl" />)}
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[15px] font-semibold tracking-tight text-slate-900">
                {rows.length === 0 ? "Belum ada pesanan" : "Pesanan tidak ditemukan"}
              </p>
              <p className="mt-1 text-[13px] text-slate-500">
                {hasFilter ? "Coba ubah kata kunci, periode, atau status." : "Pesan pangan dari katalog untuk keluarga yang terdaftar."}
              </p>
              {!hasFilter && (
                <Button size="sm" className="mt-4 rounded-full" onClick={() => navigate("/dashboard/health-facility/catalog")}>
                  Pesan pangan
                </Button>
              )}
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
                          <strong className="truncate text-sm font-semibold text-slate-900">{order.family_name || "Keluarga"}</strong>
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
                    <th className="w-[170px] px-3 py-3 font-medium">Keluarga</th>
                    <th className="px-3 py-3 font-medium">Isi</th>
                    <th className="w-[130px] px-3 py-3 font-medium">Vendor</th>
                    <th className="w-[110px] px-3 py-3 text-right font-medium">Total</th>
                    <th className="w-[190px] px-3 py-3 font-medium">Status</th>
                    <th className="w-[52px] px-3 py-3"><span className="sr-only">Detail</span></th>
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
                      <td className="truncate px-3 py-2.5 text-slate-900">{order.family_name || "Keluarga"}</td>
                      <td className="px-3 py-2.5">
                        <span className="block truncate text-slate-900" title={itemSummary(order)}>{itemSummary(order)}</span>
                        <span className="text-xs text-slate-500">{order.items.length} item</span>
                      </td>
                      <td className="truncate px-3 py-2.5 text-slate-700">{order.vendor_name || "Vendor"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-900">{formatIDR(order.total_amount)}</td>
                      <td className="px-3 py-2.5"><StatusLabel order={order} /></td>
                      <td className="px-3 py-2.5 text-right">
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

      <Dialog open={Boolean(selected)} onOpenChange={(open: boolean) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="left-auto right-3 top-3 flex h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[440px] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-[20px] p-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=open]:zoom-in-100 sm:rounded-[20px]">
          {selected && (
            <>
              <header className="border-b border-slate-100 px-5 py-4 pr-12">
                <DialogTitle className="text-[17px] font-semibold tracking-tight text-slate-900">
                  {selected.family_name || "Keluarga"}
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
                  <h3 className="text-xs font-medium text-slate-500">Vendor</h3>
                  <p className="mt-1 text-slate-900">{selected.vendor_name || "Vendor"}</p>
                </section>

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
              </div>

              {(selected.status === "pending" ||
                selected.status === "pending_approval" ||
                (selected.status === "shipped" && selected.receipt_status !== "accepted" && !showingPreview) ||
                selected.status === "received" ||
                selected.status === "completed") && (
                <footer className="flex gap-2 border-t border-slate-100 p-4">
                  {(selected.status === "pending" || selected.status === "pending_approval") && (
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={busy === selected.id}
                      onClick={() => void cancel(selected)}
                    >
                      Batalkan pesanan
                    </Button>
                  )}
                  {selected.status === "shipped" && selected.receipt_status !== "accepted" && !showingPreview && (
                    <Button className="w-full rounded-full" onClick={() => { setReceiptOrder(selected); setSelectedId(null); }}>
                      Konfirmasi barang tiba
                    </Button>
                  )}
                  {!selected.distribution && (selected.status === "received" || selected.status === "completed") && (
                    showingPreview ? (
                      <Button className="w-full rounded-full" onClick={() => toast.info("Aksi unggah tersedia untuk pesanan asli.")}>
                        Unggah bukti penerimaan
                      </Button>
                    ) : (
                      <Button asChild className="w-full rounded-full">
                        <Link to={`/dashboard/health-facility/families/${selected.family_id}/redemptions`}>
                          Unggah bukti penerimaan
                        </Link>
                      </Button>
                    )
                  )}
                  {selected.distribution && (
                    <Button asChild variant="outline" className="w-full rounded-full">
                      <Link to={`/dashboard/health-facility/families/${selected.family_id}/redemptions`}>
                        Lihat bukti penerimaan
                      </Link>
                    </Button>
                  )}
                </footer>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <FacilityReceiptDialog
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
        onSaved={(updated) => {
          setSelectedId(updated.id);
          setOrders((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        }}
      />
    </DashboardLayout>
  );
}
