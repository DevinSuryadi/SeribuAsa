import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import { formatDateTime, shortId } from "./adminUtils";
import { toast } from "sonner";
import {
  Store,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  Search,
  Tag,
  BoxSelect,
  Clock,
  Layers,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = "pending" | "approved" | "rejected";

type ProductReviewItem = {
  id: string;
  vendor_id: string;
  vendor_store_name?: string | null;
  category_name?: string | null;
  name: string;
  description?: string | null;
  price: string | number;
  voucher_price: string | number;
  stock_quantity: number;
  unit: string;
  approval_status: ApprovalStatus;
  created_at: string;
};

type ProductReviewListResponse = {
  items: ProductReviewItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type StoreSummary = {
  vendor_id: string;
  vendor_store_name: string;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  latestCreatedAt: string;
  items: ProductReviewItem[];
};

type StatusFilter = "all" | ApprovalStatus;

const PRODUCT_PAGE_SIZE = 100;

// ── Status config ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  ApprovalStatus,
  { label: string; dot: string; cls: string; bg: string }
> = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    bg: "bg-amber-50",
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-500",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bg: "bg-emerald-50",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-rose-500",
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
    bg: "bg-rose-50",
  },
};

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Store Card ────────────────────────────────────────────────────────────────

function StoreCard({ store, onClick }: { store: StoreSummary; onClick: () => void }) {
  const pendingPct =
    store.totalProducts > 0 ? Math.round((store.pendingProducts / store.totalProducts) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:shadow-md hover:ring-1 hover:ring-indigo-200 hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      {store.pendingProducts > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white shadow">
          {store.pendingProducts}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
            <Store className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-600 transition-colors truncate">
              {store.vendor_store_name}
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground/70 mt-0.5">
              {shortId(store.vendor_id)}
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {store.totalProducts} produk
        </span>
      </div>

      {/* Mini progress bar for pending ratio */}
      {store.pendingProducts > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{store.pendingProducts} pending</span>
            <span>{pendingPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-amber-400 transition-all"
              style={{ width: `${pendingPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Approved", val: store.approvedProducts, cls: "text-emerald-700 bg-emerald-50" },
          { label: "Pending", val: store.pendingProducts, cls: "text-amber-700 bg-amber-50" },
          { label: "Rejected", val: store.rejectedProducts, cls: "text-rose-700 bg-rose-50" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl py-2 ${s.cls}`}>
            <div className="text-base font-extrabold">{s.val}</div>
            <div className="text-[10px] font-semibold opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span>Update {formatDateTime(store.latestCreatedAt)}</span>
      </div>
    </button>
  );
}

// ── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({
  item,
  mutatingId,
  onApprove,
  onReject,
}: {
  item: ProductReviewItem;
  mutatingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isMutating = mutatingId === item.id;
  return (
    <tr className="group border-b border-border/50 hover:bg-slate-50/60 transition-colors">
      {/* Product name */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="font-semibold text-sm text-foreground">{item.name}</div>
        <div className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1">
          {item.description || "–"}
        </div>
      </td>

      {/* Category */}
      <td className="py-3.5 px-3 hidden sm:table-cell">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
          <Tag className="h-3 w-3" />
          {item.category_name || "–"}
        </span>
      </td>

      {/* Price */}
      <td className="py-3.5 px-3 hidden md:table-cell">
        <div className="text-xs font-bold text-foreground">
          {formatIDR(Number(item.price || 0))}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          E-Wallet: {formatIDR(Number(item.voucher_price || 0))}
        </div>
      </td>

      {/* Stock */}
      <td className="py-3.5 px-3 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BoxSelect className="h-3 w-3 flex-shrink-0" />
          <span>
            {item.stock_quantity} {item.unit}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-3.5 px-3">
        <StatusBadge status={item.approval_status} />
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-5 text-right">
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground inline" />
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              className="h-7 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
              onClick={() => onApprove(item.id)}
              disabled={item.approval_status === "approved"}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
              onClick={() => onReject(item.id)}
              disabled={item.approval_status === "rejected"}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchPage = async (page: number) =>
        (await apiFetch(
          `/admin/products/reviews?${new URLSearchParams({ page: String(page), page_size: String(PRODUCT_PAGE_SIZE) })}`
        )) as ProductReviewListResponse;

      const first = await fetchPage(1);
      const totalPages =
        first.total_pages || (first.total ? Math.ceil(first.total / PRODUCT_PAGE_SIZE) : 0);
      const allItems = [...(first.items ?? [])];

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2))
        );
        rest.forEach((p) => allItems.push(...(p.items ?? [])));
      }
      setItems(allItems);
    } catch (err: any) {
      const msg = err?.message ?? "Gagal memuat review produk";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const stores = useMemo<StoreSummary[]>(() => {
    const map = new Map<string, StoreSummary>();
    items.forEach((item) => {
      let s = map.get(item.vendor_id);
      if (!s) {
        s = {
          vendor_id: item.vendor_id,
          vendor_store_name: item.vendor_store_name ?? "Vendor",
          totalProducts: 0,
          pendingProducts: 0,
          approvedProducts: 0,
          rejectedProducts: 0,
          latestCreatedAt: item.created_at,
          items: [],
        };
        map.set(item.vendor_id, s);
      }
      s.totalProducts++;
      s.items.push(item);
      if (new Date(item.created_at) > new Date(s.latestCreatedAt))
        s.latestCreatedAt = item.created_at;
      if (item.approval_status === "approved") s.approvedProducts++;
      else if (item.approval_status === "rejected") s.rejectedProducts++;
      else s.pendingProducts++;
    });
    return Array.from(map.values()).sort(
      (a, b) => b.pendingProducts - a.pendingProducts || b.totalProducts - a.totalProducts
    );
  }, [items]);

  const selectedStore = useMemo(
    () => stores.find((s) => s.vendor_id === selectedStoreId) ?? null,
    [stores, selectedStoreId]
  );

  const visibleProducts = useMemo(() => {
    let list = selectedStore?.items ?? [];
    if (statusFilter !== "all") list = list.filter((p) => p.approval_status === statusFilter);
    if (search.trim())
      list = list.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));
    return list;
  }, [selectedStore, statusFilter, search]);

  useEffect(() => {
    if (selectedStoreId && !stores.some((s) => s.vendor_id === selectedStoreId))
      setSelectedStoreId(null);
  }, [selectedStoreId, stores]);

  const updateApproval = async (productId: string, approvalStatus: ApprovalStatus) => {
    try {
      setMutatingId(productId);
      await apiFetch(`/admin/products/${productId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approval_status: approvalStatus }),
      });
      toast.success(`Produk berhasil di-${approvalStatus === "approved" ? "approve" : "reject"}`);
      await loadProducts();
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memperbarui produk");
    } finally {
      setMutatingId(null);
    }
  };

  const totalPending = items.filter((i) => i.approval_status === "pending").length;
  const totalApproved = items.filter((i) => i.approval_status === "approved").length;

  return (
    <DashboardLayout
      title="Kelola Produk"
      subtitle="Review dan setujui katalog produk dari seluruh vendor mitra."
    >
      <div className="space-y-5">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Toko",
              val: stores.length,
              icon: Store,
              bg: "bg-indigo-50",
              ring: "ring-indigo-100",
              color: "text-indigo-700",
            },
            {
              label: "Total Produk",
              val: items.length,
              icon: Package,
              bg: "bg-slate-50",
              ring: "ring-slate-100",
              color: "text-slate-700",
            },
            {
              label: "Perlu Review",
              val: totalPending,
              icon: Layers,
              bg: "bg-amber-50",
              ring: "ring-amber-100",
              color: "text-amber-700",
            },
            {
              label: "Disetujui",
              val: totalApproved,
              icon: CheckCircle2,
              bg: "bg-emerald-50",
              ring: "ring-emerald-100",
              color: "text-emerald-700",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`flex items-center gap-3 rounded-2xl ${stat.bg} ring-1 ${stat.ring} p-4`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-extrabold leading-none ${stat.color}`}>
                  {stat.val}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-sm">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-rose-700 mb-4">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-300 text-rose-700 rounded-xl"
              onClick={() => void loadProducts()}
            >
              Coba Lagi
            </Button>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-secondary rounded-md" />
                    <div className="h-3 w-20 bg-secondary rounded-md" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-xl bg-secondary" />
                  <div className="h-12 rounded-xl bg-secondary" />
                  <div className="h-12 rounded-xl bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : selectedStore ? (
          /* ── Store Detail View ─────────────────────────────────────────── */
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-9 gap-1.5 flex-shrink-0"
                onClick={() => {
                  setSelectedStoreId(null);
                  setStatusFilter("all");
                  setSearch("");
                }}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Semua Toko
              </Button>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                  <Store className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {selectedStore.vendor_store_name}
                  </h2>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {shortId(selectedStore.vendor_id)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => {
                  const countMap: Record<string, number> = {
                    all: selectedStore.totalProducts,
                    pending: selectedStore.pendingProducts,
                    approved: selectedStore.approvedProducts,
                    rejected: selectedStore.rejectedProducts,
                  };
                  const active = statusFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`hidden sm:inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {f === "all" ? "Semua" : statusConfig[f as ApprovalStatus].label}
                      <span
                        className={`rounded px-1 text-[10px] font-bold ${active ? "bg-white/20" : "bg-secondary"}`}
                      >
                        {countMap[f]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk..."
                className="pl-10 h-9 text-sm rounded-xl bg-card border-border"
              />
            </div>

            {/* Products table */}
            {visibleProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Tidak ada produk</p>
                <p className="text-xs text-muted-foreground">Coba ubah filter status.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/60">
                      <th className="py-3 pl-5 pr-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Produk
                      </th>
                      <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Kategori
                      </th>
                      <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Harga
                      </th>
                      <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                        Stok
                      </th>
                      <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 pl-3 pr-5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((item) => (
                      <ProductRow
                        key={item.id}
                        item={item}
                        mutatingId={mutatingId}
                        onApprove={(id) => void updateApproval(id, "approved")}
                        onReject={(id) => void updateApproval(id, "rejected")}
                      />
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-border/50 bg-slate-50/40 px-5 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    Menampilkan{" "}
                    <span className="font-semibold text-foreground">{visibleProducts.length}</span>{" "}
                    produk
                    {statusFilter !== "all" && ` · filter: ${statusConfig[statusFilter].label}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Store className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground mb-1">Belum ada toko</p>
            <p className="text-xs text-muted-foreground">
              Belum ada vendor yang mengirim produk untuk direview.
            </p>
          </div>
        ) : (
          /* ── Store List View ───────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stores.length} toko terdaftar{" "}
                {totalPending > 0 && `· ${totalPending} produk perlu review`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-xl text-xs"
                onClick={() => void loadProducts()}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stores.map((store) => (
                <StoreCard
                  key={store.vendor_id}
                  store={store}
                  onClick={() => setSelectedStoreId(store.vendor_id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
