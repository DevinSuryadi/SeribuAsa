import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Family } from "@/services/facility-families";

const status: Record<string, { label: string; className: string }> = {
  food_secure: { label: "Ketahanan pangan baik", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  moderate: { label: "Kerentanan pangan sedang", className: "border-amber-200 bg-amber-50 text-amber-700" },
  severe: { label: "Kerentanan pangan tinggi", className: "border-rose-200 bg-rose-50 text-rose-700" },
};

export default function FamilyFoodStatus({ family }: { family: Family }) {
  const latest = family.latest_fies;
  const current = latest ? status[latest.classification] : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className={current?.className || "border-slate-200 bg-slate-50 text-slate-600"}>
        {current?.label || (latest ? latest.classification : "Belum ada survei FIES")}
      </Badge>
      {latest && <span className="text-xs text-muted-foreground">FIES {latest.score}/8 · {formatDate(latest.survey_date)}</span>}
    </div>
  );
}
