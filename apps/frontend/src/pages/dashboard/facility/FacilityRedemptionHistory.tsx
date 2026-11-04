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
import { ArrowRight, Camera, CheckCircle2, Clock3, ExternalLink, History, ImageIcon, Package, RefreshCw, Search, Store, UserRound } from "lucide-react";
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
            listFacilityOrders(familyId, forceRefresh),
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
  const waitingForVendor = useMemo(() => familyId
    ? orders.filter((order) => !order.distribution && order.status === "pending")
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
          <Card className="overflow-hidden rounded-2xl border-amber-200 shadow-sm">
            <CardHeader className="border-b border-amber-100 bg-amber-50/70 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Camera className="h-5 w-5" /></span>
                <div><CardTitle className="text-base font-bold text-slate-900">Perlu bukti penerimaan</CardTitle><p className="mt-1 text-sm text-muted-foreground">Unggah setelah bantuan benar-benar diterima keluarga.</p></div>
              </div>
              <Badge variant="outline" className="w-fit border-amber-200 bg-white text-amber-800">{readyForProof.length} pesanan</Badge>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {readyForProof.map((order) => (
                <article key={order.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Pesanan #{shortId(order.id)} · {order.vendor_name || "Vendor"} · {formatIDR(order.total_amount)}</p>
                  </div>
                  <Button className="shrink-0 rounded-xl" onClick={() => setProofOrder(order)}><Camera className="mr-2 h-4 w-4" /> Unggah bukti</Button>
                </article>
              ))}
            </CardContent>
          </Card>
        )}

        {!loading && !error && familyId && waitingForVendor.length > 0 && (
          <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div><p className="font-semibold text-blue-950">{waitingForVendor.length} pesanan sedang disiapkan vendor</p><p className="mt-1 text-sm text-blue-800">Bukti penyaluran tersedia setelah Faskes mengonfirmasi barang diterima lengkap.</p></div>
          </div>
        )}
        {!loading && !error && familyId && waitingForFunding.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{waitingForFunding.length} pesanan lama belum didanai. Batalkan dari halaman Pesanan lalu pesan kembali setelah dana pool tersedia.</div>}

        <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="gap-4 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><History className="h-5 w-5" /></span>
              <div>
                <div className="flex flex-wrap items-center gap-2"><CardTitle className="text-base font-bold text-slate-900">Riwayat lengkap</CardTitle>{!loading && !error && <Badge variant="secondary">{history.length}</Badge>}{!loading && !error && showingPreview && <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Data contoh</Badge>}</div>
                <p className="mt-1 text-sm text-muted-foreground">Bukti penerimaan diurutkan dari yang terbaru.</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {!loading && !error && (!familyId || history.length > 0) && (
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input className="rounded-xl pl-9" aria-label={familyId ? "Cari riwayat penyaluran" : "Cari keluarga"} placeholder={familyId ? "Cari riwayat" : "Cari nama atau nomor KK"} value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
              )}
              <Button variant="outline" className="rounded-xl" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Perbarui
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
              <div className="mb-5 rounded-xl border border-slate-200 bg-secondary/15 p-3">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hasil pencarian keluarga</p>
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
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/15 px-5 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><History className="h-6 w-6" /></span>
                <h3 className="mt-4 font-semibold">Belum ada riwayat penyaluran</h3>
                <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{familyId ? "Riwayat akan muncul otomatis setelah bukti penerimaan keluarga disimpan." : "Cari keluarga melalui kolom di atas untuk membuka bantuan dan mengunggah bukti penerimaan."}</p>
              </div>
            )}

            {!loading && !error && history.length > 0 && filteredHistory.length === 0 && (
              <div className="rounded-xl border border-dashed border-border py-10 text-center"><Search className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 font-semibold">Riwayat tidak ditemukan</p><p className="mt-1 text-sm text-muted-foreground">Coba gunakan kata kunci lain.</p></div>
            )}

            {!loading && !error && filteredHistory.length > 0 && (
              <div className="space-y-4">
                {filteredHistory.map((order) => {
                  const distribution = order.distribution;
                  if (!distribution) return null;
                  return (
                    <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-background">
                      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{order.family_name || familyName}</h3><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Diterima</Badge></div><p className="mt-1 text-xs text-muted-foreground">Pesanan #{shortId(order.id)}</p></div>
                        <time className="text-sm font-medium text-muted-foreground" dateTime={distribution.distributed_at}>{formatEventTime(distribution.distributed_at)}</time>
                      </header>

                      <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="space-y-4 p-5">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex gap-3 rounded-xl bg-secondary/30 p-3"><UserRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Penerima</p><p className="font-semibold">{distribution.recipient_name}</p>{distribution.recipient_relation && <p className="text-xs text-muted-foreground">{distribution.recipient_relation}</p>}</div></div>
                            <div className="flex gap-3 rounded-xl bg-secondary/30 p-3"><Store className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">Vendor</p><p className="font-semibold">{order.vendor_name || "Vendor"}</p></div></div>
                          </div>

                          <div>
                            <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-primary" /> Bantuan yang diterima</p>
                            <div className="divide-y rounded-xl border border-slate-200">{order.items.map((item) => <div key={item.product_id} className="flex justify-between gap-3 px-4 py-3 text-sm"><span>{item.quantity}× {item.product_name}</span><span className="shrink-0 text-muted-foreground">{formatIDR(item.subtotal)}</span></div>)}</div>
                            <div className="mt-3 flex justify-between text-sm font-semibold"><span>Total bantuan</span><span className="text-primary">{formatIDR(order.total_amount)}</span></div>
                          </div>
                          {distribution.notes && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">Catatan</p><p className="mt-1 leading-6">{distribution.notes}</p></div>}
                        </div>

                        <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4 text-primary" /> Bukti penerimaan</p>
                          {distribution.evidence_url
                            ? <a href={distribution.evidence_url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border bg-white"><img src={distribution.evidence_url} alt={`Bukti penerimaan ${order.family_name || familyName}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.02]" /><span className="flex items-center justify-center gap-2 border-t px-3 py-2 text-xs font-semibold text-primary">Lihat foto penuh <ExternalLink className="h-3.5 w-3.5" /></span></a>
                            : <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed bg-white text-sm text-muted-foreground">Foto tidak tersedia</div>}
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
