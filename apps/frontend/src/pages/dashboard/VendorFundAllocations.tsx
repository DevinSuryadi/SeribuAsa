import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { formatDate, formatIDR } from "@/lib/format";
import { listVendorFacilityOrders, type FacilityOrder } from "@/services/facility-orders";
import { listVendorFacilityPayouts, type FacilityPayout } from "@/services/facility-payouts";
import { Check, ChevronRight, RefreshCw, Search } from "lucide-react";

type PayoutState = "processing" | "overdue" | "paid";
type PayoutTab = "all" | PayoutState;

const pageSize = 20;
const dayMs = 24 * 60 * 60 * 1000;

const payoutTabs: { key: PayoutTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "processing", label: "Diproses" },
  { key: "overdue", label: "Terlambat" },
  { key: "paid", label: "Teralokasi" },
];

const periodOptions = [
  { value: "all", label: "Semua waktu" },
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "90 hari terakhir" },
  { value: "365", label: "1 tahun terakhir" },
];

const flowSteps = ["Faskes menerima barang", "Sistem mengalokasikan dana", "Dana masuk ke rekening Anda"];

function stateOf(row: FacilityPayout): PayoutState {
  if (row.status === "paid") return "paid";
  return row.overdue ? "overdue" : "processing";
}

function statusMeta(row: FacilityPayout) {
  const state = stateOf(row);
  if (state === "paid") return { label: "Dana teralokasi", className: "text-emerald-700" };
  if (state === "overdue") return { label: "Terlambat", className: "text-red-600" };
  return row.status === "approved"
    ? { label: "Sedang dialokasikan", className: "text-blue-700" }
    : { label: "Menunggu alokasi", className: "text-amber-700" };
}

function formatDateTime(value?: string | null) {
  if (!value) return "Selesai";
  return new Date(value).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function daysPast(value: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / dayMs));
}

function hasBankAccount(row: FacilityPayout) {
  return Boolean(row.bank_name && row.bank_account_number && row.bank_account_holder);
}

function shortId(row: FacilityPayout) {
  return row.order_id.slice(0, 8);
}

function itemSummary(order?: FacilityOrder) {
  return order ? order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ") : "";
}

function sumAmount(rows: FacilityPayout[]) {
  return rows.reduce((sum, row) => sum + Number(row.amount), 0);
}

function compareRows(a: FacilityPayout, b: FacilityPayout) {
  const rank: Record<PayoutState, number> = { overdue: 0, processing: 1, paid: 2 };
  const byState = rank[stateOf(a)] - rank[stateOf(b)];
  if (byState) return byState;
  if (stateOf(a) === "paid") return new Date(b.paid_at || 0).getTime() - new Date(a.paid_at || 0).getTime();
  return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
}

function StatusLabel({ row }: { row: FacilityPayout }) {
  const meta = statusMeta(row);
  return (
    <span className={`inline-flex items-center whitespace-nowrap text-[13px] font-medium ${meta.className}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

function scheduleLabel(row: FacilityPayout) {
  if (row.status === "paid") return { title: "Masuk", date: row.paid_at };
  return { title: row.overdue ? `Lewat ${daysPast(row.due_at)} hari` : "Target", date: row.due_at };
}

function AllocationTracker({ row }: { row: FacilityPayout }) {
  const currentIndex = row.status === "paid" ? 3 : row.status === "approved" ? 2 : 1;
  const overdue = stateOf(row) === "overdue";
  const steps = [
    { label: "Barang diterima Faskes", time: row.confirmed_at, note: "" },
    { label: "Diverifikasi sistem", time: row.approved_at, note: "Sistem sedang memeriksa pesanan" },
    { label: "Dana masuk ke rekening", time: row.paid_at, note: "Dana sedang dialokasikan ke rekening Anda" },
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
                    ? `bg-white ${overdue ? "border-red-500" : "border-amber-500"}`
                    : "border-slate-300 bg-white"
              }`}
            >
              {completed && <Check className="h-2.5 w-2.5" />}
              {current && <span className={`h-1.5 w-1.5 rounded-full ${overdue ? "bg-red-500" : "bg-amber-500"}`} />}
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

function SummaryStat({ label, value, note, valueClass = "text-slate-900" }: { label: string; value: string; note: string; valueClass?: string }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-[13px] text-slate-500">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</dd>
      <dd className="mt-0.5 text-xs text-slate-500">{note}</dd>
    </div>
  );
}

export default function VendorFundAllocations() {
  const [rows, setRows] = useState<FacilityPayout[]>([]);
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<PayoutTab>("all");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    const [payoutRows, orderRows] = await Promise.all([
      listVendorFacilityPayouts(),
      // Order details only enrich the rows, so the page still works without them.
      listVendorFacilityOrders().catch(() => [] as FacilityOrder[]),
    ]);
    setRows(payoutRows);
    setOrders(orderRows);
  }

  async function refresh() {
    setLoading(true);
    try {
      await load();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat alokasi dana");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);
  useSmartPolling(load, { interval: 30000 });

  const orderById = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders]);

  const scoped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cutoff = period === "all" ? null : Date.now() - Number(period) * dayMs;
    return rows
      .filter((row) => {
        const order = orderById.get(row.order_id);
        const matchesTerm =
          !term ||
          row.order_id.toLowerCase().includes(term) ||
          (order?.health_facility_name || "").toLowerCase().includes(term) ||
          itemSummary(order).toLowerCase().includes(term);
        const matchesPeriod = cutoff === null || new Date(row.arrived_at || row.due_at).getTime() >= cutoff;
        return matchesTerm && matchesPeriod;
      })
      .sort(compareRows);
  }, [rows, orderById, search, period]);

  const counts = useMemo(() => {
    const result: Record<PayoutTab, number> = { all: scoped.length, processing: 0, overdue: 0, paid: 0 };
    scoped.forEach((row) => { result[stateOf(row)] += 1; });
    return result;
  }, [scoped]);

  const summary = useMemo(() => {
    const paid = rows.filter((row) => row.status === "paid");
    const unpaid = rows.filter((row) => row.status !== "paid");
    return { paid, unpaid, overdue: unpaid.filter((row) => row.overdue) };
  }, [rows]);

  const filtered = activeTab === "all" ? scoped : scoped.filter((row) => stateOf(row) === activeTab);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visibleRows = filtered.slice(firstIndex, firstIndex + pageSize);
  const selected = rows.find((row) => row.id === selectedId) || null;
  const selectedOrder = selected ? orderById.get(selected.order_id) : undefined;
  const accountRow = summary.unpaid.find(hasBankAccount) || rows.find(hasBankAccount);
  const missingAccount = summary.unpaid.length > 0 && !summary.unpaid.some(hasBankAccount);
  const initialLoading = loading && rows.length === 0;

  return (
    <DashboardLayout
      title="Alokasi Dana"
      subtitle="Dana pesanan dialokasikan oleh sistem ke rekening Anda setelah Faskes menerima barang dengan lengkap."
      actions={
        <Button variant="outline" className="rounded-full bg-white" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </Button>
      }
    >
      {initialLoading ? (
        <Skeleton className="h-44 rounded-[20px]" />
      ) : !(error && rows.length === 0) && (
        <section className="overflow-hidden rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
          <dl className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <SummaryStat
              label="Sudah teralokasi"
              value={formatIDR(sumAmount(summary.paid))}
              note={`${summary.paid.length} pesanan`}
              valueClass="text-emerald-700"
            />
            <SummaryStat
              label="Sedang diproses"
              value={formatIDR(sumAmount(summary.unpaid))}
              note={`${summary.unpaid.length} pesanan belum masuk`}
            />
            <SummaryStat
              label="Melewati target"
              value={`${summary.overdue.length} pesanan`}
              note={summary.overdue.length ? formatIDR(sumAmount(summary.overdue)) : "Semua sesuai target"}
              valueClass={summary.overdue.length ? "text-red-600" : "text-slate-900"}
            />
          </dl>
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-[#f5f5f7]/70 px-5 py-3 text-[13px] lg:flex-row lg:items-center lg:justify-between">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-slate-600">
              {flowSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  {step}
                </li>
              ))}
            </ol>
            {accountRow && (
              <p className="shrink-0 text-slate-600">
                Rekening tujuan{" "}
                <span className="font-medium text-slate-900">
                  {accountRow.bank_name} •••• {accountRow.bank_account_number?.slice(-4)}
                </span>
              </p>
            )}
          </div>
        </section>
      )}

      {missingAccount && !initialLoading && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Rekening belum lengkap, jadi dana belum bisa dialokasikan.{" "}
          <Link to="/dashboard/profile" className="font-medium underline">Lengkapi di Profil</Link>
        </p>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav
          className="flex w-fit max-w-full overflow-x-auto rounded-full bg-[#ececef] p-1 [scrollbar-width:none]"
          aria-label="Filter status alokasi"
        >
          {payoutTabs.map((tab) => {
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
          <div className="relative sm:flex-1 lg:w-64 lg:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              aria-label="Cari alokasi"
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
            aria-label="Periode alokasi"
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

      {error && <ErrorState title="Gagal memuat alokasi dana" message={error} onRetry={() => void refresh()} />}

      {!(error && rows.length === 0) && (
        <section className="overflow-hidden rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
          {initialLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-12 rounded-xl" />)}
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[15px] font-semibold tracking-tight text-slate-900">
                {rows.length === 0 ? "Belum ada dana pesanan" : "Alokasi tidak ditemukan"}
              </p>
              <p className="mt-1 text-[13px] text-slate-500">
                {rows.length === 0
                  ? "Dana akan muncul di sini setelah Faskes menerima barang dengan lengkap."
                  : "Coba ubah kata kunci, periode, atau status."}
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100 lg:hidden">
                {visibleRows.map((row) => {
                  const order = orderById.get(row.order_id);
                  const schedule = scheduleLabel(row);
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        onClick={() => setSelectedId(row.id)}
                      >
                        <span className="min-w-0 flex-1 space-y-0.5">
                          <span className="flex items-center justify-between gap-3">
                            <strong className="truncate text-sm font-semibold text-slate-900">{order?.health_facility_name || `Pesanan #${shortId(row)}`}</strong>
                            <StatusLabel row={row} />
                          </span>
                          {order && <span className="block truncate text-[13px] text-slate-700">{itemSummary(order)}</span>}
                          <span className="flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span className="truncate">{schedule.title} · {schedule.date ? formatDate(schedule.date) : "-"}</span>
                            <strong className="shrink-0 text-[13px] font-semibold text-slate-900">{formatIDR(row.amount)}</strong>
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <table className="hidden w-full table-fixed border-collapse text-left lg:table">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                    <th className="w-[150px] px-5 py-3 font-medium">Pesanan</th>
                    <th className="px-3 py-3 font-medium">Faskes</th>
                    <th className="w-[120px] px-3 py-3 text-right font-medium">Jumlah</th>
                    <th className="w-[150px] px-3 py-3 font-medium">Jadwal</th>
                    <th className="w-[170px] px-3 py-3 font-medium">Status</th>
                    <th className="w-[52px] px-3 py-3"><span className="sr-only">Detail</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const order = orderById.get(row.order_id);
                    const schedule = scheduleLabel(row);
                    return (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b border-slate-100 text-[13px] transition-colors last:border-0 hover:bg-slate-50"
                        onClick={() => setSelectedId(row.id)}
                      >
                        <td className="px-5 py-2.5">
                          <strong className="block font-semibold text-slate-900">#{shortId(row)}</strong>
                          <span className="text-xs text-slate-500">{row.arrived_at ? `Tiba ${formatShortDate(row.arrived_at)}` : "-"}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="block truncate text-slate-900">{order?.health_facility_name || "Faskes"}</span>
                          {order && <span className="block truncate text-xs text-slate-500" title={itemSummary(order)}>{itemSummary(order)}</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-900">{formatIDR(row.amount)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`block ${stateOf(row) === "overdue" ? "text-red-600" : "text-slate-500"} text-xs`}>{schedule.title}</span>
                          <span className="block text-slate-900">{schedule.date ? formatShortDate(schedule.date) : "-"}</span>
                        </td>
                        <td className="px-3 py-2.5"><StatusLabel row={row} /></td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Lihat detail alokasi pesanan ${shortId(row)}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(row.id);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-2.5 text-[13px] text-slate-500">
                <span>{firstIndex + 1}–{firstIndex + visibleRows.length} dari {filtered.length} pesanan</span>
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
                <DialogDescription className="text-[13px] text-slate-500">
                  Pesanan #{shortId(selected)}{selectedOrder?.health_facility_name ? ` · ${selectedOrder.health_facility_name}` : ""}
                </DialogDescription>
                <DialogTitle className="mt-1 text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
                  {formatIDR(selected.amount)}
                </DialogTitle>
                <div className="mt-1"><StatusLabel row={selected} /></div>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-[13px]">
                {stateOf(selected) === "overdue" && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-red-800">
                    Dana belum masuk dan sudah lewat {daysPast(selected.due_at)} hari dari target {formatDate(selected.due_at)}.
                  </p>
                )}

                <section>
                  <h3 className="text-xs font-medium text-slate-500">Progres dana</h3>
                  <AllocationTracker row={selected} />
                </section>

                <dl className="divide-y divide-slate-100 border-y border-slate-100">
                  {[
                    { label: selected.status === "paid" ? "Dana masuk" : "Target alokasi", value: formatDateTime(selected.status === "paid" ? selected.paid_at : selected.due_at) },
                    { label: "Rekening tujuan", value: hasBankAccount(selected) ? `${selected.bank_name} · ${selected.bank_account_number} · ${selected.bank_account_holder}` : "Belum lengkap" },
                    { label: "Posisi barang", value: selected.order_status === "completed" ? "Sudah diserahkan ke keluarga" : "Di Faskes" },
                    ...(selected.transfer_reference ? [{ label: "Nomor referensi", value: selected.transfer_reference }] : []),
                  ].map((item) => (
                    <div key={item.label} className="flex items-baseline justify-between gap-4 py-2">
                      <dt className="shrink-0 text-slate-500">{item.label}</dt>
                      <dd className="min-w-0 break-words text-right text-slate-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                {selectedOrder && (
                  <section>
                    <h3 className="text-xs font-medium text-slate-500">Isi pesanan</h3>
                    <ul className="mt-1 divide-y divide-slate-100">
                      {selectedOrder.items.map((item) => (
                        <li key={item.product_id} className="flex items-baseline justify-between gap-3 py-2 text-slate-900">
                          <span className="min-w-0">{item.quantity}× {item.product_name}</span>
                          <span className="shrink-0">{formatIDR(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {selected.receipt_notes && (
                  <section>
                    <h3 className="text-xs font-medium text-slate-500">Catatan Faskes</h3>
                    <p className="mt-1 text-slate-900">{selected.receipt_notes}</p>
                  </section>
                )}

                {selected.receipt_evidence_url && (
                  <section>
                    <h3 className="text-xs font-medium text-slate-500">Bukti penerimaan</h3>
                    <img
                      src={selected.receipt_evidence_url}
                      alt="Foto bukti penerimaan barang di Faskes"
                      className="mt-1 max-h-56 w-full rounded-xl bg-[#f5f5f7] object-contain"
                    />
                  </section>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
