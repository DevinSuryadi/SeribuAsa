import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import { formatDateTime, shortId } from "./adminUtils";
import { toast } from "sonner";
import {
  Heart, Search, RefreshCw, AlertCircle, TrendingUp, Users,
  CheckCircle2, Clock, Wallet, ChevronLeft, ChevronRight,
} from "lucide-react";

type DonationItem = {
  id: string;
  donor_name?: string | null;
  amount: string | number;
  type: string;
  payment_method: string;
  status: string;
  midtrans_transaction_id?: string | null;
  created_at: string;
  allocation_status: string;
  voucher_created: boolean;
  allocated_beneficiaries: number;
  allocated_total: string | number;
};
type DonationListResponse = { items: DonationItem[]; total: number; total_pages?: number };
type StatusFilter = "all" | "success" | "pending" | "failed" | "refunded";
type AllocFilter  = "all" | "allocated" | "no_eligible_beneficiary" | "pending_payment";
const PAGE_SIZE = 20;

const psConfig: Record<string, { label: string; dot: string; cls: string }> = {
  success:  { label: "Berhasil", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending:  { label: "Menunggu", dot: "bg-amber-400",   cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  failed:   { label: "Gagal",    dot: "bg-rose-500",    cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  refunded: { label: "Pengembalian Dana",   dot: "bg-slate-400",   cls: "bg-slate-50 text-slate-600 ring-slate-200" },
};
const asConfig: Record<string, { label: string }> = {
  allocated:               { label: "Dialokasi" },
  no_eligible_beneficiary: { label: "Tdk ada penerima" },
  pending_payment:         { label: "Menunggu bayar" },
  failed:                  { label: "Gagal" },
  refunded:                { label: "Refunded" },
};

function DonationRow({ item }: { item: DonationItem }) {
  const ps = psConfig[item.status] ?? psConfig.pending;
  const as_ = asConfig[item.allocation_status] ?? { label: item.allocation_status };
  return (
    <tr className="group border-b border-border/50 hover:bg-slate-50/60 transition-colors">
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate max-w-[150px]">{item.donor_name ?? "Anonim"}</div>
            <div className="text-[11px] font-mono text-muted-foreground/70">{shortId(item.id)}</div>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-3">
        <div className="text-sm font-bold text-foreground">{formatIDR(Number(item.amount || 0))}</div>
        <div className="text-[10px] text-muted-foreground">{item.type} · {item.payment_method || "–"}</div>
      </td>
      <td className="py-3.5 px-3">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${ps.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${ps.dot}`} />
          {ps.label}
        </span>
      </td>
      <td className="py-3.5 px-3 hidden md:table-cell">
        <div className="text-xs font-semibold text-muted-foreground">{as_.label}</div>
        {item.allocated_beneficiaries > 0 && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Users className="h-3 w-3" />{item.allocated_beneficiaries} penerima
          </div>
        )}
      </td>
      <td className="py-3.5 px-3 hidden lg:table-cell">
        {item.voucher_created ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
            <Wallet className="h-3 w-3" /> E-Wallet
          </span>
        ) : <span className="text-xs text-muted-foreground/50">–</span>}
      </td>
      <td className="py-3.5 pl-3 pr-5 hidden xl:table-cell">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 flex-shrink-0" />{formatDateTime(item.created_at)}
        </div>
      </td>
    </tr>
  );
}

export default function AdminDonationsPage() {
  const [allItems, setAllItems] = useState<DonationItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [allocFilter, setAllocFilter]   = useState<AllocFilter>("all");
  const [page, setPage]         = useState(1);

  const loadDonations = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const first = (await apiFetch(`/admin/donations?page=1&page_size=100`)) as DonationListResponse;
      const totalPages = first.total_pages ?? 1;
      const all = [...(first.items ?? [])];
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            apiFetch(`/admin/donations?page=${i + 2}&page_size=100`) as Promise<DonationListResponse>
          )
        );
        rest.forEach((p) => all.push(...(p.items ?? [])));
      }
      setAllItems(all);
    } catch (err: any) {
      const msg = err?.message ?? "Gagal memuat donasi";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadDonations(); }, [loadDonations]);
  useEffect(() => { setPage(1); }, [search, statusFilter, allocFilter]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (allocFilter  !== "all") list = list.filter((i) => i.allocation_status === allocFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => (i.donor_name ?? "").toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    return list;
  }, [allItems, statusFilter, allocFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const stats = useMemo(() => ({
    total:    allItems.length,
    success:  allItems.filter((i) => i.status === "success").length,
    pending:  allItems.filter((i) => i.status === "pending").length,
    allocated: allItems.filter((i) => i.allocation_status === "allocated").length,
    totalAmount: allItems.filter((i) => i.status === "success").reduce((s, i) => s + Number(i.amount || 0), 0),
  }), [allItems]);

  return (
    <DashboardLayout title="Kelola Donasi" subtitle="Monitor transaksi donasi, status pembayaran, dan alokasi E-Wallet.">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Donasi",    val: stats.total,              icon: Heart,        bg: "bg-rose-50",    ring: "ring-rose-100",    color: "text-rose-700" },
            { label: "Berhasil",        val: stats.success,            icon: CheckCircle2, bg: "bg-emerald-50", ring: "ring-emerald-100", color: "text-emerald-700" },
            { label: "Menunggu",        val: stats.pending,            icon: Clock,        bg: "bg-amber-50",   ring: "ring-amber-100",   color: "text-amber-700" },
            { label: "Dialokasikan",    val: stats.allocated,          icon: Wallet,       bg: "bg-blue-50",    ring: "ring-blue-100",    color: "text-blue-700" },
            { label: "Total Terkumpul", val: formatIDR(stats.totalAmount), icon: TrendingUp, bg: "bg-indigo-50", ring: "ring-indigo-100", color: "text-indigo-700" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-3 rounded-2xl ${s.bg} ring-1 ${s.ring} p-3.5`}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-xl font-extrabold leading-none ${s.color} truncate`}>{s.val}</div>
                <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-1 p-3 border-b border-border/60 flex-wrap">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Bayar:</span>
            {(["all", "success", "pending", "failed", "refunded"] as StatusFilter[]).map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === f ? "bg-slate-900 text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}>
                {f === "all" ? "Semua" : (psConfig[f]?.label ?? f)}
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Alokasi:</span>
            {(["all", "allocated", "no_eligible_beneficiary", "pending_payment"] as AllocFilter[]).map((f) => (
              <button key={f} onClick={() => setAllocFilter(f)}
                className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${allocFilter === f ? "bg-emerald-700 text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"}`}>
                {f === "all" ? "Semua" : (asConfig[f]?.label ?? f)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama donor atau ID donasi..."
                className="pl-9 h-9 text-sm rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-slate-300" />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-xl px-3 text-xs gap-1.5 flex-shrink-0"
              onClick={() => void loadDonations()} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Muat Ulang
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">Menampilkan <span className="font-semibold text-foreground">{pageItems.length}</span> dari <span className="font-semibold text-foreground">{filtered.length}</span> donasi</p>
          <p className="text-xs text-muted-foreground">Hal. {page}/{totalPages}</p>
        </div>

        {/* Table */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-rose-700 mb-4">{error}</p>
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 rounded-xl" onClick={() => void loadDonations()}>Coba Lagi</Button>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-3.5 w-32 bg-secondary rounded" /><div className="h-2.5 w-20 bg-secondary rounded" /></div>
                <div className="h-5 w-20 bg-secondary rounded-lg" /><div className="h-5 w-20 bg-secondary rounded-lg hidden md:block" />
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground mb-1">Tidak ada donasi</p>
            <p className="text-xs text-muted-foreground">Coba ubah filter atau pencarian.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <th className="py-3 pl-5 pr-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Donatur</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nominal</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Alokasi</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">E-Wallet</th>
                  <th className="py-3 pl-3 pr-5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Waktu</th>
                </tr>
              </thead>
              <tbody>{pageItems.map((item) => <DonationRow key={item.id} item={item} />)}</tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/50 bg-slate-50/40 px-5 py-3">
                <p className="text-xs text-muted-foreground">{filtered.length} donasi · hal. {page}/{totalPages}</p>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const n = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                    if (n > totalPages) return null;
                    return <Button key={n} size="sm" variant={n === page ? "default" : "outline"} className="h-7 w-7 p-0 rounded-lg text-xs" onClick={() => setPage(n)}>{n}</Button>;
                  })}
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}><ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}