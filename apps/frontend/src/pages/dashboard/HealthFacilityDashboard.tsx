import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Baby, ClipboardList, HeartPulse, Plus, Search, Users } from "lucide-react";
import { getMyFacility, listFamilies, type Facility, type Family } from "@/services/facility-families";
import FamilyForm from "./facility/FamilyForm";

export default function HealthFacilityDashboard() {
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getMyFacility(), listFamilies()])
      .then(([facilityData, familyData]) => {
        if (active) { setFacility(facilityData); setFamilies(familyData); }
      })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Gagal memuat data fasilitas"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? families.filter((family) =>
      family.head_name.toLowerCase().includes(term) || family.kk_number.includes(term)
    ) : families;
  }, [families, search]);

  return (
    <DashboardLayout title="Dashboard Fasilitas Kesehatan" subtitle="Kelola keluarga dan pemantauan penerima manfaat.">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-700 to-emerald-900 px-6 py-7 text-white shadow-lg sm:px-8">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><HeartPulse className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-white/75">Fasilitas kesehatan</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{facility?.name || "Kelola penerima manfaat"}</h2>
              <p className="mt-2 max-w-xl text-sm text-white/85">Daftarkan keluarga, catat pertumbuhan anak, dan isi survei ketahanan pangan dari data keluarga yang dipilih.</p>
            </div>
            <Button onClick={() => setFormOpen(true)} className="shrink-0 rounded-xl bg-white text-primary hover:bg-white/90">
              <Plus className="mr-2 h-4 w-4" /> Daftarkan Keluarga
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Keluarga terdaftar", value: families.length, icon: Users },
            { label: "Pemantauan gizi", value: "Per keluarga", icon: Baby },
            { label: "Survei FIES", value: "Per keluarga", icon: ClipboardList },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-2xl border-border/70 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold text-foreground">{value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-lg">Daftar Keluarga</CardTitle><p className="mt-1 text-sm text-muted-foreground">Pilih keluarga untuk melihat detail dan mengisi asesmen.</p></div>
            <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Cari nama atau nomor KK" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat keluarga...</p>}
            {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-5 py-10 text-center">
                <Users className="mx-auto h-8 w-8 text-primary/50" />
                <p className="mt-3 font-semibold">{search ? "Keluarga tidak ditemukan" : "Belum ada keluarga terdaftar"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{search ? "Coba kata kunci lain." : "Daftarkan keluarga pertama untuk memulai pemantauan."}</p>
              </div>
            )}
            {filtered.map((family) => (
              <Link key={family.id} to={`/dashboard/health-facility/families/${family.id}`}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">{family.head_name.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{family.head_name}</span><span className="block text-xs text-muted-foreground">KK {family.kk_number}</span></span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      <FamilyForm open={formOpen} onOpenChange={setFormOpen} onSaved={(family) => {
        setFamilies((current) => [family, ...current]);
        navigate(`/dashboard/health-facility/families/${family.id}`);
      }} />
    </DashboardLayout>
  );
}
