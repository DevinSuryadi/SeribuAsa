import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/services/api";
import { formatDateTime, shortId } from "./adminUtils";
import { toast } from "sonner";
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Heart,
  Store,
  Shield,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

type UserRoleFilter = "all" | "user" | "beneficiary" | "donor" | "vendor";
type ApprovalFilter = "all" | "pending" | "approved" | "rejected";
type ApprovalStatus = "pending" | "approved" | "rejected";

type AdminUserItem = {
  user_id: string;
  full_name: string;
  role: "user" | "beneficiary" | "donor" | "vendor";
  approval_status: ApprovalStatus;
  phone?: string | null;
  address?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type AdminUserListResponse = {
  items: AdminUserItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type CountMap = Record<string, number>;

// ── Config ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const roleTabs: Array<{
  value: UserRoleFilter;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}> = [
  { value: "all", label: "Semua", icon: Users, color: "text-slate-600", bg: "bg-slate-100" },
  {
    value: "beneficiary",
    label: "Penerima",
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  { value: "donor", label: "Donatur", icon: Heart, color: "text-rose-600", bg: "bg-rose-100" },
  { value: "vendor", label: "Vendor", icon: Store, color: "text-indigo-600", bg: "bg-indigo-100" },
];

const statusTabs: Array<{ value: ApprovalFilter; label: string; dot: string }> = [
  { value: "all", label: "Semua", dot: "bg-slate-400" },
  { value: "pending", label: "Menunggu", dot: "bg-amber-400" },
  { value: "approved", label: "Disetujui", dot: "bg-emerald-500" },
  { value: "rejected", label: "Ditolak", dot: "bg-rose-500" },
];

const roleLabelMap: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  user: { label: "User", icon: User, color: "text-slate-600", bg: "bg-slate-100" },
  beneficiary: { label: "Penerima", icon: Shield, color: "text-emerald-700", bg: "bg-emerald-100" },
  donor: { label: "Donatur", icon: Heart, color: "text-rose-700", bg: "bg-rose-100" },
  vendor: { label: "Vendor", icon: Store, color: "text-indigo-700", bg: "bg-indigo-100" },
};

const statusBadge: Record<string, { label: string; cls: string; dot: string }> = {
  pending: {
    label: "Menunggu",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Disetujui",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
  },
};

// ── Row Component ────────────────────────────────────────────────────────────

function UserRow({
  item,
  mutatingId,
  onApprove,
  onReject,
}: {
  item: AdminUserItem;
  mutatingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const roleInfo = roleLabelMap[item.role] ?? roleLabelMap.user;
  const RoleIcon = roleInfo.icon;
  const statusInfo = statusBadge[item.approval_status] ?? statusBadge.pending;
  const isMutating = mutatingId === item.user_id;
  const canApprove = item.role === "beneficiary" || item.role === "vendor";

  return (
    <tr className="group border-b border-border/50 hover:bg-slate-50/60 transition-colors">
      {/* User Info */}
      <td className="py-3.5 pl-5 pr-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${roleInfo.bg}`}
          >
            <RoleIcon className={`h-4 w-4 ${roleInfo.color}`} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate max-w-[180px]">
              {item.full_name}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground/70 mt-0.5">
              {shortId(item.user_id)}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="py-3.5 px-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${roleInfo.bg} ${roleInfo.color}`}
        >
          <RoleIcon className="h-3 w-3" />
          {roleInfo.label}
        </span>
      </td>

      {/* Status */}
      <td className="py-3.5 px-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${statusInfo.cls}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
          {statusInfo.label}
        </span>
      </td>

      {/* Contact */}
      <td className="py-3.5 px-3 hidden md:table-cell">
        <div className="space-y-0.5">
          {item.phone ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[130px]">{item.phone}</span>
            </div>
          ) : null}
          {item.address ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[130px]">{item.address}</span>
            </div>
          ) : null}
          {!item.phone && !item.address && (
            <span className="text-xs text-muted-foreground/50">–</span>
          )}
        </div>
      </td>

      {/* Created at */}
      <td className="py-3.5 px-3 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{formatDateTime(item.created_at)}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-5 text-right">
        {canApprove ? (
          <div className="flex items-center justify-end gap-1.5">
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-40"
                  onClick={() => onApprove(item.user_id)}
                  disabled={item.approval_status === "approved"}
                  title="Setujui akun ini"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Setuju
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                  onClick={() => onReject(item.user_id)}
                  disabled={item.approval_status === "rejected"}
                  title="Tolak akun ini"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Tolak
                </Button>
              </>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/50 italic">–</span>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [counts, setCounts] = useState<{ roles: CountMap; statuses: CountMap }>({
    roles: {},
    statuses: {},
  });
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ApprovalFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    return params.toString();
  }, [roleFilter, statusFilter, searchTerm, page]);

  const loadCounts = useCallback(async () => {
    try {
      const roleKeys: UserRoleFilter[] = ["all", "user", "beneficiary", "donor", "vendor"];
      const statusKeys: ApprovalFilter[] = ["all", "pending", "approved", "rejected"];
      const [roleResults, statusResults] = await Promise.all([
        Promise.all(
          roleKeys.map(async (role) => {
            const p = new URLSearchParams({ page: "1", page_size: "1" });
            if (role !== "all") p.set("role", role);
            const d = (await apiFetch(`/admin/users?${p}`)) as AdminUserListResponse;
            return [role, d.total ?? 0] as const;
          })
        ),
        Promise.all(
          statusKeys.map(async (status) => {
            const p = new URLSearchParams({ page: "1", page_size: "1" });
            if (status !== "all") p.set("status", status);
            const d = (await apiFetch(`/admin/users?${p}`)) as AdminUserListResponse;
            return [status, d.total ?? 0] as const;
          })
        ),
      ]);
      setCounts({
        roles: Object.fromEntries(roleResults),
        statuses: Object.fromEntries(statusResults),
      });
    } catch {
      setCounts({ roles: {}, statuses: {} });
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await apiFetch(`/admin/users?${queryString}`)) as AdminUserListResponse;
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (err: any) {
      setError(err?.message ?? "Gagal memuat data pengguna");
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void Promise.all([loadUsers(), loadCounts()]);
  }, [loadUsers, loadCounts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, searchTerm]);

  const updateApproval = async (userId: string, approvalStatus: ApprovalStatus) => {
    try {
      setMutatingId(userId);
      await apiFetch(`/admin/users/${userId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approval_status: approvalStatus }),
      });
      toast.success(`Akun berhasil di-${approvalStatus === "approved" ? "approve" : "reject"}`);
      await Promise.all([loadUsers(), loadCounts()]);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memperbarui status");
    } finally {
      setMutatingId(null);
    }
  };

  const pendingCount = counts.statuses["pending"] ?? 0;

  return (
    <DashboardLayout
      title="Kelola Pengguna"
      subtitle="Manajemen akun, role, dan persetujuan pengguna platform."
    >
      <div className="space-y-5">
        {/* Pending Alert Banner */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-amber-800 flex-1">
              Ada <span className="font-extrabold">{pendingCount}</span> akun menunggu persetujuan —
              penerima & vendor baru.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 h-8 text-xs rounded-xl"
              onClick={() => {
                setStatusFilter("pending");
                setRoleFilter("all");
              }}
            >
              Lihat Semua
            </Button>
          </div>
        )}

        {/* Filter & Search Panel */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Role tabs */}
          <div className="flex items-center gap-1 p-3 border-b border-border/60 flex-wrap">
            {roleTabs.map((tab) => {
              const TabIcon = tab.icon;
              const active = roleFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setRoleFilter(tab.value)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    active
                      ? `${tab.bg} ${tab.color} shadow-sm ring-1 ring-black/5`
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span
                    className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/60" : "bg-secondary"}`}
                  >
                    {counts.roles[tab.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status + Search row */}
          <div className="flex items-center gap-3 p-3 flex-wrap">
            {/* Status pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {statusTabs.map((tab) => {
                const active = statusFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${tab.dot}`} />
                    {tab.label}
                    {counts.statuses[tab.value] !== undefined && (
                      <span
                        className={`rounded px-1 text-[10px] font-bold ${active ? "bg-white/20" : "bg-secondary"}`}
                      >
                        {counts.statuses[tab.value]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                  placeholder="Cari nama atau telepon..."
                  className="pl-9 h-9 text-sm rounded-xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-slate-300"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl px-3 text-xs gap-1.5 flex-shrink-0"
                onClick={() => void Promise.all([loadUsers(), loadCounts()])}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Muat Ulang
              </Button>
            </div>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{items.length}</span> dari{" "}
            <span className="font-semibold text-foreground">{total}</span> pengguna
          </p>
          <p className="text-xs text-muted-foreground">
            Halaman {page} / {totalPages}
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 border-b border-border/40 animate-pulse"
              >
                <div className="h-9 w-9 rounded-xl bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-36 bg-secondary rounded-md" />
                  <div className="h-2.5 w-20 bg-secondary rounded-md" />
                </div>
                <div className="h-6 w-20 bg-secondary rounded-lg" />
                <div className="h-6 w-20 bg-secondary rounded-lg" />
                <div className="h-7 w-28 bg-secondary rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-sm">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-rose-700 mb-1">Gagal memuat pengguna</p>
            <p className="text-xs text-rose-500 mb-4">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-300 text-rose-700 rounded-xl"
              onClick={() => void loadUsers()}
            >
              Coba Lagi
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Tidak ada pengguna</p>
            <p className="text-xs text-muted-foreground">Coba ubah filter atau kata pencarian.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <th className="py-3 pl-5 pr-4 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Pengguna
                  </th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Kontak
                  </th>
                  <th className="py-3 px-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Bergabung
                  </th>
                  <th className="py-3 pl-3 pr-5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <UserRow
                    key={item.user_id}
                    item={item}
                    mutatingId={mutatingId}
                    onApprove={(id) => void updateApproval(id, "approved")}
                    onReject={(id) => void updateApproval(id, "rejected")}
                  />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/50 bg-slate-50/40 px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  {total} pengguna · halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1 || loading}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={pageNum === page ? "default" : "outline"}
                        className="h-7 w-7 p-0 rounded-lg text-xs"
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages || loading}
                  >
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
