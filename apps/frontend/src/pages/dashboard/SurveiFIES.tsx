import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { submitFies, getFiesHistory } from '@/services/fies';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

const fiesQuestions = [
  'Dalam 30 hari terakhir, apakah Anda khawatir makanan akan habis sebelum bisa membeli lagi?',
  'Dalam 30 hari terakhir, apakah Anda tidak bisa makan makanan sehat dan bergizi?',
  'Dalam 30 hari terakhir, apakah Anda hanya makan beberapa jenis makanan saja?',
  'Dalam 30 hari terakhir, apakah Anda harus melewatkan makan karena tidak ada makanan?',
  'Dalam 30 hari terakhir, apakah Anda makan lebih sedikit dari yang seharusnya?',
  'Dalam 30 hari terakhir, apakah rumah Anda kehabisan makanan?',
  'Dalam 30 hari terakhir, apakah Anda lapar tapi tidak makan karena tidak cukup makanan?',
  'Dalam 30 hari terakhir, apakah Anda tidak makan seharian penuh karena tidak cukup makanan?',
];

type Answer = 'ya' | 'tidak' | null;

const getSeverity = (s: number) => {
  if (s <= 2) return { label: 'Ketahanan Pangan Baik', color: 'bg-primary/10 text-primary border-primary/20', desc: 'Ketahanan pangan Anda dalam kondisi baik.' };
  if (s <= 5) return { label: 'Ketahanan Pangan Sedang', color: 'bg-accent/10 text-accent-foreground border-accent/20', desc: 'Ada indikasi kerawanan pangan sedang. Anda akan mendapat prioritas bantuan.' };
  return { label: 'Ketahanan Pangan Buruk', color: 'bg-destructive/10 text-destructive border-destructive/20', desc: 'Terdeteksi kerawanan pangan serius. Bantuan Anda akan diprioritaskan segera.' };
};

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
  const score = answers.filter((a) => a === 'ya').length;

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
      toast.error('Pilih jawaban', { description: 'Silakan pilih Ya atau Tidak' });
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
    // setError(null);

    try {
      const responses: Record<string, number> = {};
      answers.forEach((a, i) => {
        responses[`q${i + 1}`] = a === 'ya' ? 1 : 0;
      });

      const res = await submitFies({ responses });
      if (res.success) {
        setCompleted(true);
        toast.success('Survei berhasil dikirim!');
      }
    } catch (err: any) {
      // setError(err.message || 'Gagal mengirim survei');
      toast.error(err.message || 'Gagal mengirim survei');
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    const severity = getSeverity(score);
    return (
      <DashboardLayout title="Survei FIES" subtitle="Survei ketahanan pangan bulanan.">
        <div className="max-w-lg mx-auto space-y-6">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Survei Selesai!</h2>
              <p className="text-muted-foreground">Terima kasih telah mengisi survei ketahanan pangan bulan ini.</p>

              <div className="rounded-xl border border-border bg-secondary/30 p-6 space-y-3">
                <div className="text-sm text-muted-foreground">Skor FIES Anda</div>
                <div className="text-4xl font-extrabold text-foreground">{score} / 8</div>
                <Badge className={`text-sm py-1 px-4 ${severity.color}`}>{severity.label}</Badge>
                <p className="text-sm text-muted-foreground">{severity.desc}</p>
              </div>

              {score > 5 && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex items-start gap-3 text-left">
                  <AlertTriangle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground text-sm">Bantuan Diprioritaskan</div>
                    <p className="text-xs text-muted-foreground">Berdasarkan skor FIES Anda, alokasi voucher nutrisi akan diprioritaskan untuk keluarga Anda.</p>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={() => navigate('/dashboard/beneficiary')}>
                Kembali ke Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!started) {
    return (
      <DashboardLayout title="Survei FIES" subtitle="Survei ketahanan pangan bulanan.">
        <div className="max-w-lg mx-auto space-y-6">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Survei Ketahanan Pangan (FIES)</h2>
                <p className="text-muted-foreground mt-2">Survei bulanan untuk mengukur tingkat ketahanan pangan keluarga Anda.</p>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm"><Info className="h-4 w-4 text-primary" /> <span className="font-medium text-foreground">Tentang survei ini</span></div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                  <li>• 8 pertanyaan singkat</li>
                  <li>• Waktu pengerjaan: ~3 menit</li>
                  <li>• Jawab berdasarkan 30 hari terakhir</li>
                  <li>• Wajib diisi setiap bulan (tanggal 1-7)</li>
                  <li>• Hasil menentukan prioritas bantuan</li>
                </ul>
              </div>

              <Button className="w-full" onClick={() => setStarted(true)}>
                Mulai Survei
              </Button>
            </CardContent>
          </Card>

          {/* Survey History */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Riwayat Survei</CardTitle></CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="h-4 w-24 bg-secondary rounded" />
                      <div className="h-6 w-16 bg-secondary rounded" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat survei</p>
              ) : (
                history.map((h: any) => {
                  const severity = getSeverity(h.score);
                  return (
                    <div key={h.id} className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
                      <span className="text-sm text-muted-foreground">{formatDate(h.survey_date)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{h.score}/8</span>
                        <Badge variant="outline" className={severity.color}>{severity.label}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Survei FIES" subtitle="Survei ketahanan pangan bulanan.">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Pertanyaan {currentQ + 1} dari {fiesQuestions.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 space-y-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                {currentQ + 1}
              </div>
              <p className="text-lg font-medium text-foreground leading-relaxed">{fiesQuestions[currentQ]}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer('ya')}
                aria-label="Jawab ya untuk pertanyaan"
                className={`rounded-xl border-2 p-4 text-center font-medium transition-all ${
                  answers[currentQ] === 'ya'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                Ya
              </button>
              <button
                onClick={() => handleAnswer('tidak')}
                aria-label="Jawab tidak untuk pertanyaan"
                className={`rounded-xl border-2 p-4 text-center font-medium transition-all ${
                  answers[currentQ] === 'tidak'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                Tidak
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </Button>
              <Button onClick={handleNext} disabled={submitting} className="gap-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Mengirim...' : currentQ === fiesQuestions.length - 1 ? 'Selesai' : 'Selanjutnya'}
                {!submitting && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SurveiFIES;
