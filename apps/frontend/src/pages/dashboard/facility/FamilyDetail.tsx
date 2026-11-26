import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getFamily, type Family } from "@/services/facility-families";
import {
  getFamilyAssessment,
  getFamilyRecommendation,
  type FamilyAiRecommendation,
  type FamilyAssessment,
  type MemberReasons,
} from "@/services/facility-assessments";
import { formatDate, formatIDR } from "@/lib/format";
import { facilityPriorityConfig, fiesStatusConfig, type FiesClassification } from "@/lib/status-config";
import FamilyForm from "./FamilyForm";

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

const recommendationSourceLabels: Record<string, string> = {
  model: "Model AI",
  keamanan: "Aturan keamanan",
  kebijakan: "Kebijakan program",
  aturan_fies: "Hasil FIES",
};

const foodLevelBadges = {
  priority: { label: "Prioritas", className: facilityPriorityConfig.medium.className },
  recommended: { label: "Dianjurkan", className: facilityPriorityConfig.low.className },
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function MemberReasonList({ items }: { items: MemberReasons[] }) {
  return (
    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
      {items.map((item) => <li key={item.member}><strong className="font-medium">{item.member}</strong>{item.reasons.length > 0 && `: ${item.reasons.join("; ")}`}</li>)}
    </ul>
  );
}

export default function FamilyDetail() {
  const { familyId } = useParams<{ familyId: string }>();
  const [family, setFamily] = useState<Family | null>(null);
  const [assessment, setAssessment] = useState<FamilyAssessment | null>(null);
  const [recommendation, setRecommendation] = useState<FamilyAiRecommendation | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  // Loading is derived: true until the request for the current key has settled.
  const requestKey = `${familyId}:${refreshKey}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    if (!familyId) return;
    let active = true;
    const forceRefresh = refreshKey > 0;
    Promise.all([
      getFamily(familyId, forceRefresh),
      getFamilyAssessment(familyId, forceRefresh),
      getFamilyRecommendation(familyId, forceRefresh),
    ])
      .then(([familyData, assessmentData, recommendationData]) => {
        if (active) {
          setFamily(familyData);
          setAssessment(assessmentData);
          setRecommendation(recommendationData);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setFamily(null);
          setAssessment(null);
          setRecommendation(null);
          setError(err instanceof Error ? err.message : "Gagal memuat ringkasan keluarga");
        }
      })
      .finally(() => { if (active) setLoadedKey(requestKey); });
    return () => { active = false; };
  }, [familyId, refreshKey, requestKey]);

  const base = `/dashboard/health-facility/families/${familyId}`;
  const survey = assessment?.fies;
  const surveyCompletedThisMonth = survey?.survey_date.slice(0, 7) === currentMonth();
  const surveyStatus = !survey
    ? "Belum pernah diisi"
    : surveyCompletedThisMonth
      ? "Sudah diisi bulan ini"
      : "Belum diisi bulan ini";
  const neededFoods = recommendation?.food_groups.filter((group) => group.level > 0) ?? [];

  return (
    <DashboardLayout title="Ringkasan Keluarga" subtitle="FIES, pertumbuhan anak, dan rekomendasi tindakan terbaru.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/dashboard/health-facility/families" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar keluarga</Link>
          <div className="flex flex-wrap gap-2"><Button asChild size="sm" className="rounded-full"><Link to={`${base}/catalog`}>Pilih pangan</Link></Button><Button variant="outline" size="sm" className="rounded-full bg-white" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Segarkan</Button></div>
        </div>
        {loading && (
          <div className="space-y-4" aria-label="Memuat ringkasan keluarga">
            <Skeleton className="h-36 rounded-2xl" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        )}
        {error && !loading && (
          <ErrorState
            title="Gagal memuat ringkasan keluarga"
            message={error}
            onRetry={() => setRefreshKey((key) => key + 1)}
          />
        )}
        {!loading && family && assessment && recommendation && (
          <>
            <Card className="overflow-hidden rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-[13px] font-medium text-slate-500">Keluarga penerima manfaat</p><CardTitle className="mt-2 text-2xl font-bold text-slate-900">{family.head_name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Nomor KK {family.kk_number}</p></div>
                <Button variant="outline" className="rounded-full" onClick={() => setEditOpen(true)}>Edit data keluarga</Button>
              </CardHeader>
              <CardContent className="grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-3">
                <div><span className="block text-muted-foreground">Anggota keluarga</span><strong>{family.family_size ?? "Belum diisi"}</strong></div>
                <div><span className="block text-muted-foreground">Telepon</span><strong>{family.phone || "Belum diisi"}</strong></div>
                <div><span className="block text-muted-foreground">Alamat</span><strong>{family.address || "Belum diisi"}</strong></div>
              </CardContent>
            </Card>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                <CardHeader><CardTitle className="text-base font-bold text-slate-900">FIES Terakhir</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline" className={surveyCompletedThisMonth ? fiesStatusConfig.food_secure.className : fiesStatusConfig.moderate.className}>{surveyStatus}</Badge>
                  {survey ? <div className="flex flex-wrap items-center gap-3"><strong className="text-3xl">{survey.score}/8</strong><span className="text-sm font-medium">{fiesStatusConfig[survey.classification as FiesClassification]?.label || survey.classification}</span></div> : <p className="text-sm text-muted-foreground">Belum ada survei FIES untuk keluarga ini.</p>}
                  {survey && <p className="text-sm text-muted-foreground">Terakhir diisi {formatDate(survey.survey_date)}</p>}
                  <p className="text-xs text-muted-foreground">Buka tab Survei FIES di atas untuk melihat riwayat atau mengisi survei.</p>
                </CardContent>
              </Card>
              <Card className="rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                <CardHeader><CardTitle className="text-base font-bold text-slate-900">Pengukuran Gizi Terakhir</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {assessment.children.length === 0 && <p className="text-sm text-muted-foreground">Belum ada anak terdaftar.</p>}
                  {assessment.children.map((child) => <div key={child.child_id} className="rounded-xl bg-[#F4F7F5] p-3 text-sm">
                    <strong>{child.child_name}</strong>
                    {child.status === "unborn" ? <>
                      <span className="ml-2 text-xs text-muted-foreground">Dalam kandungan · {child.gestational_age_weeks} minggu · Perkiraan lahir {child.expected_birth_date ? formatDate(child.expected_birth_date) : "-"}</span>
                      {child.latest_prenatal_check ? <p className="mt-1 text-muted-foreground">{formatDate(child.latest_prenatal_check.measurement_date)} · BB ibu {child.latest_prenatal_check.maternal_weight} kg · LiLA {child.latest_prenatal_check.maternal_muac} cm · TFU {child.latest_prenatal_check.fundal_height ?? "–"} cm</p> : <p className="mt-1 text-muted-foreground">Belum ada pemeriksaan kehamilan.</p>}
                    </> : <>
                      <span className="ml-2 text-xs text-muted-foreground">Lahir {child.date_of_birth ? formatDate(child.date_of_birth) : "-"}</span>
                      {child.latest_measurement ? <p className="mt-1 text-muted-foreground">{formatDate(child.latest_measurement.measurement_date)} · BB {child.latest_measurement.weight} kg · TB {child.latest_measurement.height} cm · z-score BB {child.latest_measurement.z_score_weight ?? "–"}, TB {child.latest_measurement.z_score_height ?? "–"}</p> : <p className="mt-1 text-muted-foreground">Belum ada pengukuran.</p>}
                    </>}
                  </div>)}
                  <p className="text-xs text-muted-foreground">Buka tab Pengukuran Anak di atas untuk menambah anak atau pengukuran.</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><CardTitle className="text-base font-bold text-slate-900">Rekomendasi Tindakan</CardTitle><p className="mt-1 text-sm text-muted-foreground">Saran model AI dari FIES, pertumbuhan anak, dan pemeriksaan kehamilan. Faskes menentukan tindak lanjut; hasil ini bukan diagnosis.</p></div>
                  <Badge variant="outline" className={`shrink-0 ${facilityPriorityConfig[recommendation.priority].className}`}>{facilityPriorityConfig[recommendation.priority].label}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendation.data_checks.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">Lengkapi data agar saran lebih tepat:</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">{recommendation.data_checks.map((check) => <li key={`${check.key}-${check.member}`}>{check.label} ({check.member})</li>)}</ul>
                  </div>}
                  {recommendation.actions.length === 0 && <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{neededFoods.length > 0 ? "Belum ada tindakan khusus. Lanjutkan pemantauan rutin." : "Isi FIES atau pengukuran gizi melalui tab di atas untuk menampilkan saran."}</p>}
                  {recommendation.actions.map((action) => <article key={action.key} className="rounded-xl bg-[#F4F7F5] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-slate-900">{action.label}</h3><span className="text-xs text-muted-foreground">{action.sources.map((source) => recommendationSourceLabels[source] ?? source).join(" · ")}</span></div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
                    <MemberReasonList items={action.member_reasons} />
                  </article>)}
                  {recommendation.model_version && <p className="text-xs text-muted-foreground">Versi model: {recommendation.model_version}</p>}
                </CardContent>
              </Card>
              <Card className="rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                <CardHeader><div><CardTitle className="text-base font-bold text-slate-900">Rekomendasi Pangan</CardTitle><p className="mt-1 text-sm text-muted-foreground">Kelompok pangan yang perlu dibeli, dihitung dari kebutuhan semua anak dan kehamilan di keluarga ini.</p></div></CardHeader>
                <CardContent className="space-y-3">
                  {neededFoods.length === 0 ? <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Belum ada anak di bawah 2 tahun atau kehamilan yang terdaftar. Tambahkan melalui tab Pengukuran Anak di atas.</p> : <>
                    <p className="text-sm text-muted-foreground">{recommendation.weekly_budget ? <>Pembagian sisa kuota minggu ini <strong className="text-slate-900">{formatIDR(recommendation.weekly_budget)}</strong>.</> : "Nominal per kelompok muncul saat keluarga memiliki sisa kuota minggu ini."}</p>
                    {neededFoods.map((group) => {
                      const badge = group.level === 2 ? foodLevelBadges.priority : foodLevelBadges.recommended;
                      return <article key={group.key} className="rounded-xl bg-[#F4F7F5] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-slate-900">{group.label}</h3><Badge variant="outline" className={badge.className}>{badge.label}</Badge></div>
                        <p className="mt-1 text-xs text-muted-foreground">{capitalize(group.examples)} · Kategori katalog: {group.catalog_categories.map(capitalize).join(", ")}</p>
                        <div className="mt-3 flex items-center gap-3"><Progress value={group.share * 100} className="h-2 bg-white" aria-label={`Porsi ${group.label}`} /><span className="shrink-0 text-sm font-semibold">{Math.round(group.share * 100)}%{group.budget != null && ` · ${formatIDR(group.budget)}`}</span></div>
                        <MemberReasonList items={group.members} />
                      </article>;
                    })}
                  </>}
                  {recommendation.excluded_members.length > 0 && <p className="text-xs text-muted-foreground">Tidak dihitung: {recommendation.excluded_members.map((item) => `${item.member} (${item.reason})`).join("; ")}</p>}
                  <p className="text-xs text-muted-foreground">Tidak dianjurkan: {recommendation.not_recommended.map((item) => `${capitalize(item.category)}. ${item.reason}`).join(" ")}</p>
                  <Button asChild size="sm" className="rounded-full"><Link to={`${base}/catalog`}>Lihat katalog keluarga</Link></Button>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
      <FamilyForm open={editOpen} onOpenChange={setEditOpen} family={family} onSaved={setFamily} />
    </DashboardLayout>
  );
}
