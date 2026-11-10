import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorState } from "@/components/dashboard/ErrorState";
import FacilityDistributionDialog from "@/components/order/FacilityDistributionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIDR } from "@/lib/format";
import { getFamily, listFamilies, type Family } from "@/services/facility-families";
import { listFacilityOrders, listFacilityRedemptions, type FacilityOrder } from "@/services/facility-orders";
import { ArrowRight, RefreshCw, Search } from "lucide-react";
import previewEvidence from "@/assets/recomAI-image.svg";

const previewHistory: FacilityOrder[] = [
  {
    id: "preview-order-20261008-001",
    family_id: "preview-family-001",
    family_name: "Keluarga Ibu Siti Aminah",
    health_facility_name: "Puskesmas Sukamaju",
    delivery_address: "Jl. Melati No. 18, Sukamaju",
    vendor_id: "preview-vendor-001",
    vendor_name: "Warung Sehat Bu Rina",
    items: [
      { product_id: "preview-product-egg", product_name: "Telur ayam", quantity: 2, price: 31000, subtotal: 62000 },
      { product_id: "preview-product-milk", product_name: "Susu UHT", quantity: 4, price: 18500, subtotal: 74000 },
      { product_id: "preview-product-vegetable", product_name: "Paket sayur segar", quantity: 2, price: 27000, subtotal: 54000 },
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
  {
    id: "preview-order-20261002-002",
    family_id: "preview-family-002",
    family_name: "Keluarga Bapak Ahmad Fauzi",
    health_facility_name: "Puskesmas Sukamaju",
    delivery_address: "Kp. Cempaka RT 04/RW 02",
    vendor_id: "preview-vendor-002",
    vendor_name: "Toko Pangan Berkah",
    items: [
      { product_id: "preview-product-rice", product_name: "Beras premium 5 kg", quantity: 1, price: 76000, subtotal: 76000 },
      { product_id: "preview-product-fish", product_name: "Ikan kembung", quantity: 2, price: 42000, subtotal: 84000 },
    ],
    total_amount: 160000,
    status: "completed",
    payment_status: "paid",
    funding_status: "spent",
    funded_amount: 160000,
    spent_amount: 160000,
    created_at: "2026-10-01T04:20:00.000Z",
    received_at: "2026-10-02T07:45:00.000Z",
    receipt_notes: null,
    distribution: {
      id: "preview-distribution-002",
      recipient_name: "Ahmad Fauzi",
      recipient_relation: "Kepala keluarga",
      evidence_url: null,
      items_complete: true,
      notes: null,
      distributed_at: "2026-10-02T07:45:00.000Z",
    },
  },
];

function formatEventTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
}

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

export default function FacilityRedemptionHistory() {
  const { familyId } = useParams<{ familyId: string }>();
  const [family, setFamily] = useState<Family | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [proofOrder, setProofOrder] = useState<FacilityOrder | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      const forceRefresh = refreshKey > 0;
      try {
        if (familyId) {
          const [familyData, familyOrders] = await Promise.all([
            getFamily(familyId, forceRefresh),
            listFacilityOrders(familyId),
          ]);
          if (active) {
            setFamily(familyData);
            setOrders(familyOrders);
          }
        } else {
          const [historyRows, familyRows] = await Promise.all([
            listFacilityRedemptions(undefined, forceRefresh),
            listFamilies(forceRefresh),
          ]);
          if (active) {
            setFamily(null);
            setFamilies(familyRows);
            setOrders(historyRows);
          }
        }
      } catch (err) {
        if (active) {
          setOrders([]);
          setError(err instanceof Error ? err.message : "Gagal memuat riwayat penyaluran");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [familyId, refreshKey]);

  useEffect(() => { setSearch(""); }, [familyId]);

  const actualHistory = useMemo(() => orders.filter((order) => Boolean(order.distribution)), [orders]);
  const showingPreview = import.meta.env.DEV && !loading && !error && !familyId && actualHistory.length === 0;
  const history = showingPreview ? previewHistory : actualHistory;
  const readyForProof = useMemo(() => familyId
    ? orders.filter((order) => !order.distribution && order.receipt_status === "accepted")
    : [], [familyId, orders]);
  // Ordered, being prepared, or on the way: the facility can only wait for the vendor.
  const waitingForVendor = useMemo(() => familyId
    ? orders.filter((order) => ["pending", "processing", "shipped"].includes(order.status))
    : [], [familyId, orders]);
  const waitingForFunding = useMemo(() => familyId
    ? orders.filter((order) => order.status === "pending_approval")
    : [], [familyId, orders]);
  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return history;
    return history.filter((order) => (familyId ? [
      order.id,
      order.family_name,
      order.vendor_name,
      order.distribution?.recipient_name,
      order.distribution?.recipient_relation,
      ...order.items.map((item) => item.product_name),
    ] : [order.family_name]).some((value) => value?.toLowerCase().includes(term)));
  }, [familyId, history, search]);
  const matchingFamilies = useMemo(() => {
    if (familyId) return [];
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return families.filter((item) =>
      item.head_name.toLowerCase().includes(term) || item.kk_number.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [families, familyId, search]);

  const familyName = family?.head_name || orders[0]?.family_name || "keluarga";

  return (
    <DashboardLayout
      title={familyId ? "Bantuan & Riwayat" : "Riwayat Penyaluran"}
      subtitle={familyId
        ? `Unggah bukti penerimaan dan lihat seluruh bantuan untuk keluarga ${familyName}.`
        : "Arsip lengkap bantuan yang telah diterima seluruh keluarga."}
    >
      <div className="space-y-6">
        {!loading && !error && familyId && readyForProof.length > 0 && (
          <Card className="overflow-hidden rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
            <CardHeader className="border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <div><CardTitle className="text-base font-bold text-slate-900">Perlu bukti penerimaan</CardTitle><p className="mt-1 text-sm text-muted-foreground">Unggah setelah bantuan benar-benar diterima keluarga.</p></div>
              </div>
              <span className="text-[13px] font-semibold text-amber-700">{readyForProof.length} pesanan</span>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {readyForProof.map((order) => (
                <article key={order.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Pesanan #{shortId(order.id)} · {order.vendor_name || "Vendor"} · {formatIDR(order.total_amount)}</p>
                  </div>
                  <Button className="shrink-0 rounded-full" onClick={() => setProofOrder(order)}>Unggah bukti</Button>
                </article>
              ))}
            </CardContent>
          </Card>
        )}

        {!loading && !error && familyId && waitingForVendor.length > 0 && (
          <div className="rounded-xl bg-blue-50 px-4 py-3">
            <div><p className="font-semibold text-blue-950">{waitingForVendor.length} pesanan belum tiba di Faskes</p><p className="mt-1 text-sm text-blue-800">Bukti penyaluran tersedia setelah Faskes mengonfirmasi barang diterima lengkap.</p></div>
          </div>
        )}
        {!loading && !error && familyId && waitingForFunding.length > 0 && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{waitingForFunding.length} pesanan lama belum didanai. Batalkan dari halaman Pesanan lalu pesan kembali setelah dana pool tersedia.</div>}

        <Card className="overflow-hidden rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
          <CardHeader className="gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><CardTitle className="text-base font-bold text-slate-900">Riwayat lengkap</CardTitle>{!loading && !error && <span className="text-[13px] text-slate-500">{history.length}</span>}{!loading && !error && showingPreview && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Data contoh</Badge>}</div>
                <p className="mt-1 text-sm text-muted-foreground">Bukti penerimaan diurutkan dari yang terbaru.</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {!loading && !error && (!familyId || history.length > 0) && (
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input className="h-9 rounded-full border-0 bg-[#ececef] pl-9 text-sm shadow-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-0" aria-label={familyId ? "Cari riwayat penyaluran" : "Cari keluarga"} placeholder={familyId ? "Cari riwayat" : "Cari nama atau nomor KK"} value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
              )}
              <Button variant="outline" className="rounded-full bg-white" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Segarkan
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            {error && (
              <ErrorState
                title="Gagal memuat riwayat penyaluran"
                message={error}
                onRetry={() => setRefreshKey((key) => key + 1)}
              />
            )}

            {loading && (
              <div className="space-y-3" aria-label="Memuat riwayat penyaluran">
                {[0, 1, 2].map((item) => <Skeleton key={item} className="h-20 w-full rounded-xl" />)}
              </div>
            )}

            {!loading && !error && !familyId && search.trim() && (
              <div className="mb-5 rounded-xl bg-[#F4F7F5] p-3">
                <p className="px-2 pb-2 text-[13px] font-medium text-slate-500">Hasil pencarian keluarga</p>
                {matchingFamilies.length > 0 ? (
                  <div className="divide-y divide-border/70">
                    {matchingFamilies.map((item) => (
                      <Link key={item.id} to={`/dashboard/health-facility/families/${item.id}/redemptions`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white">
                        <span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{item.head_name.charAt(0).toUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-sm">{item.head_name}</strong><span className="block text-xs text-muted-foreground">KK {item.kk_number}</span></span></span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                      </Link>
                    ))}
                  </div>
                ) : <p className="px-2 py-4 text-center text-sm text-muted-foreground">Keluarga tidak ditemukan.</p>}
              </div>
            )}

            {!loading && !error && history.length === 0 && (!search.trim() || Boolean(familyId)) && (
              <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
                <h3 className="font-semibold">Belum ada riwayat penyaluran</h3>
                <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{familyId ? "Riwayat akan muncul otomatis setelah bukti penerimaan keluarga disimpan." : "Cari keluarga melalui kolom di atas untuk membuka bantuan dan mengunggah bukti penerimaan."}</p>
              </div>
            )}

            {!loading && !error && history.length > 0 && filteredHistory.length === 0 && (
              <div className="py-10 text-center"><p className="font-semibold">Riwayat tidak ditemukan</p><p className="mt-1 text-sm text-muted-foreground">Coba gunakan kata kunci lain.</p></div>
            )}

            {!loading && !error && filteredHistory.length > 0 && (
              <div className="space-y-4">
                {filteredHistory.map((order) => {
                  const distribution = order.distribution;
                  if (!distribution) return null;
                  return (
                    <article key={order.id} className="overflow-hidden rounded-xl bg-[#F4F7F5]">
                      <header className="flex flex-col gap-3 border-b border-black/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{order.family_name || familyName}</h3><span className="inline-flex items-center text-[13px] font-medium text-emerald-700"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />Sudah disalurkan</span></div><p className="mt-1 text-xs text-muted-foreground">Pesanan #{shortId(order.id)}</p></div>
                        <time className="text-sm font-medium text-muted-foreground" dateTime={distribution.distributed_at}>{formatEventTime(distribution.distributed_at)}</time>
                      </header>

                      <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="space-y-4 p-5">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-white p-3"><div><p className="text-xs text-muted-foreground">Penerima</p><p className="font-semibold">{distribution.recipient_name}</p>{distribution.recipient_relation && <p className="text-xs text-muted-foreground">{distribution.recipient_relation}</p>}</div></div>
                            <div className="rounded-xl bg-white p-3"><div><p className="text-xs text-muted-foreground">Vendor</p><p className="font-semibold">{order.vendor_name || "Vendor"}</p></div></div>
                          </div>

                          <div>
                            <p className="mb-2 text-sm font-semibold">Bantuan yang diterima</p>
                            <div className="divide-y divide-slate-100 rounded-xl bg-white">{order.items.map((item) => <div key={item.product_id} className="flex justify-between gap-3 px-4 py-3 text-sm"><span>{item.quantity}× {item.product_name}</span><span className="shrink-0 text-muted-foreground">{formatIDR(item.subtotal)}</span></div>)}</div>
                            <div className="mt-3 flex justify-between text-sm font-semibold"><span>Total bantuan</span><span className="text-primary">{formatIDR(order.total_amount)}</span></div>
                          </div>
                          {distribution.notes && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">Catatan</p><p className="mt-1 leading-6">{distribution.notes}</p></div>}
                        </div>

                        <aside className="border-t border-black/[0.06] p-5 lg:border-l lg:border-t-0">
                          <p className="mb-3 text-sm font-semibold">Bukti penerimaan</p>
                          {distribution.evidence_url
                            ? <a href={distribution.evidence_url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl bg-white"><img src={distribution.evidence_url} alt={`Bukti penerimaan ${order.family_name || familyName}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.02]" /><span className="flex items-center justify-center gap-2 border-t px-3 py-2 text-xs font-semibold text-primary">Lihat foto penuh</span></a>
                            : <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-white text-sm text-muted-foreground">Foto tidak tersedia</div>}
                        </aside>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FacilityDistributionDialog
        order={proofOrder}
        onClose={() => setProofOrder(null)}
        onDistributed={(updated) => setOrders((current) => current.map((order) => order.id === updated.id ? updated : order))}
      />
    </DashboardLayout>
  );
}
