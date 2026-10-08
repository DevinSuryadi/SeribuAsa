import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Baby, ClipboardList, MapPin, Pencil, Phone, RefreshCw, Sparkles, Users } from "lucide-react";
import { getFamily, type Family } from "@/services/facility-families";
import { getFamilyAssessment, type FamilyAssessment, type Priority } from "@/services/facility-assessments";
import { formatDate } from "@/lib/format";
import FamilyForm from "./FamilyForm";

const fiesLabel: Record<string, string> = {
  food_secure: "Ketahanan pangan baik",
  moderate: "Kerawanan pangan sedang",
  severe: "Kerawanan pangan berat",
};

const priorityLabel: Record<Priority | "unknown", string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rutin",
  unknown: "Belum dapat ditentukan",
};

const priorityClass: Record<Priority, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export default function FamilyDetail() {
  const { familyId } = useParams<{ familyId: string }>();
  const [family, setFamily] = useState<Family | null>(null);
  const [assessment, setAssessment] = useState<FamilyAssessment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!familyId) return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([getFamily(familyId), getFamilyAssessment(familyId)])
      .then(([familyData, assessmentData]) => {
        if (active) {
          setFamily(familyData);
          setAssessment(assessmentData);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setFamily(null);
          setAssessment(null);
          setError(err instanceof Error ? err.message : "Gagal memuat ringkasan keluarga");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [familyId, refreshKey]);

  const base = `/dashboard/health-facility/families/${familyId}`;
  const survey = assessment?.fies;
  const surveyCompletedThisMonth = survey?.survey_date.slice(0, 7) === currentMonth();
  const surveyStatus = !survey
    ? "Belum pernah diisi"
    : surveyCompletedThisMonth
      ? "Sudah diisi bulan ini"
      : "Belum diisi bulan ini";

  return (
    <DashboardLayout title="Ringkasan Keluarga" subtitle="FIES, pertumbuhan anak, dan rekomendasi tindakan terbaru.">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/dashboard/health-facility/families" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar keluarga</Link>
          <div className="flex flex-wrap gap-2"><Button asChild size="sm"><Link to={`${base}/catalog`}>Pilih pangan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button variant="outline" size="sm" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Perbarui ringkasan</Button></div>
        </div>
        {loading && <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Memuat ringkasan keluarga...</p>}
        {error && <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-destructive">{error}</p>}
        {!loading && family && assessment && (
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

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><ClipboardList className="h-5 w-5" /></span><CardTitle className="text-lg">FIES Terakhir</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline" className={surveyCompletedThisMonth ? priorityClass.low : "border-amber-200 bg-amber-50 text-amber-700"}>{surveyStatus}</Badge>
                  {survey ? <div className="flex flex-wrap items-center gap-3"><strong className="text-3xl">{survey.score}/8</strong><span className="text-sm font-medium">{fiesLabel[survey.classification] || survey.classification}</span></div> : <p className="text-sm text-muted-foreground">Belum ada survei FIES untuk keluarga ini.</p>}
                  {survey && <p className="text-sm text-muted-foreground">Terakhir diisi {formatDate(survey.survey_date)}</p>}
                  <p className="text-xs text-muted-foreground">Buka tab Survei FIES di atas untuk melihat riwayat atau mengisi survei.</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Baby className="h-5 w-5" /></span><CardTitle className="text-lg">Pengukuran Gizi Terakhir</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {assessment.children.length === 0 && <p className="text-sm text-muted-foreground">Belum ada anak terdaftar.</p>}
                  {assessment.children.map((child) => <div key={child.child_id} className="rounded-xl border border-border/70 bg-secondary/20 p-3 text-sm">
                    <strong>{child.child_name}</strong><span className="ml-2 text-xs text-muted-foreground">Lahir {formatDate(child.date_of_birth)}</span>
                    {child.latest_measurement ? <p className="mt-1 text-muted-foreground">{formatDate(child.latest_measurement.measurement_date)} · BB {child.latest_measurement.weight} kg · TB {child.latest_measurement.height} cm · z-score BB {child.latest_measurement.z_score_weight ?? "–"}, TB {child.latest_measurement.z_score_height ?? "–"}</p> : <p className="mt-1 text-muted-foreground">Belum ada pengukuran.</p>}
                  </div>)}
                  <p className="text-xs text-muted-foreground">Buka tab Pengukuran Anak di atas untuk menambah anak atau pengukuran.</p>
                </CardContent>
              </Card>
            </section>

            <Card className="rounded-2xl border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Sparkles className="h-5 w-5" /></span><div><CardTitle className="text-lg">Rekomendasi Tindakan</CardTitle><p className="mt-1 text-sm text-muted-foreground">Saran otomatis dari aturan FIES dan z-score. Faskes menentukan tindak lanjut; hasil ini bukan diagnosis.</p></div></CardHeader>
              <CardContent className="space-y-3">
                {assessment.recommendations.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Isi FIES atau pengukuran gizi melalui tab di atas untuk menampilkan saran.</p>}
                {assessment.recommendations.map((rec) => <article key={rec.id} className="rounded-xl border border-border/70 bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{rec.title}</h3><Badge variant="outline" className={priorityClass[rec.priority]}>{priorityLabel[rec.priority]}</Badge></div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{rec.description}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{rec.action_items.map((item) => <li key={item}>{item}</li>)}</ul>
                  <Button asChild size="sm" className="mt-4 rounded-xl"><Link to={`${base}/catalog`}>Lihat katalog keluarga <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </article>)}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <FamilyForm open={editOpen} onOpenChange={setEditOpen} family={family} onSaved={setFamily} />
    </DashboardLayout>
  );
}
