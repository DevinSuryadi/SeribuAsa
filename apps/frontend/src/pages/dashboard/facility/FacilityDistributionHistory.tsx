import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/format";
import {
  listFacilityRedemptions,
  type FacilityOrder,
} from "@/services/facility-orders";
import previewEvidence from "@/assets/recomAI-image.svg";
import { ChevronRight, FileDown, History, RefreshCw, Search } from "lucide-react";

const previewRows: FacilityOrder[] = [
  {
    id: "preview-order-20261008-001",
    family_id: "preview-family-001",
    family_name: "Keluarga Ibu Siti Aminah",
    health_facility_name: "Puskesmas Sukamaju",
    delivery_address: "Jl. Melati No. 18, Sukamaju",
    vendor_id: "preview-vendor-001",
    vendor_name: "Warung Sehat Bu Rina",
    items: [
      { product_id: "preview-egg", product_name: "Telur ayam", quantity: 2, price: 31000, subtotal: 62000 },
      { product_id: "preview-milk", product_name: "Susu UHT", quantity: 4, price: 18500, subtotal: 74000 },
      { product_id: "preview-vegetable", product_name: "Paket sayur segar", quantity: 2, price: 27000, subtotal: 54000 },
    ],
    total_amount: 190000,
    status: "completed",
    payment_status: "paid",
    funding_status: "spent",
    funded_amount: 190000,
    spent_amount: 190000,
    created_at: "2026-10-07T03:15:00.000Z",
    received_at: "2026-10-08T08:30:00.000Z",
    receipt_notes: null,
    distribution: {
      id: "preview-distribution-001",
      recipient_name: "Siti Aminah",
      recipient_relation: "Ibu kandung",
      evidence_url: previewEvidence,
      items_complete: true,
      notes: "Seluruh bantuan diterima dalam kondisi baik dan lengkap.",
      distributed_at: "2026-10-08T08:30:00.000Z",
    },
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value)
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
}

function itemSummary(order: FacilityOrder) {
  return order.items
    .map((item) => `${item.quantity}× ${item.product_name}`)
    .join(", ");
}

export default function FacilityDistributionHistory() {
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [selected, setSelected] = useState<FacilityOrder | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await listFacilityRedemptions(undefined, refreshKey > 0);
        if (active) setOrders(rows);
      } catch (loadError) {
        if (active) {
          setOrders([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat riwayat penyaluran",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const actualRows = useMemo(
    () => orders.filter((order) => Boolean(order.distribution)),
    [orders],
  );
  const showingPreview = import.meta.env.DEV && !loading && !error && actualRows.length === 0;
  const rows = showingPreview ? previewRows : actualRows;

  const vendors = useMemo(
    () =>
      Array.from(
        new Set(rows.map((order) => order.vendor_name).filter(Boolean)),
      ) as string[],
    [rows],
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const days = Number(period);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    return rows.filter((order) => {
      const distribution = order.distribution;
      if (!distribution) return false;
      const matchesSearch =
        !term ||
        [
          order.family_name,
          distribution.recipient_name,
          order.vendor_name,
          ...order.items.map((item) => item.product_name),
        ].some((value) => value?.toLowerCase().includes(term));
      const matchesVendor =
        vendor === "all" || order.vendor_name === vendor;
      const matchesPeriod =
        period === "all" ||
        new Date(distribution.distributed_at).getTime() >= threshold.getTime();
      return matchesSearch && matchesVendor && matchesPeriod;
    });
  }, [period, rows, search, vendor]);

  const total = filteredRows.reduce(
    (sum, order) => sum + order.total_amount,
    0,
  );

  const exportReport = () => {
    const csvRows = [
      ["Tanggal", "Keluarga", "Penerima", "Vendor", "Isi bantuan", "Total"],
      ...filteredRows.map((order) => [
        order.distribution ? formatDate(order.distribution.distributed_at) : "",
        order.family_name || "",
        order.distribution?.recipient_name || "",
        order.vendor_name || "",
        itemSummary(order),
        String(order.total_amount),
      ]),
    ];
    const csv = csvRows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "riwayat-penyaluran.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title={
        <span className="flex flex-wrap items-center gap-2">
          Riwayat penyaluran
          {showingPreview && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800"
            >
              Data contoh
            </Badge>
          )}
        </span>
      }
      subtitle="Arsip bantuan yang sudah diterima keluarga, lengkap dengan bukti penerimaan."
      actions={
        <>
          <Button
            variant="outline"
            className="rounded-full bg-white"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
          <Button
            variant="outline"
            className="rounded-full bg-white"
            onClick={exportReport}
            disabled={filteredRows.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Ekspor laporan
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative sm:flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            aria-label="Cari penyaluran"
            className="h-9 rounded-full border-0 bg-[#ececef] pl-9 text-sm shadow-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-0"
            placeholder="Cari keluarga, penerima, atau produk"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Periode penyaluran"
          className="h-9 rounded-full border-0 bg-[#ececef] px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          <option value="all">Semua waktu</option>
          <option value="30">30 hari terakhir</option>
          <option value="90">90 hari terakhir</option>
          <option value="365">1 tahun terakhir</option>
        </select>
        <select
          aria-label="Filter vendor"
          className="h-9 rounded-full border-0 bg-[#ececef] px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
          value={vendor}
          onChange={(event) => setVendor(event.target.value)}
        >
          <option value="all">Semua vendor</option>
          {vendors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <section className="overflow-hidden rounded-[20px] bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            className="m-4"
            title="Gagal memuat riwayat penyaluran"
            message={error}
            onRetry={() => setRefreshKey((key) => key + 1)}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<History className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />}
            title="Belum ada riwayat penyaluran"
            description="Riwayat akan muncul setelah bantuan diterima keluarga dan buktinya disimpan."
          />
        ) : filteredRows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-semibold text-slate-900">Riwayat tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">
              Coba ubah kata pencarian atau filter yang digunakan.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 lg:hidden">
              {filteredRows.map((order) => {
                const distribution = order.distribution;
                if (!distribution) return null;
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50"
                      onClick={() => setSelected(order)}
                    >
                      {distribution.evidence_url && (
                        <img
                          src={distribution.evidence_url}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1 space-y-1.5">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <strong className="text-slate-900">{order.family_name || "Keluarga"}</strong>
                          <strong className="text-slate-900">{formatIDR(order.total_amount)}</strong>
                        </span>
                        <span className="block text-xs text-slate-500">
                          {formatDate(distribution.distributed_at)}, pukul {formatTime(distribution.distributed_at)}
                        </span>
                        <span className="block truncate text-slate-600">{itemSummary(order)}</span>
                        <span className="block text-xs text-slate-500">
                          Diterima {distribution.recipient_name}
                          {distribution.recipient_relation ? ` (${distribution.recipient_relation})` : ""} · {order.vendor_name || "Vendor"}
                        </span>
                      </span>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 [&_th]:font-medium">
                    <th className="px-5 py-3">Diterima</th>
                    <th className="px-4 py-3">Keluarga</th>
                    <th className="px-4 py-3">Penerima</th>
                    <th className="px-4 py-3">Isi bantuan</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Bukti</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((order) => {
                    const distribution = order.distribution;
                    if (!distribution) return null;
                    return (
                      <tr
                        key={order.id}
                        className="cursor-pointer border-b border-slate-100 text-[13px] transition-colors last:border-0 hover:bg-slate-50"
                        onClick={() => setSelected(order)}
                      >
                        <td className="px-5 py-2.5 align-top">
                          <strong className="block whitespace-nowrap text-slate-900">
                            {formatDate(distribution.distributed_at)}
                          </strong>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            pukul {formatTime(distribution.distributed_at)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-top font-semibold text-slate-900">
                          {order.family_name || "Keluarga"}
                          {showingPreview && (
                            <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                              #PREVIEW1
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          <span className="block font-medium text-slate-900">
                            {distribution.recipient_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {distribution.recipient_relation}
                          </span>
                        </td>
                        <td className="max-w-[260px] px-4 py-2.5 align-top">
                          <span className="block truncate text-slate-900">
                            {itemSummary(order)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {order.items.length} item
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-top text-slate-700">
                          {order.vendor_name || "Vendor"}
                        </td>
                        <td className="px-4 py-2.5 text-right align-top font-semibold text-slate-900">
                          {formatIDR(order.total_amount)}
                        </td>
                        <td className="px-4 py-2.5 text-center align-top">
                          {distribution.evidence_url ? (
                            <img
                              src={distribution.evidence_url}
                              alt=""
                              className="mx-auto h-10 w-10 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-col gap-2 border-t border-slate-100 px-5 py-2.5 text-[13px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Menampilkan {filteredRows.length} dari {rows.length}</span>
              <span>
                Total tersalurkan{" "}
                <strong className="text-slate-900">{formatIDR(total)}</strong>
              </span>
            </footer>
          </>
        )}
      </section>

      <Dialog open={Boolean(selected?.distribution)} onOpenChange={(open: boolean) => { if (!open) setSelected(null); }}>
        <DialogContent className="left-auto right-3 top-3 flex h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[440px] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-[20px] p-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=open]:zoom-in-100 sm:rounded-[20px]">
          {selected?.distribution && (
            <>
              <header className="border-b border-slate-100 px-5 py-4 pr-12">
                <DialogTitle className="text-[17px] font-semibold tracking-tight text-slate-900">
                  {selected.family_name || "Keluarga"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-[13px] text-slate-500">
                  #{showingPreview ? "PREVIEW1" : selected.id.slice(0, 8)} · {formatDate(selected.distribution.distributed_at)}, pukul {formatTime(selected.distribution.distributed_at)}
                </DialogDescription>
                <span className="mt-2 inline-flex items-center whitespace-nowrap text-[13px] font-medium text-emerald-700">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                  Sudah disalurkan
                </span>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-[13px]">
                <section>
                  <h3 className="text-xs font-medium text-slate-500">Bukti penerimaan</h3>
                  {selected.distribution.evidence_url ? (
                    <a href={selected.distribution.evidence_url} target="_blank" rel="noreferrer" className="mt-1 block">
                      <img
                        src={selected.distribution.evidence_url}
                        alt={`Bukti penerimaan ${selected.family_name || ""}`}
                        className="max-h-56 w-full rounded-xl bg-[#f5f5f7] object-contain"
                      />
                    </a>
                  ) : (
                    <p className="mt-1 text-slate-900">Bukti tidak tersedia</p>
                  )}
                </section>

                <dl className="divide-y divide-slate-100 border-y border-slate-100">
                  {[
                    { label: "Diterima oleh", value: [selected.distribution.recipient_name, selected.distribution.recipient_relation].filter(Boolean).join(" · ") },
                    { label: "Vendor", value: selected.vendor_name || "Vendor" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-baseline justify-between gap-4 py-2">
                      <dt className="shrink-0 text-slate-500">{item.label}</dt>
                      <dd className="min-w-0 break-words text-right text-slate-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                <section>
                  <h3 className="text-xs font-medium text-slate-500">Bantuan yang diterima</h3>
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

                {selected.distribution.notes && (
                  <section>
                    <h3 className="text-xs font-medium text-slate-500">Catatan petugas</h3>
                    <p className="mt-1 text-slate-900">{selected.distribution.notes}</p>
                  </section>
                )}
              </div>

              <footer className="border-t border-slate-100 p-4">
                <Button variant="outline" className="w-full rounded-full" onClick={() => window.print()}>
                  Unduh bukti (PDF)
                </Button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
