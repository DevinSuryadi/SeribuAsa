import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, HeartPulse, Users } from "lucide-react";
import { getMyFacility, listFamilies, type Facility, type Family } from "@/services/facility-families";
import FamilyFoodStatus from "./facility/FamilyFoodStatus";

const FAMILY_PREVIEW_LIMIT = 4;

export default function HealthFacilityDashboard() {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
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

  return (
    <DashboardLayout title="Dashboard Fasilitas Kesehatan" subtitle="Ringkasan fasilitas kesehatan dan keluarga yang terdaftar.">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-700 to-emerald-900 px-6 py-7 text-white shadow-lg sm:px-8">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><HeartPulse className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-white/75">Fasilitas kesehatan</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{facility?.name || "Kelola penerima manfaat"}</h2>
              <p className="mt-2 max-w-xl text-sm text-white/85">Pilih menu Keluarga untuk mendaftar atau mengelola keluarga, lalu buka ringkasan, survei, dan pengukuran tiap keluarga.</p>
            </div>
            <Button asChild className="shrink-0 rounded-xl bg-white text-primary hover:bg-white/90"><Link to="/dashboard/health-facility/families">Lihat Keluarga <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>

        {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Keluarga Terdaftar</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users className="h-6 w-6" /></span>
            <div><strong className="text-2xl">{loading ? "..." : error ? "—" : families.length}</strong><p className="text-sm text-muted-foreground">Keluarga yang dikelola fasilitas kesehatan ini</p></div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Keluarga Terbaru</CardTitle><p className="text-sm text-muted-foreground">Pilih keluarga untuk melihat ringkasan dan tindak lanjut.</p></CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="py-6 text-center text-sm text-muted-foreground">Memuat keluarga...</p>}
            {!loading && !error && families.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Belum ada keluarga terdaftar. Buka menu Keluarga untuk mendaftarkan keluarga pertama.</p>}
            {!loading && !error && families.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {families.slice(0, FAMILY_PREVIEW_LIMIT).map((family) => (
                  <Card key={family.id} className="h-full rounded-2xl border-border/70 bg-background shadow-sm transition-colors hover:border-primary/40">
                    <Link to={`/dashboard/health-facility/families/${family.id}`} className="group flex h-full flex-col gap-3 rounded-2xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">{family.head_name.charAt(0).toUpperCase()}</span>
                      <span className="min-w-0"><strong className="block truncate text-lg group-hover:text-primary">{family.head_name}</strong><span className="mt-1 block text-sm text-muted-foreground">KK {family.kk_number}</span></span>
                      <FamilyFoodStatus family={family} />
                      <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm font-semibold text-primary"><span>Buka ringkasan</span><ArrowRight className="h-4 w-4 shrink-0" /></span>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
            {!loading && !error && families.length > FAMILY_PREVIEW_LIMIT && (
              <Button asChild variant="outline" className="w-full rounded-xl"><Link to="/dashboard/health-facility/families">Lihat semua keluarga <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
