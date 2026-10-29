import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { getFamily, type Family } from "@/services/facility-families";
import {
  getFamilyAssessment,
  type FamilyAssessment,
  type Priority,
} from "@/services/facility-assessments";
import {
  ArrowRight,
  ClipboardList,
  Pencil,
  RefreshCw,
  ShoppingBasket,
} from "lucide-react";
import FamilyForm from "./FamilyForm";

const fiesMeta: Record<string, { label: string; className: string; bar: string }> = {
  food_secure: {
    label: "Ketahanan pangan baik",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  moderate: {
    label: "Kerawanan pangan sedang",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    bar: "bg-amber-500",
  },
  severe: {
    label: "Kerawanan pangan tinggi",
    className: "border-red-200 bg-red-50 text-red-700",
    bar: "bg-red-500",
  },
};

const priorityMeta: Record<Priority, { label: string; className: string }> = {
  high: {
    label: "Prioritas tinggi",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  medium: {
    label: "Prioritas sedang",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  low: {
    label: "Prioritas rutin",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export default function FamilyDetailClean() {
  const { familyId } = useParams<{ familyId: string }>();
  const [family, setFamily] = useState<Family | null>(null);
  const [assessment, setAssessment] = useState<FamilyAssessment | null>(null);
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
    ])
      .then(([familyData, assessmentData]) => {
        if (active) {
          setFamily(familyData);
          setAssessment(assessmentData);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Gagal memuat ringkasan keluarga",
          );
        }
      })
      .finally(() => {
        if (active) setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [familyId, refreshKey, requestKey]);

  const base = `/dashboard/health-facility/families/${familyId}`;
  const survey = assessment?.fies;
  const surveyThisMonth =
    survey?.survey_date.slice(0, 7) === currentMonth();
  const foodStatus = survey
    ? fiesMeta[survey.classification] || {
        label: survey.classification,
        className: "border-slate-200 bg-slate-50 text-slate-600",
        bar: "bg-slate-500",
      }
    : null;

  return (
    <DashboardLayout
      title={family?.head_name || "Ringkasan keluarga"}
      subtitle={
        family
          ? `Nomor KK ${family.kk_number}`
          : "Informasi keluarga, FIES, pertumbuhan anak, dan tindak lanjut."
      }
      actions={
        family && (
          <>
            <Button
              variant="outline"
              className="rounded-xl bg-white"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit data
            </Button>
            <Button
              variant="outline"
              className="rounded-xl bg-white"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Perbarui
            </Button>
            <Button asChild className="rounded-xl">
              <Link to={`${base}/catalog`}>
                <ShoppingBasket className="mr-2 h-4 w-4" />
                Pilih pangan
              </Link>
            </Button>
          </>
        )
      }
    >
      <div className="mx-auto max-w-[1200px]">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        )}

        {error && !loading && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading && !error && family && assessment && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <section className="grid divide-y divide-slate-200 border-b border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Anggota keluarga
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {family.family_size
                    ? `${family.family_size} orang`
                    : "Belum diisi"}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nomor telepon
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {family.phone || "Belum diisi"}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Alamat
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {family.address || "Belum diisi"}
                </p>
              </div>
            </section>

            <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Ketahanan pangan
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">
                      Survei FIES terakhir
                    </h2>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="shrink-0 text-emerald-700">
                    <Link to={`${base}/fies`}>
                      Riwayat
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {survey ? (
                  <div className="mt-8">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <span className="text-5xl font-bold tracking-tight text-slate-950">
                          {survey.score}
                        </span>
                        <span className="ml-1 text-xl font-medium text-slate-400">/8</span>
                      </div>
                      <Badge variant="outline" className={foodStatus?.className}>
                        {foodStatus?.label}
                      </Badge>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={`block h-full rounded-full ${foodStatus?.bar}`}
                        style={{ width: `${(survey.score / 8) * 100}%` }}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-slate-500">
                        Survei {formatDate(survey.survey_date)}
                      </span>
                      <span
                        className={
                          surveyThisMonth
                            ? "font-medium text-emerald-700"
                            : "font-medium text-amber-700"
                        }
                      >
                        {surveyThisMonth
                          ? "Sudah diperbarui bulan ini"
                          : "Perlu diperbarui bulan ini"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 border-l-2 border-amber-400 pl-4">
                    <p className="font-semibold text-slate-900">
                      Belum ada survei FIES
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Isi survei untuk mengetahui tingkat kerawanan pangan dan
                      prioritas bantuan keluarga.
                    </p>
                    <Button asChild size="sm" className="mt-4 rounded-lg">
                      <Link to={`${base}/fies`}>Isi survei FIES</Link>
                    </Button>
                  </div>
                )}

                {assessment.summary_text && (
                  <div className="mt-7 border-t border-slate-200 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Catatan penilaian
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {assessment.summary_text}
                    </p>
                  </div>
                )}
              </section>

              <section className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Pertumbuhan
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">
                      Anak dalam keluarga
                    </h2>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="shrink-0 text-emerald-700">
                    <Link to={`${base}/nutrition`}>
                      Kelola
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {assessment.children.length === 0 ? (
                  <div className="mt-8 border-l-2 border-slate-300 pl-4">
                    <p className="font-semibold text-slate-900">
                      Belum ada anak terdaftar
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Tambahkan data anak untuk mulai mencatat pertumbuhan.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                    {assessment.children.map((child) => (
                      <article
                        key={child.child_id}
                        className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {child.child_name}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Lahir {formatDate(child.date_of_birth)}
                          </p>
                        </div>
                        {child.latest_measurement ? (
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {child.latest_measurement.weight} kg ·{" "}
                              {child.latest_measurement.height} cm
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Diukur{" "}
                              {formatDate(
                                child.latest_measurement.measurement_date,
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Belum diukur
                          </span>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="border-t border-slate-200">
              <header className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
                <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Tindak lanjut
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Saran berdasarkan data FIES dan pengukuran terakhir. Tetap
                    gunakan penilaian petugas sebelum mengambil tindakan.
                  </p>
                </div>
              </header>

              {assessment.recommendations.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-500">
                  Belum ada rekomendasi. Lengkapi survei FIES atau pengukuran
                  anak untuk mendapatkan saran tindak lanjut.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {assessment.recommendations.map((recommendation, index) => {
                    const priority = priorityMeta[recommendation.priority];
                    return (
                      <article
                        key={recommendation.id}
                        className="grid gap-4 px-6 py-5 md:grid-cols-[32px_minmax(0,1fr)_auto]"
                      >
                        <span className="text-sm font-semibold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {recommendation.title}
                          </h3>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                            {recommendation.description}
                          </p>
                          {recommendation.action_items.length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm text-slate-700">
                              {recommendation.action_items.map((item) => (
                                <li key={item} className="flex gap-2">
                                  <span className="text-slate-400">—</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`h-fit w-fit ${priority.className}`}
                        >
                          {priority.label}
                        </Badge>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <FamilyForm
        open={editOpen}
        onOpenChange={setEditOpen}
        family={family}
        onSaved={setFamily}
      />
    </DashboardLayout>
  );
}
