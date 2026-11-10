import { Activity, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { PrenatalMeasurement } from "@/services/facility-families";
import { formatOptional, prenatalStatusConfig } from "./prenatal-status";

const VISIBLE_ROWS = 8;

type PrenatalHistoryCardProps = {
  childName: string;
  measurements: PrenatalMeasurement[];
  onAdd?: () => void;
};

export default function PrenatalHistoryCard({ childName, measurements, onAdd }: PrenatalHistoryCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm sm:rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Activity className="h-4 w-4 text-primary" />
              Riwayat Pemeriksaan Kehamilan
            </CardTitle>
            <CardDescription className="text-xs">
              {childName} — {measurements.length} data
            </CardDescription>
          </div>
          {onAdd && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-xl px-4 text-xs font-semibold"
              onClick={onAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-y border-border bg-secondary/30">
                {["Tanggal", "Usia Kehamilan", "BB Ibu (kg)", "LiLA (cm)", "TFU (cm)", "DJJ (/menit)", "TBJ (gram)", "Status"].map((label) => (
                  <th key={label} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {measurements.slice(0, VISIBLE_ROWS).map((m) => {
                const cfg = prenatalStatusConfig[m.classification];
                return (
                  <tr key={m.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/20">
                    <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(m.measurement_date)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-foreground">{m.gestational_age_weeks} minggu</td>
                    <td className="px-5 py-4 text-sm font-bold text-foreground">{m.maternal_weight} kg</td>
                    <td className="px-5 py-4 text-sm font-bold text-foreground">{m.maternal_muac} cm</td>
                    <td className="px-5 py-4 text-sm font-bold text-foreground">{formatOptional(m.fundal_height, "cm")}</td>
                    <td className="px-5 py-4 text-sm font-bold text-foreground">{formatOptional(m.fetal_heart_rate, "/menit")}</td>
                    <td className="px-5 py-4 text-sm font-bold text-foreground">{formatOptional(m.estimated_fetal_weight, "g")}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`rounded-full border px-3 text-[10px] ${cfg.bg} ${cfg.cls} ${cfg.border}`}
                        title={m.findings.join(" ")}
                      >
                        {cfg.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {measurements.length > VISIBLE_ROWS && (
          <div className="border-t border-border/60 px-5 py-3 text-center text-xs text-muted-foreground">
            Dan {measurements.length - VISIBLE_ROWS} data lainnya.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
