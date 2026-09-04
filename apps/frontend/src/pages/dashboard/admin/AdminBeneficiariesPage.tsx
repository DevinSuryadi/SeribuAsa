import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/services/api";
import { formatDateTime, shortId } from "./adminUtils";
import { toast } from "sonner";
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  CheckCircle2,
  XCircle,
  Activity,
  CalendarCheck,
  Wallet,
  Users2,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApprovalStatus = "pending" | "approved" | "rejected";

type EligibilityItem = {
  user_id: string;
  full_name: string;
  approval_status: ApprovalStatus;
  family_size: number;
  vouchers_balance: string | number;
  latest_fies_score?: number | null;
  latest_fies_classification?: string | null;
  latest_survey_date?: string | null;
  has_current_month_survey: boolean;
  eligible_for_allocation: boolean;
  allocation_month: string;
};

type EligibilityResponse = {
  items: EligibilityItem[];
  total: number;
};

type StatusFilter = "all" | ApprovalStatus;
type EligibilityFilter = "all" | "eligible" | "not_eligible";

const PAGE_SIZE = 20;

// ── Status helpers ────────────────────────────────────────────────────────────

const approvalConfig: Record<ApprovalStatus, { label: string; dot: string; cls: string }> = {
  pending:  { label: "Menunggu",  dot: "bg-amber-400",   cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  approved: { label: "Disetujui", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Ditolak",  dot: "bg-rose-500",    cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

function fiesScoreColor(score?: number | null): string {
  if (score == null) return "text-slate-400";
  if (score >= 7)  return "text-rose-600";
  if (score >= 4)  return "text-amber-600";
  return "text-emerald-600";
}

function fiesClassLabel(classification?: string | null): string {
  if (!classification) return "–";
  const map: Record<string, string> = {
    severe: "Parah",
    moderate: "Sedang",
    mild: "Ringan",
    none: "Aman",
  };
  return map[classification.toLowerCase()] ?? classification;
}

// ── Beneficiary Row ───────────────────────────────────────────────────────────

function BeneficiaryRow({ item }: { item: EligibilityItem }) {
  const approval = approvalConfig[item.approval_status] ?? approvalConfig.pending;
  const hasBalance = Number(item.vouchers_balance || 0) > 0;

  return (
    <tr className="group border-b border-border/50 hover:bg-slate-50/60 transition-colors">
      {/* Name */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate max-w-[160px]">{item.full_name}</div>
            <div className="text-[11px] font-mono text-muted-foreground/70 mt-0.5">{shortId(item.user_id)}</div>
          </div>
        </div>
      </td>

      {/* Approval status */}
      <td className="py-3.5 px-3">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${approval.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${approval.dot}`} />
          {approval.label}
        </span>
      </td>

      {/* FIES Survey */}
      <td className="py-3.5 px-3 hidden md:table-cell">
        <div className="space-y-1">
          <div className={`text-xs font-bold ${fiesScoreColor(item.latest_fies_score)}`}>
            {item.latest_fies_score != null ? `Skor ${item.latest_fies_score}` : "–"}
            {item.latest_fies_classification && (
              <span className="ml-1 font-normal opacity-80">
                · {fiesClassLabel(item.latest_fies_classification)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarCheck className="h-3 w-3 flex-shrink-0" />
            {item.has_current_month_survey ? (
              <span className="text-emerald-600 font-semibold">Survey bulan ini ✓</span>
            ) : (
              <span className="text-amber-600 font-semibold">Belum survey</span>
            )}
          </div>
        </div>
      </td>

      {/* Eligibility */}
      <td className="py-3.5 px-3">
        {item.eligible_for_allocation ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Layak
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-200">
            <XCircle className="h-3 w-3" />
            Tidak Layak
          </span>
        )}
      </td>

      {/* Family & Wallet */}
      <td className="py-3.5 px-3 hidden lg:table-cell">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users2 className="h-3 w-3 flex-shrink-0" />
            <span>{item.family_size} anggota keluarga</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${hasBalance ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}>
            <Wallet className="h-3 w-3 flex-shrink-0" />
            <span>{formatIDR(Number(item.vouchers_balance || 0))}</span>
          </div>
        </div>
      </td>

      {/* Survey date */}
      <td className="py-3.5 pl-3 pr-5 hidden xl:table-cell">
        <div className="text-[11px] text-muted-foreground">
          {item.latest_survey_date ? formatDateTime(item.latest_survey_date) : "–"}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminBeneficiariesPage() {
  const [allItems, setAllItems]   = useState<EligibilityItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter]         = useState<StatusFilter>("all");
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>("all");
  const [page, setPage]           = useState(1);

  const loadEligibility = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend max page_size = 100; fetch all pages
      const first = (await apiFetch(
        `/admin/beneficiaries/eligibility?page=1&page_size=100`
      )) as EligibilityResponse & { total_pages?: number };
      const totalPages = first.total_pages ?? 1;
      const all = [...(first.items ?? [])];
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            apiFetch(`/admin/beneficiaries/eligibility?page=${i + 2}&page_size=100`) as Promise<EligibilityResponse>
          )
        );
        rest.forEach((p) => all.push(...(p.items ?? [])));
      }
      setAllItems(all);
    } catch (err: any) {
      const msg = err?.message ?? "Gagal memuat data eligibility";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEligibility(); }, [loadEligibility]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, eligibilityFilter]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (statusFilter !== "all") list = list.filter((i) => i.approval_status === statusFilter);
    if (eligibilityFilter === "eligible")     list = list.filter((i) => i.eligible_for_allocation);
    if (eligibilityFilter === "not_eligible") list = list.filter((i) => !i.eligible_for_allocation);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => i.full_name.toLowerCase().includes(q));
    }
    return list;
  }, [allItems, statusFilter, eligibilityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Aggregate stats
  const stats = useMemo(() => ({
    total:       allItems.length,
    approved:    allItems.filter((i) => i.approval_status === "approved").length,
    pending:     allItems.filter((i) => i.approval_status === "pending").length,
    eligible:    allItems.filter((i) => i.eligible_for_allocation).length,
    noSurvey:    allItems.filter((i) => !i.has_current_month_survey).length,
  }), [allItems]);

  return (
    <DashboardLayout
      title="Kelayakan Penerima"
      subtitle="Monitor kelayakan dan status alokasi Dompet Nutrisi untuk penerima manfaat."
    >
      <div className="space-y-5">

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Penerima", val: stats.total,    icon: Users,        bg: "bg-slate-50",   ring: "ring-slate-100",   color: "text-slate-700" },
            { label: "Disetujui",      val: stats.approved, icon: Shield,       bg: "bg-emerald-50", ring: "ring-emerald-100", color: "text-emerald-700" },
            { label: "Menunggu Peninjauan", val: stats.pending,  icon: AlertTriangle, bg: "bg-amber-50",  ring: "ring-amber-100",   color: "text-amber-700" },
            { label: "Memenuhi Syarat Bulan Ini", val: stats.eligible, icon: CheckCircle2, bg: "bg-blue-50", ring: "ring-blue-100",  color: "text-blue-700" },
            { label: "Belum Survey",   val: stats.noSurvey, icon: Activity,     bg: "bg-rose-50",    ring: "ring-rose-100",    color: "text-rose-700" },
          ].map((stat) => (
            <div key={stat.label} className={`flex items-center gap-3 rounded-2xl ${stat.bg} ring-1 ${stat.ring} p-3.5`}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-xl font-extrabold leading-none ${stat.color}`}>{stat.val}</div>
                <div className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-tight">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5">
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            Penerima <strong>layak</strong> adalah akun berstatus <em>disetujui</em>, sudah mengisi survey FIES bulan ini, dan saldo Dompet Nutrisi masih tersedia untuk realokasi.
          </p>
        </div>

        {/* Filter & Search Panel */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Status + Eligibility filter */}
          <div className="flex items-center gap-1 p-3 border-b border-border/60 flex-wrap">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Persetujuan:</span>
            {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((f) => {
              const active = statusFilter === f;
              const counts: Record<string, number> = {
                all: allItems.length,
                pending: stats.pending,
                approved: stats.approved,
                rejected: allItems.filter((i) => i.approval_status === "rejected").length,
              };
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    active ? "bg-slate-900 text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {f === "all" ? "Semua" : approvalConfig[f as ApprovalStatus].label}
                  <span className={`rounded px-1 text-[10px] font-bold ${active ? "bg-white/20" : "bg-secondary"}`}>
                    {counts[f] ?? 0}
                  </span>
                </button>
              );
            })}

            <div className="w-px h-4 bg-border mx-1" />

            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Kelayakan:</span>
            {([
              { val: "all" as EligibilityFilter,         label: "Semua" },
              { val: "eligible" as EligibilityFilter,     label: "Layak" },
              { val: "not_eligible" as EligibilityFilter, label: "Tidak Layak" },
            ]).map((f) => {
              const active = eligibilityFilter === f.val;
              return (
                <button
                  key={f.val}
                  onClick={() => setEligibilityFilter(f.val)}
                  className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    active ? "bg-emerald-700 text-white shadow-sm" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Search row */}
          <div className="flex items-center gap-3 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama penerima..."
                className="pl-9 h-9 text-sm rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-slate-300"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-3 text-xs gap-1.5 flex-shrink-0"
              onClick={() => void loadEligibility()}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Muat ulang
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{pageItems.length}</span> dari <span className="font-semibold text-foreground">{filtered.length}</span> penerima
          </p>
          <p className="text-xs text-muted-foreground">Halaman {page} / {totalPages}</p>
        </div>

        {/* Table */}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-sm">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-rose-700 mb-4">{error}</p>
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 rounded-xl" onClick={() => void loadEligibility()}>
              Coba Lagi
            </Button>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/40 animate-pulse">
                <div className="h-8 w-8 rounded-xl bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 bg-secondary rounded-md" />
                  <div className="h-2.5 w-24 bg-secondary rounded-md" />
                </div>
                <div className="h-6 w-16 bg-secondary rounded-lg hidden md:block" />
                <div className="h-6 w-20 bg-secondary rounded-lg" />
                <div className="h-6 w-20 bg-secondary rounded-lg" />
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground mb-1">Tidak ada penerima</p>
            <p className="text-xs text-muted-foreground">Coba ubah filter atau kata pencarian.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <th className="py-3 pl-5 pr-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Penerima</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Skor FIES</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Kelayakan</th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Keluarga & Saldo</th>
                  <th className="py-3 pl-3 pr-5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Survey Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <BeneficiaryRow key={item.user_id} item={item} />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/50 bg-slate-50/40 px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} penerima · halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button key={pageNum} size="sm" variant={pageNum === page ? "default" : "outline"} className="h-7 w-7 p-0 rounded-lg text-xs" onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-lg" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}