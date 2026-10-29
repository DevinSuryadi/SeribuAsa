import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/format";
import {
  listFacilityRedemptions,
  type FacilityOrder,
} from "@/services/facility-orders";
import previewEvidence from "@/assets/recomAI-image.svg";
import {
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  FileDown,
  History,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

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
  const [period, setPeriod] = useState("30");
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

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

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
            className="rounded-xl bg-white"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Perbarui
          </Button>
          <Button
            variant="outline"
            className="rounded-xl bg-white"
            onClick={exportReport}
            disabled={filteredRows.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Ekspor laporan
          </Button>
        </>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_170px_190px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 rounded-xl border-slate-200 pl-9"
                placeholder="Cari nama atau nomor KK"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="30">30 hari terakhir</option>
              <option value="90">90 hari terakhir</option>
              <option value="365">1 tahun terakhir</option>
              <option value="all">Semua periode</option>
            </select>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
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
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>
              {filteredRows.length} penyaluran · urut terbaru
            </span>
          </div>
        </div>

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
                      className="flex w-full items-start gap-3 px-4 py-4 text-left text-sm transition-colors hover:bg-emerald-50/40"
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
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
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
                        className="cursor-pointer border-b border-slate-100 text-sm transition-colors last:border-0 hover:bg-emerald-50/40"
                        onClick={() => setSelected(order)}
                      >
                        <td className="px-5 py-4 align-top">
                          <strong className="block whitespace-nowrap text-slate-900">
                            {formatDate(distribution.distributed_at)}
                          </strong>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            pukul {formatTime(distribution.distributed_at)}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top font-semibold text-slate-900">
                          {order.family_name || "Keluarga"}
                          {showingPreview && (
                            <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                              #PREVIEW1
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="block font-medium text-slate-900">
                            {distribution.recipient_name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {distribution.recipient_relation}
                          </span>
                        </td>
                        <td className="max-w-[260px] px-4 py-4 align-top">
                          <span className="block truncate text-slate-900">
                            {itemSummary(order)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {order.items.length} item
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top text-slate-700">
                          {order.vendor_name || "Vendor"}
                        </td>
                        <td className="px-4 py-4 text-right align-top font-semibold text-slate-900">
                          {formatIDR(order.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-center align-top">
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
                        <td className="px-3 py-4 align-top">
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Menampilkan {filteredRows.length} dari {rows.length}</span>
              <span>
                Total tersalurkan{" "}
                <strong className="text-slate-900">{formatIDR(total)}</strong>
              </span>
            </footer>
          </>
        )}
      </section>

      {selected?.distribution && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-transparent"
            aria-label="Tutup detail penyaluran"
            onClick={() => setSelected(null)}
          />
          <aside
            className="relative z-10 flex h-full w-full max-w-[540px] flex-col border-l border-slate-200 bg-white shadow-[-18px_0_45px_rgba(15,23,42,0.12)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="distribution-detail-title"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Penyaluran · #{showingPreview ? "PREVIEW1" : selected.id.slice(0, 8).toUpperCase()}
                </p>
                <h2
                  className="mt-1 text-lg font-bold text-slate-950"
                  id="distribution-detail-title"
                >
                  {selected.family_name || "Keluarga"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    <Check className="mr-1 h-3 w-3" />
                    Diterima
                  </Badge>
                  <span>
                    {formatDate(selected.distribution.distributed_at)}, pukul{" "}
                    {formatTime(selected.distribution.distributed_at)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => setSelected(null)}
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto">
              <section className="border-b border-slate-100 p-6">
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Bukti penerimaan
                </h3>
                {selected.distribution.evidence_url ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={selected.distribution.evidence_url}
                      alt={`Bukti penerimaan ${selected.family_name || ""}`}
                      className="aspect-[16/9] w-full object-cover"
                    />
                    <a
                      href={selected.distribution.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      Lihat ukuran penuh
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                    Bukti tidak tersedia
                  </div>
                )}
              </section>

              <section className="grid grid-cols-2 gap-5 border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs text-slate-500">Diterima oleh</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selected.distribution.recipient_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selected.distribution.recipient_relation}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Vendor</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selected.vendor_name || "Vendor"}
                  </p>
                </div>
              </section>

              <section className="border-b border-slate-100 px-6 py-5">
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  Bantuan yang diterima
                </h3>
                <div className="divide-y divide-slate-100">
                  {selected.items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <span className="text-slate-700">
                        {item.quantity}× {item.product_name}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatIDR(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-bold">
                  <span>Total bantuan</span>
                  <span>{formatIDR(selected.total_amount)}</span>
                </div>
              </section>

              {selected.distribution.notes && (
                <section className="px-6 py-5">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Catatan petugas
                  </h3>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                    {selected.distribution.notes}
                  </p>
                </section>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => window.print()}
              >
                <Download className="mr-2 h-4 w-4" />
                Unduh bukti (PDF)
              </Button>
            </footer>
          </aside>
        </div>
      )}
    </DashboardLayout>
  );
}
