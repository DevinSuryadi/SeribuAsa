import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Pencil, Plus, Search, Users } from "lucide-react";
import { listFamilies, type Family } from "@/services/facility-families";
import FamilyForm from "./FamilyForm";
import FamilyFoodStatus from "./FamilyFoodStatus";

export default function FamilyList() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Family | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listFamilies()
      .then((result) => { if (active) setFamilies(result); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Gagal memuat keluarga"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? families.filter((family) =>
      family.head_name.toLowerCase().includes(term) || family.kk_number.includes(term)
    ) : families;
  }, [families, search]);

  const openRegistration = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (family: Family) => {
    setEditing(family);
    setFormOpen(true);
  };

  const saveFamily = (saved: Family) => {
    setFamilies((current) => current.some((family) => family.id === saved.id)
      ? current.map((family) => family.id === saved.id ? { ...saved, latest_fies: family.latest_fies } : family)
      : [saved, ...current]);
  };

  return (
    <DashboardLayout title="Keluarga" subtitle="Daftarkan, pilih, dan perbarui keluarga yang tercatat di fasilitas kesehatan Anda.">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-lg">Keluarga Terdaftar</CardTitle><p className="mt-1 text-sm text-muted-foreground">Pilih kartu keluarga untuk melihat ringkasan, survei FIES, dan pengukuran anak.</p></div>
            <Button onClick={openRegistration} className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Daftarkan Keluarga</Button>
          </CardHeader>
          <CardContent>
            <div className="relative mb-5 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Cari nama atau nomor KK" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            {loading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat keluarga...</p>}
            {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-5 py-10 text-center">
                <Users className="mx-auto h-8 w-8 text-primary/50" />
                <p className="mt-3 font-semibold">{search ? "Keluarga tidak ditemukan" : "Belum ada keluarga terdaftar"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{search ? "Coba kata kunci lain." : "Daftarkan keluarga pertama untuk memulai pemantauan."}</p>
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((family) => (
                  <Card key={family.id} className="flex h-full flex-col rounded-2xl border-border/70 bg-background shadow-sm transition-colors hover:border-primary/40">
                    <Link to={`/dashboard/health-facility/families/${family.id}`} className="group flex flex-1 flex-col gap-3 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">{family.head_name.charAt(0).toUpperCase()}</span>
                      <span className="min-w-0"><strong className="block truncate text-lg group-hover:text-primary">{family.head_name}</strong><span className="mt-1 block text-sm text-muted-foreground">KK {family.kk_number}</span></span>
                      <FamilyFoodStatus family={family} />
                      <span className="mt-auto text-sm text-muted-foreground">{family.family_size ? `${family.family_size} anggota keluarga` : "Jumlah anggota belum diisi"}</span>
                    </Link>
                    <div className="flex items-center justify-between gap-2 border-t border-border/70 px-5 py-3">
                      <Button variant="outline" size="sm" onClick={() => openEdit(family)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
                      <Link to={`/dashboard/health-facility/families/${family.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Pilih keluarga <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <FamilyForm open={formOpen} onOpenChange={setFormOpen} family={editing} onSaved={saveFamily} />
    </DashboardLayout>
  );
}
