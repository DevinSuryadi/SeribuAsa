import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronLeft, ChevronRight, Ruler, Scale, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { PrenatalMeasurement } from "@/services/facility-families";

const POINTS_PER_PAGE = 10;
// Fundal height in cm roughly equals gestational age in weeks between week 20 and 36.
const FUNDAL_RULE_WEEKS = { from: 20, to: 36 };

const axisTick = { fill: "hsl(220,10%,46%)", fontSize: 11 };
const tooltipStyle = { background: "hsl(0,0%,100%)", border: "1px solid hsl(220,15%,90%)", borderRadius: 12 };
const lineColor = "hsl(152,55%,33%)";
const referenceColor = "hsl(220,10%,65%)";

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(value));

type ChartPoint = {
  dateLabel: string;
  fullDate: string;
  fundalHeight: number | null;
  fundalReference: number | null;
  maternalWeight: number;
};

function ChartPanel({
  icon: Icon,
  title,
  data,
  dataKey,
  referenceKey,
}: {
  icon: typeof Scale;
  title: string;
  data: ChartPoint[];
  dataKey: keyof ChartPoint;
  referenceKey?: keyof ChartPoint;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background p-3 sm:p-4">
      <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-primary" />
            Pengukuran
          </span>
          {referenceKey && (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full bg-muted-foreground/40" />
              Acuan usia kehamilan
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="dateLabel" interval={0} tick={axisTick} />
          <YAxis tick={axisTick} />
          <Tooltip labelFormatter={(_, items) => items?.[0]?.payload?.fullDate || ""} contentStyle={tooltipStyle} />
          {referenceKey && (
            <Line type="monotone" dataKey={referenceKey} name="Acuan" stroke={referenceColor} strokeWidth={2} strokeDasharray="5 5" dot={false} />
          )}
          <Line type="monotone" dataKey={dataKey} name="Pengukuran" stroke={lineColor} strokeWidth={2.5} dot={{ fill: lineColor, r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type PrenatalGrowthChartsProps = {
  childName: string;
  measurements: PrenatalMeasurement[];
};

export default function PrenatalGrowthCharts({ childName, measurements }: PrenatalGrowthChartsProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(measurements.length / POINTS_PER_PAGE);

  // Measurements arrive newest first; each page is drawn oldest to newest.
  const data = useMemo<ChartPoint[]>(() => {
    const start = page * POINTS_PER_PAGE;
    return measurements.slice(start, start + POINTS_PER_PAGE).reverse().map((m) => {
      const withinRule = m.gestational_age_weeks >= FUNDAL_RULE_WEEKS.from && m.gestational_age_weeks <= FUNDAL_RULE_WEEKS.to;
      return {
        dateLabel: formatShortDate(m.measurement_date),
        fullDate: `${formatDate(m.measurement_date)} · ${m.gestational_age_weeks} minggu`,
        fundalHeight: m.fundal_height,
        fundalReference: withinRule ? m.gestational_age_weeks : null,
        maternalWeight: m.maternal_weight,
      };
    });
  }, [measurements, page]);

  if (data.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm sm:rounded-3xl">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Grafik Perkembangan Kehamilan — {childName}
            </CardTitle>
            <CardDescription className="text-xs">
              Perkembangan tinggi fundus uteri dan berat badan ibu berdasarkan tanggal pemeriksaan.
            </CardDescription>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" className="h-8 w-8 rounded-lg p-0"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">{page + 1}/{totalPages}</span>
              <Button
                variant="outline" size="sm" className="h-8 w-8 rounded-lg p-0"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="grid gap-4 xl:grid-cols-2 xl:gap-6">
          <ChartPanel icon={Ruler} title="Tinggi Fundus Uteri (cm)" data={data} dataKey="fundalHeight" referenceKey="fundalReference" />
          <ChartPanel icon={Scale} title="Berat Badan Ibu (kg)" data={data} dataKey="maternalWeight" />
        </div>
      </CardContent>
    </Card>
  );
}
