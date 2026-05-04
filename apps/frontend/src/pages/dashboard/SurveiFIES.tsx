import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  ListChecks,
  Clock,
  CalendarDays,
  ShieldCheck,
  Star,
  History,
  ClipboardX,
} from "lucide-react";
import { submitFies, getFiesHistory } from "@/services/fies";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

const fiesQuestions = [
  "Dalam 30 hari terakhir, apakah Anda khawatir makanan akan habis sebelum bisa membeli lagi?",
  "Dalam 30 hari terakhir, apakah Anda tidak bisa makan makanan sehat dan bergizi?",
  "Dalam 30 hari terakhir, apakah Anda hanya makan beberapa jenis makanan saja?",
  "Dalam 30 hari terakhir, apakah Anda harus melewatkan makan karena tidak ada makanan?",
  "Dalam 30 hari terakhir, apakah Anda makan lebih sedikit dari yang seharusnya?",
  "Dalam 30 hari terakhir, apakah rumah Anda kehabisan makanan?",
  "Dalam 30 hari terakhir, apakah Anda lapar tapi tidak makan karena tidak cukup makanan?",
  "Dalam 30 hari terakhir, apakah Anda tidak makan seharian penuh karena tidak cukup makanan?",
];

type Answer = "ya" | "tidak" | null;

const getSeverity = (s: number) => {
  if (s <= 2) {
    return {
      label: "Ketahanan Pangan Baik",
      color: "bg-primary/10 text-primary border-primary/20",
      badgeClass: "border-primary/20 bg-primary/10 text-primary",
      desc: "Ketahanan pangan Anda dalam kondisi baik.",
    };
  }

  if (s <= 5) {
    return {
      label: "Ketahanan Pangan Sedang",
      color: "bg-orange-100 text-orange-700 border-orange-300",
      badgeClass: "border-orange-300 bg-orange-100 text-orange-700",
      desc: "Ada indikasi kerawanan pangan sedang. Anda akan mendapat prioritas bantuan.",
    };
  }

  return {
    label: "Ketahanan Pangan Buruk",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
    desc: "Terdeteksi kerawanan pangan serius. Bantuan Anda akan diprioritaskan segera.",
  };
};

const surveyInfo = [
  {
    icon: ListChecks,
    title: "8 pertanyaan singkat",
    desc: "Dirancang untuk mudah dipahami dan dijawab.",
  },
  {
    icon: Clock,
    title: "Waktu pengerjaan ~3 menit",
    desc: "Hanya membutuhkan beberapa menit saja.",
  },
  {
    icon: CalendarDays,
    title: "Jawab berdasarkan 30 hari terakhir",
    desc: "Jawablah sesuai kondisi dalam 30 hari terakhir.",
  },
  {
    icon: ShieldCheck,
    title: "Diisi minimal 1x setiap bulan",
    desc: "Bantu kami memantau kondisi pangan Anda.",
  },
  {
    icon: Star,
    title: "Hasil menentukan prioritas bantuan",
    desc: "Data Anda membantu penyaluran bantuan tepat sasaran.",
  },
];

const SurveiFIES = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(Array(8).fill(null));
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const progress = ((currentQ + 1) / fiesQuestions.length) * 100;
  const score = answers.filter((a) => a === "ya").length;

  useEffect(() => {
    if (user?.id) {
      getFiesHistory(user.id)
        .then((res) => setHistory(res.data?.surveys || []))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [user]);

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[currentQ] === null) {
      toast.error("Pilih jawaban", {
        description: "Silakan pilih Ya atau Tidak",
      });
      return;
    }

    if (currentQ < fiesQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setSubmitting(true);

    try {
      const responses: Record<string, number> = {};

      answers.forEach((a, i) => {
        responses[`q${i + 1}`] = a === "ya" ? 1 : 0;
      });

      const res = await submitFies({ responses });

      if (res.success) {
        setCompleted(true);
        toast.success("Survei berhasil dikirim!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim survei");
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    const severity = getSeverity(score);

    return (
      <DashboardLayout
        title="Survei FIES"
        subtitle="Survei ketahanan pangan bulanan."
      >
        <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-4 pb-3 lg:h-[calc(100svh-200px)] lg:max-h-[calc(100svh-200px)] lg:min-h-0 lg:overflow-hidden lg:pb-0">
          <Card className="shrink-0 overflow-hidden rounded-[20px] border border-border/70 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
            <CardContent className="p-0">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.75fr)]">
                <div className="relative overflow-hidden bg-gradient-to-br from-primary via-emerald-700 to-emerald-900 px-5 py-5 text-primary-foreground sm:px-6 lg:px-7">
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
                  <div className="absolute -bottom-14 -left-14 h-40 w-40 rounded-full bg-black/10" />

                  <div className="relative flex min-h-[clamp(190px,26svh,250px)] flex-col justify-center">
                    <div className="max-w-[500px] space-y-3">
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                          Hasil Survei Bulanan
                        </p>

                        <h2 className="text-[26px] font-bold leading-tight tracking-tight text-white sm:text-[30px]">
                          Survei Selesai!
                        </h2>

                        <p className="max-w-[460px] text-sm leading-6 text-white/90">
                          Terima kasih telah mengisi survei ketahanan pangan bulan
                          ini. Hasil Anda akan digunakan untuk membantu menentukan
                          prioritas bantuan.
                        </p>
                      </div>

                      <Button
                        className="h-10 rounded-2xl bg-white px-5 text-sm font-semibold text-primary hover:bg-white/90"
                        onClick={() => navigate("/dashboard/beneficiary")}
                      >
                        Kembali ke Dashboard
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-background p-5 lg:p-6">
                  <div className="rounded-[20px] border border-border/70 bg-secondary/15 p-5">
                    <p className="text-sm font-medium text-muted-foreground">
                      Skor FIES Anda
                    </p>

                    <div className="mt-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-end gap-2">
                          <span className="text-[48px] font-bold leading-none tracking-tight text-foreground sm:text-[54px]">
                            {score}
                          </span>
                          <span className="pb-1 text-[22px] font-semibold text-muted-foreground">
                            / 8
                          </span>
                        </div>

                        <Badge
                          className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold ${severity.badgeClass}`}
                        >
                          {severity.label}
                        </Badge>
                      </div>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {severity.desc}
                      </p>
                    </div>
                  </div>

                  {score > 5 && (
                    <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50 p-4">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          Bantuan Diprioritaskan
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Berdasarkan skor FIES Anda, alokasi voucher nutrisi akan
                          diprioritaskan untuk keluarga Anda.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-1 rounded-[20px] border border-border/70 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
            <CardContent className="flex min-h-0 flex-1 p-5">
              <div className="grid w-full content-start gap-4 md:grid-cols-2">
                <div className="rounded-[16px] border border-border/70 bg-secondary/20 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Apa yang terjadi setelah ini?
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Hasil survei Anda akan diproses untuk membantu penentuan
                    kondisi ketahanan pangan dan prioritas bantuan.
                  </p>
                </div>

                <div className="rounded-[16px] border border-border/70 bg-secondary/20 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Pengingat
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Survei FIES diisi secara berkala setiap bulan agar data
                    bantuan tetap akurat dan kondisi keluarga Anda bisa terus
                    dipantau.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!started) {
    return (
      <DashboardLayout
        title="Survei FIES"
        subtitle="Survei ketahanan pangan bulanan."
      >
        <div className="mx-auto w-full max-w-[1540px] pb-3 lg:h-[calc(100svh-200px)] lg:max-h-[calc(100svh-200px)] lg:min-h-0 lg:overflow-hidden lg:pb-0">
          <div className="grid h-full min-h-0 gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
            <div className="grid min-h-0 w-full shrink-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,424px)]">
              <Card className="h-[300px] overflow-hidden rounded-[18px] border-border/70 bg-background shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
                <CardContent className="relative h-[230px] overflow-visible bg-gradient-to-br from-primary via-emerald-700 to-emerald-900 p-5 text-primary-foreground sm:p-6">
                  <div className="absolute right-6 top-5 grid grid-cols-6 gap-1.5 opacity-20">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span key={i} className="h-1 w-1 rounded-full bg-white" />
                    ))}
                  </div>

                  <div className="absolute -right-14 bottom-[-36px] h-48 w-48 rounded-full bg-white/10" />
                  <div className="absolute left-[32%] bottom-[-92px] h-48 w-48 rounded-full bg-black/10" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-lg shadow-black/10">
                      <ClipboardList className="h-5 w-5" />
                    </div>

                    <div className="mt-5 max-w-2xl space-y-2">
                      <h2 className="max-w-xl text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                        Survei Ketahanan Pangan (FIES)
                      </h2>

                      <p className="max-w-xl text-sm leading-6 text-white/85 sm:text-[15px]">
                        Survei bulanan untuk mengukur tingkat ketahanan pangan
                        keluarga Anda.
                      </p>
                    </div>

                    <Button
                      onClick={() => setStarted(true)}
                      className="mt-5 h-10 w-full rounded-xl bg-white px-5 text-sm font-semibold text-primary shadow-lg shadow-black/10 hover:bg-white/90 sm:w-fit"
                    >
                      Mulai Survei
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-[300px] overflow-hidden rounded-[18px] border-border/70 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
                <CardContent className="h-full overflow-hidden p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Info className="h-4 w-4 text-primary" />
                    </div>

                    <h3 className="text-base font-bold leading-tight text-foreground">
                      Tentang survei ini
                    </h3>
                  </div>

                  <div className="divide-y divide-border/70">
                    {surveyInfo.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className="flex gap-3 py-[7px] first:pt-0 last:pb-0"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[13px] font-bold leading-[16px] text-foreground">
                              {item.title}
                            </p>

                            <p className="mt-0.5 text-[11px] leading-[15px] text-muted-foreground">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="flex min-h-0 overflow-hidden rounded-[18px] border-border/70 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
              <CardContent className="flex h-full min-h-0 flex-1 flex-col p-5">
                <div className="mb-3 flex shrink-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <History className="h-4 w-4 text-primary" />
                  </div>

                  <h3 className="text-base font-bold text-foreground">
                    Riwayat Survei
                  </h3>
                </div>

                {historyLoading ? (
                  <div className="min-h-0 flex-1 space-y-2 rounded-[16px] border border-border/70 p-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex animate-pulse items-center justify-between"
                      >
                        <div className="h-3 w-28 rounded bg-secondary" />
                        <div className="h-5 w-20 rounded-full bg-secondary" />
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="grid min-h-0 flex-1 place-items-center rounded-[16px] border border-border/70 bg-gradient-to-br from-background to-secondary/20 p-4">
                    <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:text-left">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ClipboardX className="h-5 w-5 text-primary/40" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-foreground">
                          Belum ada riwayat survei
                        </h4>

                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          Mulai survei pertama Anda untuk membantu kami memahami
                          kondisi ketahanan pangan keluarga Anda.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-hidden rounded-[16px] border border-border/70">
                    <div className="h-full overflow-y-auto">
                      {history.map((h: any) => {
                        const severity = getSeverity(h.score);

                        return (
                          <div
                            key={h.id}
                            className="flex flex-col gap-2 border-b border-border/50 px-3 py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="text-xs text-muted-foreground">
                              {formatDate(h.survey_date)}
                            </span>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">
                                {h.score}/8
                              </span>

                              <Badge
                                variant="outline"
                                className={`rounded-full px-2 py-0.5 text-[10px] ${severity.color}`}
                              >
                                {severity.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Survei FIES"
      subtitle="Survei ketahanan pangan bulanan."
    >
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-4 pb-3 lg:h-[calc(100svh-200px)] lg:max-h-[calc(100svh-200px)] lg:min-h-0 lg:overflow-hidden lg:pb-0">
        <Card className="shrink-0 rounded-[18px] border-border/70 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
          <CardContent className="p-4">
            <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground sm:text-base">
                  Pertanyaan {currentQ + 1} dari {fiesQuestions.length}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Jawab sesuai kondisi 30 hari terakhir.
                </p>
              </div>

              <Badge
                variant="outline"
                className="w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              >
                {Math.round(progress)}%
              </Badge>
            </div>

            <Progress value={progress} className="h-2 rounded-full" />
          </CardContent>
        </Card>

        <div className="grid min-h-0 w-full flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] lg:items-stretch">
          <Card className="flex min-h-0 overflow-hidden rounded-[18px] border-border/70 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
            <CardContent className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="shrink-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                      {currentQ + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="max-w-5xl text-[22px] font-bold leading-tight text-foreground lg:text-[28px]">
                        {fiesQuestions[currentQ]}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Pilih jawaban yang paling sesuai dengan kondisi Anda.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid min-h-0 flex-1 place-items-center py-5">
                  <div className="grid w-full gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => handleAnswer("ya")}
                      aria-label="Jawab ya untuk pertanyaan"
                      className={`group rounded-[20px] border-2 p-4 text-left transition-all ${
                        answers[currentQ] === "ya"
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-lg font-bold leading-tight">
                            Ya
                          </span>

                          <span className="mt-2 block text-sm leading-6">
                            Saya mengalami kondisi tersebut.
                          </span>
                        </div>

                        <span
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                            answers[currentQ] === "ya"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary/40 text-muted-foreground group-hover:border-primary/40"
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAnswer("tidak")}
                      aria-label="Jawab tidak untuk pertanyaan"
                      className={`group rounded-[20px] border-2 p-4 text-left transition-all ${
                        answers[currentQ] === "tidak"
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-lg font-bold leading-tight">
                            Tidak
                          </span>

                          <span className="mt-2 block text-sm leading-6">
                            Saya tidak mengalami kondisi tersebut.
                          </span>
                        </div>

                        <span
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                            answers[currentQ] === "tidak"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary/40 text-muted-foreground group-hover:border-primary/40"
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="shrink-0 border-t border-border/70 pt-4">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="ghost"
                      disabled={currentQ === 0}
                      onClick={() => setCurrentQ(currentQ - 1)}
                      className="h-10 justify-center gap-2 rounded-xl text-sm sm:justify-start"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={submitting}
                      className="h-11 justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}

                      {submitting
                        ? "Mengirim..."
                        : currentQ === fiesQuestions.length - 1
                          ? "Selesai"
                          : "Selanjutnya"}

                      {!submitting && <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-0 overflow-hidden rounded-[18px] border-border/70 shadow-[0_6px_18px_rgba(15,23,42,0.045)]">
            <CardContent className="flex min-h-0 flex-1 flex-col justify-between gap-6 p-5">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-foreground">
                      Progress Survei
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {answers.filter(Boolean).length} dari{" "}
                      {fiesQuestions.length} terjawab
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
                        index === currentQ
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : answer
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] bg-secondary/40 p-4">
                <p className="text-sm font-semibold text-foreground">Catatan</p>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Jawaban Anda digunakan untuk membantu menentukan prioritas
                  bantuan pangan.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SurveiFIES;