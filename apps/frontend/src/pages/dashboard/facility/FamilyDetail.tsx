import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, ChevronDown, RefreshCw } from "lucide-react";
import { getFamily, type Family } from "@/services/facility-families";
import {
  getFamilyAssessment,
  getFamilyRecommendation,
  type FamilyAiRecommendation,
  type FamilyAssessment,
  type MemberReasons,
} from "@/services/facility-assessments";
import { formatDate, formatIDR } from "@/lib/format";
import { fiesStatusConfig, type FiesClassification } from "@/lib/status-config";
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

// The summary shows one child; the others are revealed with the expand toggle.
const CHILDREN_COLLAPSED = 1;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function MemberReasons({ items }: { items: MemberReasons[] }) {
  if (items.length === 0) return null;
  return (
    <p className="mt-1 text-xs leading-5 text-slate-500">
      {items.map((item, index) => (
        <span key={item.member}>
          {index > 0 && <span className="mx-1.5 text-slate-300">/</span>}
          <span className="font-medium text-slate-700">{item.member}</span>
          {item.reasons.length > 0 && <> · {item.reasons.join(", ").replace(/>=/g, "≥").replace(/<=/g, "≤")}</>}
        </span>
      ))}
    </p>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{children}</p>;
}

const recoCardClass = "flex flex-col rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]";

/** Header shared by both recommendation cards so their lists start at the same height. */
function RecoHeader({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <CardHeader className="space-y-0 px-5 pb-3 pt-4">
      <SectionEyebrow>Saran AI</SectionEyebrow>
      <div className="mt-1.5 flex items-baseline justify-between gap-4">
        <CardTitle className="text-base font-bold leading-6 tracking-tight text-slate-900">{title}</CardTitle>
        {aside}
      </div>
    </CardHeader>
  );
}

/** One numbered row: index, title (+ inline tag), right-hand meta, then supporting lines. */
function RecoRow({ index, title, tag, aside, children }: { index: number; title: string; tag?: React.ReactNode; aside?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <li className="grid flex-1 grid-cols-[1.5rem_minmax(0,1fr)] content-start py-2.5 first:pt-0 last:pb-0">
      <span className="text-sm font-medium leading-5 tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</span>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold leading-5 text-slate-900">
            {title}
            {tag && <span className="ml-2 align-[1px] text-[10px] font-semibold uppercase tracking-wider">{tag}</span>}
          </h3>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
        {children}
      </div>
    </li>
  );
}

/** Footer row with a fixed height so both cards' dividers line up. */
function RecoFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto flex min-h-[2.5rem] flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-2.5">{children}</div>;
}

export default function FamilyDetail() {
  const { familyId } = useParams<{ familyId: string }>();
  const [family, setFamily] = useState<Family | null>(null);
  const [assessment, setAssessment] = useState<FamilyAssessment | null>(null);
  const [recommendation, setRecommendation] = useState<FamilyAiRecommendation | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [childrenExpanded, setChildrenExpanded] = useState(false);
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
      ? "Sudah diisi"
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
            <Card className="rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-8">
                <div className="min-w-0 lg:w-64 lg:shrink-0">
                  <p className="text-xs font-medium text-slate-500">Keluarga penerima manfaat</p>
                  <CardTitle className="mt-1 text-lg font-bold text-slate-900">{family.head_name}</CardTitle>
                </div>
                <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-xs text-muted-foreground">Nomor KK</dt><dd className="font-semibold tabular-nums text-slate-900">{family.kk_number}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Anggota keluarga</dt><dd className="font-semibold text-slate-900">{family.family_size ?? "Belum diisi"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Telepon</dt><dd className="font-semibold tabular-nums text-slate-900">{family.phone || "Belum diisi"}</dd></div>
                  <div className="min-w-0"><dt className="text-xs text-muted-foreground">Alamat</dt><dd className="truncate font-semibold text-slate-900" title={family.address || undefined}>{family.address || "Belum diisi"}</dd></div>
                </dl>
                <Button variant="outline" size="sm" className="h-8 shrink-0 self-start rounded-full px-3.5 text-[13px] lg:self-center" onClick={() => setEditOpen(true)}>Edit data keluarga</Button>
              </CardContent>
            </Card>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Card className="flex flex-col rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                <CardContent className="flex flex-1 flex-col gap-2 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-bold text-slate-900">FIES Terakhir</CardTitle>
                    <Link to={`${base}/fies`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      {surveyCompletedThisMonth ? "Lihat riwayat" : "Isi survei bulan ini"} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    {survey ? (
                      <div>
                        <p className="flex items-baseline gap-2.5">
                          <strong className="text-2xl font-bold tabular-nums text-slate-900">{survey.score}/8</strong>
                          <span className="text-sm font-medium text-slate-900">{fiesStatusConfig[survey.classification as FiesClassification]?.label || survey.classification}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Diisi {formatDate(survey.survey_date)}</p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Belum ada survei FIES untuk keluarga ini.</p>}
                    <Badge variant="outline" className={`shrink-0 px-2 py-0 text-[11px] ${surveyCompletedThisMonth ? fiesStatusConfig.food_secure.className : fiesStatusConfig.moderate.className}`}>{surveyStatus}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col rounded-[20px] border-0 bg-white shadow-[2px_4px_12px_rgba(0,0,0,0.06)]">
                <CardContent className="flex flex-1 flex-col gap-2 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Pengukuran Gizi Terakhir
                      {assessment.children.length > 0 && <span className="ml-2 text-xs font-medium text-muted-foreground">{assessment.children.length} anak</span>}
                    </CardTitle>
                    <Link to={`${base}/nutrition`} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      Lihat semua <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {assessment.children.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada anak terdaftar.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 text-[13px]">
                      {assessment.children.slice(0, childrenExpanded ? undefined : CHILDREN_COLLAPSED).map((child) => {
                        const unborn = child.status === "unborn";
                        const check = unborn ? child.latest_prenatal_check : child.latest_measurement;
                        const summary = unborn
                          ? child.latest_prenatal_check && `BB ibu ${child.latest_prenatal_check.maternal_weight} kg · LiLA ${child.latest_prenatal_check.maternal_muac} cm`
                          : child.latest_measurement && `BB ${child.latest_measurement.weight} kg · TB ${child.latest_measurement.height} cm`;
                        return (
                          <li key={child.child_id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2 first:pt-1 last:pb-0 sm:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_7.5rem] sm:items-baseline">
                            <span className="truncate font-semibold text-slate-900" title={child.child_name}>{child.child_name}</span>
                            <span className="col-start-1 row-start-2 truncate text-xs text-muted-foreground sm:col-start-auto sm:row-start-auto">
                              {unborn ? `Kandungan ${child.gestational_age_weeks} mgg` : `Lahir ${child.date_of_birth ? formatDate(child.date_of_birth) : "-"}`}
                            </span>
                            <span className={`col-start-1 row-start-3 truncate sm:col-start-auto sm:row-start-auto ${summary ? "text-slate-600" : "text-slate-400"}`}>
                              {summary || (unborn ? "Belum ada pemeriksaan" : "Belum ada pengukuran")}
                            </span>
                            <span className="col-start-2 row-start-1 text-right text-xs tabular-nums text-muted-foreground sm:col-start-auto sm:row-start-auto">
                              {check ? formatDate(check.measurement_date) : "—"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {assessment.children.length > CHILDREN_COLLAPSED && (
                    <button
                      type="button"
                      className="inline-flex w-fit items-center gap-1 pt-1 text-xs font-medium text-muted-foreground hover:text-primary"
                      aria-expanded={childrenExpanded}
                      onClick={() => setChildrenExpanded((open) => !open)}
                    >
                      {childrenExpanded ? "Sembunyikan" : `${assessment.children.length - CHILDREN_COLLAPSED} anak lainnya`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${childrenExpanded ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Card className={recoCardClass}>
                <RecoHeader title="Tindakan" />
                <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-4">
                  {recommendation.actions.length === 0 && recommendation.data_checks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{neededFoods.length > 0 ? "Belum ada tindakan khusus. Lanjutkan pemantauan rutin." : "Isi FIES atau pengukuran gizi untuk menampilkan saran."}</p>
                  ) : (
                    <ol className="flex flex-1 flex-col divide-y divide-slate-100">
                      {[
                        ...recommendation.data_checks.map((check) => ({
                          key: `data-${check.key}-${check.member}`,
                          tag: "Data",
                          label: check.label,
                          description: `Data ${check.member} belum lengkap, saran bisa kurang tepat.`,
                          reasons: [] as MemberReasons[],
                        })),
                        ...recommendation.actions.map((action) => ({
                          key: action.key,
                          tag: action.sources.map((source) => recommendationSourceLabels[source] ?? source).join(" · "),
                          label: action.label,
                          description: action.description,
                          reasons: action.member_reasons,
                        })),
                      ].map((item, index) => (
                        <RecoRow key={item.key} index={index} title={item.label} aside={<span className="text-[10px] uppercase tracking-wider text-slate-400">{item.tag}</span>}>
                          <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{item.description}</p>
                          <MemberReasons items={item.reasons} />
                        </RecoRow>
                      ))}
                    </ol>
                  )}
                  <RecoFooter>
                    <p className="text-[11px] leading-5 text-slate-400">Bukan diagnosis, keputusan tetap di faskes{recommendation.model_version && <> · {recommendation.model_version}</>}</p>
                  </RecoFooter>
                </CardContent>
              </Card>

              <Card className={recoCardClass}>
                <RecoHeader
                  title="Belanja Pangan"
                  aside={recommendation.weekly_budget != null && recommendation.weekly_budget > 0 && (
                    <p className="shrink-0 tabular-nums">
                      <span className="mr-2 text-[11px] text-slate-400">Sisa kuota minggu ini</span>
                      <span className="text-base font-bold tracking-tight text-slate-900">{formatIDR(recommendation.weekly_budget)}</span>
                    </p>
                  )}
                />
                <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-4">
                  {neededFoods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada anak di bawah 2 tahun atau kehamilan yang terdaftar.</p>
                  ) : (
                    <ol className="flex flex-1 flex-col divide-y divide-slate-100">
                      {neededFoods.map((group, index) => (
                        <RecoRow
                          key={group.key}
                          index={index}
                          title={group.label}
                          tag={group.level === 2 ? <span className="text-primary">Prioritas</span> : undefined}
                          aside={
                            <p className="tabular-nums">
                              <span className="text-sm font-semibold leading-5 text-slate-900">{group.budget != null ? formatIDR(group.budget) : `${Math.round(group.share * 100)}%`}</span>
                              {group.budget != null && <span className="ml-1.5 inline-block w-8 text-right text-xs text-slate-400">{Math.round(group.share * 100)}%</span>}
                            </p>
                          }
                        >
                          <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{capitalize(group.examples)}</p>
                          <MemberReasons items={group.members} />
                        </RecoRow>
                      ))}
                    </ol>
                  )}
                  <RecoFooter>
                    <div className="space-y-0.5 text-[11px] leading-5 text-slate-400">
                      {recommendation.not_recommended.length > 0 && <p>Hindari: {recommendation.not_recommended.map((item) => capitalize(item.category)).join(", ")}</p>}
                      {recommendation.excluded_members.length > 0 && <p>Tidak dihitung: {recommendation.excluded_members.map((item) => `${item.member} (${item.reason})`).join("; ")}</p>}
                    </div>
                    <Button asChild size="sm" className="h-8 rounded-full px-3.5 text-[13px]">
                      <Link to={`${base}/catalog`}>Lihat katalog keluarga <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                    </Button>
                  </RecoFooter>
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
