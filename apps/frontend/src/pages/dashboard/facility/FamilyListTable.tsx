import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { getFiesStatus } from "@/lib/status-config";
import { listFamilies, type Family } from "@/services/facility-families";
import { listFacilityOrders, type FacilityOrder } from "@/services/facility-orders";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import FamilyForm from "./FamilyForm";

const pageSize = 10;

const previewFamilies: Family[] = [
  {
    id: "preview-family-somat",
    health_facility_id: "preview-facility",
    kk_number: "1234567891234567",
    head_name: "Bapak Somat",
    address: "Jl. Kenanga No. 12",
    phone: "081234567890",
    family_size: 4,
    created_at: "2026-08-12T03:00:00.000Z",
    latest_fies: {
      score: 5,
      classification: "moderate",
      survey_date: "2026-10-08T08:00:00.000Z",
    },
  },
];

type Vulnerability = "all" | "food_secure" | "moderate" | "severe" | "unassessed";
type SortMode = "score_desc" | "score_asc" | "name_asc";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function FamilyListTable() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [search, setSearch] = useState("");
  const [vulnerability, setVulnerability] = useState<Vulnerability>("all");
  const [sort, setSort] = useState<SortMode>("score_desc");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Family | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);
  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let active = true;
    const forceRefresh = refreshKey > 0;
    Promise.all([listFamilies(forceRefresh), listFacilityOrders(undefined, forceRefresh)])
      .then(([familyRows, orderRows]) => {
        if (active) {
          setFamilies(familyRows);
          setOrders(orderRows);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat daftar keluarga");
        }
      })
      .finally(() => {
        if (active) setLoadedKey(refreshKey);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const showingPreview = import.meta.env.DEV && !loading && !error && families.length === 0;
  const rows = showingPreview ? previewFamilies : families;

  const activeAssistance = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => {
      if (order.status !== "cancelled" && !order.distribution) {
        counts.set(order.family_id, (counts.get(order.family_id) || 0) + 1);
      }
    });
    if (showingPreview) counts.set("preview-family-somat", 2);
    return counts;
  }, [orders, showingPreview]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((family) => {
        const classification = family.latest_fies?.classification || "unassessed";
        const matchesTerm =
          !term ||
          family.head_name.toLowerCase().includes(term) ||
          family.kk_number.includes(term);
        const matchesVulnerability =
          vulnerability === "all" || classification === vulnerability;
        return matchesTerm && matchesVulnerability;
      })
      .sort((a, b) => {
        if (sort === "name_asc") return a.head_name.localeCompare(b.head_name, "id");
        const aScore = a.latest_fies?.score ?? -1;
        const bScore = b.latest_fies?.score ?? -1;
        return sort === "score_asc" ? aScore - bScore : bScore - aScore;
      });
  }, [rows, search, sort, vulnerability]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openRegistration = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const renderDetailButton = (family: Family) =>
    showingPreview ? (
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg"
        onClick={() => toast.info("Detail tersedia untuk data keluarga asli.")}
      >
        Detail
      </Button>
    ) : (
      <Button asChild variant="outline" size="sm" className="rounded-lg">
        <Link to={`/dashboard/health-facility/families/${family.id}`}>Detail</Link>
      </Button>
    );

  const saveFamily = (saved: Family) => {
    setFamilies((current) =>
      current.some((family) => family.id === saved.id)
        ? current.map((family) =>
            family.id === saved.id
              ? { ...saved, latest_fies: family.latest_fies }
              : family,
          )
        : [saved, ...current],
    );
  };

  return (
    <DashboardLayout
      title={
        <span className="flex flex-wrap items-center gap-2">
          Keluarga
          {showingPreview && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-800">
              Data contoh
            </Badge>
          )}
        </span>
      }
      subtitle="Daftar keluarga penerima manfaat dan tingkat kerentanannya berdasarkan survei FIES."
      actions={
        <Button className="rounded-xl" onClick={openRegistration}>
          <Plus className="mr-2 h-4 w-4" />
          Daftarkan keluarga
        </Button>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-2 sm:grid-cols-[minmax(240px,1fr)_190px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 rounded-xl border-slate-200 pl-9"
                placeholder="Cari nama atau nomor KK"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
              value={vulnerability}
              onChange={(event) => {
                setVulnerability(event.target.value as Vulnerability);
                setPage(1);
              }}
            >
              <option value="all">Semua kerentanan</option>
              <option value="severe">Rawan tinggi</option>
              <option value="moderate">Rawan sedang</option>
              <option value="food_secure">Rawan rendah</option>
              <option value="unassessed">Belum disurvei</option>
            </select>
          </div>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortMode);
              setPage(1);
            }}
          >
            <option value="score_desc">Urutkan: skor FIES tertinggi</option>
            <option value="score_asc">Urutkan: skor FIES terendah</option>
            <option value="name_asc">Urutkan: nama A–Z</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 rounded-xl" />)}
          </div>
        ) : error ? (
          <ErrorState
            className="m-4"
            title="Gagal memuat daftar keluarga"
            message={error}
            onRetry={() => setRefreshKey((key) => key + 1)}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" />}
            title="Belum ada keluarga terdaftar"
            description="Daftarkan keluarga penerima manfaat untuk mulai mencatat survei FIES dan bantuan."
            action={{ label: "Daftarkan keluarga", onClick: openRegistration }}
          />
        ) : visibleRows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-semibold text-slate-900">Keluarga tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Coba ubah pencarian atau filter kerentanan.</p>
          </div>
        ) : (
          <>
          <ul className="divide-y divide-slate-100 lg:hidden">
            {visibleRows.map((family) => {
              const score = family.latest_fies?.score;
              const meta = getFiesStatus(family.latest_fies?.classification);
              return (
                <li key={family.id} className="space-y-3 px-4 py-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1e8] text-xs font-bold text-slate-600">
                        {initials(family.head_name)}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-slate-900">{family.head_name}</strong>
                        <span className="text-xs text-slate-500">{family.kk_number}</span>
                      </span>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${meta.className}`}>
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                      {meta.shortLabel}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-slate-500">Skor FIES</dt>
                      <dd className="font-semibold text-slate-900">{typeof score === "number" ? `${score}/8` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Anggota</dt>
                      <dd className="font-semibold text-slate-900">{family.family_size ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Bantuan aktif</dt>
                      <dd className="font-semibold text-slate-900">{activeAssistance.get(family.id) || 0} pesanan</dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Survei: {family.latest_fies ? formatDate(family.latest_fies.survey_date) : "Belum ada"}
                    </span>
                    {renderDetailButton(family)}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="px-5 py-3">Kepala keluarga</th>
                  <th className="px-4 py-3 text-center">Anggota</th>
                  <th className="px-4 py-3">Skor FIES</th>
                  <th className="px-4 py-3">Kerentanan</th>
                  <th className="px-4 py-3">Survei terakhir</th>
                  <th className="px-4 py-3">Bantuan aktif</th>
                  <th className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((family) => {
                  const score = family.latest_fies?.score;
                  const classification = family.latest_fies?.classification || "unassessed";
                  const meta = getFiesStatus(classification);
                  return (
                    <tr key={family.id} className="border-b border-slate-100 text-sm last:border-0 hover:bg-emerald-50/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef1e8] text-xs font-bold text-slate-600">
                            {initials(family.head_name)}
                          </span>
                          <span>
                            <strong className="block text-slate-900">{family.head_name}</strong>
                            <span className="text-xs text-slate-500">{family.kk_number}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-slate-700">{family.family_size ?? "—"}</td>
                      <td className="px-4 py-4">
                        {typeof score === "number" ? (
                          <div className="flex items-center gap-3">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                              <span
                                className={`block h-full rounded-full ${score >= 6 ? "bg-red-500" : score >= 4 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${(score / 8) * 100}%` }}
                              />
                            </span>
                            <strong className="whitespace-nowrap text-slate-900">{score}/8</strong>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={meta.className}>
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                          {meta.shortLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {family.latest_fies ? formatDate(family.latest_fies.survey_date) : "Belum ada"}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {activeAssistance.get(family.id) || 0} pesanan
                      </td>
                      <td className="px-4 py-4 text-right">{renderDetailButton(family)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Menampilkan {visibleRows.length} dari {filtered.length} keluarga</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg bg-white text-xs"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg bg-white text-xs"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </footer>
      </section>

      <p className="px-1 text-xs leading-5 text-slate-500">
        Skor FIES 0–8 diukur lewat Food Insecurity Experience Scale. Skor lebih tinggi berarti lebih rawan dan menjadi prioritas voucher.
      </p>

      <FamilyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        family={editing}
        onSaved={saveFamily}
      />
    </DashboardLayout>
  );
}
