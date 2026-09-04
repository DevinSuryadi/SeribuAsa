import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { staticSWRConfig } from "@/lib/swr-config";
import clsx from "clsx";
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
import { formatDateTime, shortId } from "./adminUtils";

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

const roleTabs = [
  {
    value: "all" as UserRoleFilter,
    label: "Semua",
    icon: Users,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    value: "beneficiary" as UserRoleFilter,
    label: "Penerima",
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    value: "donor" as UserRoleFilter,
    label: "Donatur",
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  {
    value: "vendor" as UserRoleFilter,
    label: "Vendor",
    icon: Store,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  {
    value: "user" as UserRoleFilter,
    label: "User Biasa",
    icon: User,
    color: "text-slate-500",
    bg: "bg-slate-100",
  },
] as const;

const statusTabs = [
  { value: "all" as ApprovalFilter, label: "Semua", dot: "bg-slate-400" },
  { value: "pending" as ApprovalFilter, label: "Menunggu", dot: "bg-amber-400" },
  { value: "approved" as ApprovalFilter, label: "Disetujui", dot: "bg-emerald-500" },
  { value: "rejected" as ApprovalFilter, label: "Ditolak", dot: "bg-rose-500" },
] as const;

const roleLabelMap: Record<
  string,
  { label: string; icon: typeof User; color: string; bg: string }
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

interface UserRowProps {
  item: AdminUserItem;
  mutatingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function UserRow({ item, mutatingId, onApprove, onReject }: UserRowProps) {
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
            className={clsx(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
              roleInfo.bg
            )}
          >
            <RoleIcon className={clsx("h-4 w-4", roleInfo.color)} />
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
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
            roleInfo.bg,
            roleInfo.color
          )}
        >
          <RoleIcon className="h-3 w-3" />
          {roleInfo.label}
        </span>
      </td>

      {/* Status */}
      <td className="py-3.5 px-3">
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1",
            statusInfo.cls
          )}
        >
          <span className={clsx("h-1.5 w-1.5 rounded-full flex-shrink-0", statusInfo.dot)} />
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

function AdminUsersPageContent() {
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ApprovalFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, debouncedSearchTerm]);

  // Build query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (debouncedSearchTerm.trim()) params.set("search", debouncedSearchTerm.trim());
    return params.toString();
  }, [roleFilter, statusFilter, debouncedSearchTerm, page]);

  // Fetch users with SWR
  const { data, error, isLoading, mutate } = useSWR<AdminUserListResponse>(
    `/admin/users?${queryString}`,
    staticSWRConfig
  );

  // Fetch counts
  const { data: countsData, mutate: mutateCounts } = useSWR<{
    roles: CountMap;
    statuses: CountMap;
  }>(
    "admin-users-counts",
    async () => {
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
      return {
        roles: Object.fromEntries(roleResults),
        statuses: Object.fromEntries(statusResults),
      };
    },
    staticSWRConfig
  );

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;
  const counts = countsData ?? { roles: {}, statuses: {} };

  const updateApproval = async (userId: string, approvalStatus: ApprovalStatus) => {
    try {
      setMutatingId(userId);
      await apiFetch(`/admin/users/${userId}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approval_status: approvalStatus }),
      });
      toast.success(`Akun berhasil di-${approvalStatus === "approved" ? "approve" : "reject"}`);
      await Promise.all([mutate(), mutateCounts()]);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memperbarui status");
    } finally {
      setMutatingId(null);
    }
  };

  const handleApprove = useCallback((userId: string) => {
    updateApproval(userId, "approved");
  }, []);

  const handleReject = useCallback((userId: string) => {
    updateApproval(userId, "rejected");
  }, []);

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
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                    active
                      ? clsx(tab.bg, tab.color, "shadow-sm ring-1 ring-black/5")
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span
                    className={clsx(
                      "ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/60" : "bg-secondary"
                    )}
                  >
                    {counts.roles[tab.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 p-3 border-b border-border/60 flex-wrap">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "bg-slate-100 text-slate-800 shadow-sm ring-1 ring-black/5"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span className={clsx("h-1.5 w-1.5 rounded-full", tab.dot)} />
                  {tab.label}
                  <span
                    className={clsx(
                      "ml-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/60" : "bg-secondary"
                    )}
                  >
                    {counts.statuses[tab.value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 p-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, telepon, atau alamat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-sm bg-white"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutate()}
              disabled={isLoading}
              className="h-9 px-3 text-xs"
            >
              <RefreshCw className={clsx("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-sm font-semibold text-red-800">Gagal memuat data</h3>
                <p className="mb-3 text-sm text-red-600">{error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mutate()}
                  className="h-8 border-red-300 bg-white text-xs text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Coba Lagi
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="py-3 pl-5 pr-4 text-left text-xs font-semibold text-muted-foreground">
                    Pengguna
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-muted-foreground">
                    Role
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">
                    Kontak
                  </th>
                  <th className="py-3 px-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                    Dibuat
                  </th>
                  <th className="py-3 pl-3 pr-5 text-right text-xs font-semibold text-muted-foreground">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3.5 pl-5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse" />
                          <div className="space-y-1.5">
                            <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
                            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-6 w-20 rounded bg-slate-100 animate-pulse" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-6 w-16 rounded bg-slate-100 animate-pulse" />
                      </td>
                      <td className="py-3.5 px-3 hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                          <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 hidden lg:table-cell">
                        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                      </td>
                      <td className="py-3.5 pl-3 pr-5">
                        <div className="flex justify-end gap-1.5">
                          <div className="h-7 w-20 rounded bg-slate-100 animate-pulse" />
                          <div className="h-7 w-20 rounded bg-slate-100 animate-pulse" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-slate-300" />
                        <p className="text-sm text-muted-foreground">
                          Tidak ada pengguna ditemukan
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <UserRow
                      key={item.user_id}
                      item={item}
                      mutatingId={mutatingId}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Menampilkan <span className="font-semibold">{items.length}</span> dari{" "}
              <span className="font-semibold">{total}</span> pengguna
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                Halaman {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <ErrorBoundary>
      <AdminUsersPageContent />
    </ErrorBoundary>
  );
}
