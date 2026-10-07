import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Baby, ClipboardList, MapPin, Pencil, Phone, Users } from "lucide-react";
import { getFamily, getFamilyChildren, getFamilyFiesHistory, type Family } from "@/services/facility-families";
import { formatDate } from "@/lib/format";
import FamilyForm from "./FamilyForm";

type Child = { id: string; full_name: string; date_of_birth: string; gender: string };
type Survey = { id: string; score: number; classification: string; survey_date: string };

const fiesLabel: Record<string, string> = {
  food_secure: "Ketahanan pangan baik",
  moderate: "Kerawanan pangan sedang",
  severe: "Kerawanan pangan berat",
};

export default function FamilyDetail() {
  const { familyId } = useParams<{ familyId: string }>();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!familyId) return;
    let active = true;
    Promise.all([getFamily(familyId), getFamilyChildren(familyId), getFamilyFiesHistory(familyId)])
      .then(([familyData, childData, surveyData]) => {
        if (active) { setFamily(familyData); setChildren(childData); setSurveys(surveyData.data.surveys); }
      })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Gagal memuat keluarga"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [familyId]);

  const base = `/dashboard/health-facility/families/${familyId}`;

  return (
    <DashboardLayout title="Detail Keluarga" subtitle="Data penerima manfaat dan asesmen keluarga.">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <Link to="/dashboard/health-facility" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar keluarga</Link>
        {loading && <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Memuat data keluarga...</p>}
        {error && <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-destructive">{error}</p>}
        {family && (
          <>
            <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
              <div className="h-2 bg-gradient-to-r from-primary to-emerald-700" />
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Keluarga Penerima Manfaat</p><CardTitle className="mt-2 text-2xl">{family.head_name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Nomor KK {family.kk_number}</p></div>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Edit Data Keluarga</Button>
              </CardHeader>
              <CardContent className="grid gap-4 border-t border-border/70 pt-5 text-sm sm:grid-cols-3">
                <div className="flex gap-3"><Users className="h-5 w-5 shrink-0 text-primary" /><span><span className="block text-muted-foreground">Anggota keluarga</span><strong>{family.family_size ?? "Belum diisi"}</strong></span></div>
                <div className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-primary" /><span><span className="block text-muted-foreground">Telepon</span><strong>{family.phone || "Belum diisi"}</strong></span></div>
                <div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span><span className="block text-muted-foreground">Alamat</span><strong>{family.address || "Belum diisi"}</strong></span></div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Baby className="h-5 w-5" /></span><CardTitle className="text-lg">Pemantauan Gizi Anak</CardTitle></div></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{children.length ? `${children.length} anak terdaftar pada keluarga ini.` : "Belum ada anak terdaftar."}</p>
                  {children.slice(0, 3).map((child) => <div key={child.id} className="rounded-xl bg-secondary/30 px-4 py-3 text-sm"><strong>{child.full_name}</strong><span className="ml-2 text-muted-foreground">Lahir {formatDate(child.date_of_birth)}</span></div>)}
                  <Button asChild className="w-full rounded-xl"><Link to={`${base}/nutrition`}>Lihat dan input gizi anak <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><ClipboardList className="h-5 w-5" /></span><CardTitle className="text-lg">Survei FIES Keluarga</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {surveys[0] ? <div className="rounded-xl bg-secondary/30 p-4 text-sm"><p className="font-semibold">{fiesLabel[surveys[0].classification] || surveys[0].classification}</p><p className="mt-1 text-muted-foreground">Skor {surveys[0].score}/8 · {formatDate(surveys[0].survey_date)}</p></div> : <p className="text-sm text-muted-foreground">Belum ada survei ketahanan pangan.</p>}
                  <Button asChild className="w-full rounded-xl"><Link to={`${base}/fies`}>Lihat dan isi survei FIES <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <FamilyForm open={editOpen} onOpenChange={setEditOpen} family={family} onSaved={setFamily} />
    </DashboardLayout>
  );
}
