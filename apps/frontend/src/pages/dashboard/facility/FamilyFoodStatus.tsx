import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { fiesStatusConfig, type FiesClassification } from "@/lib/status-config";
import type { Family } from "@/services/facility-families";

export default function FamilyFoodStatus({ family }: { family: Family }) {
  const latest = family.latest_fies;
  const current = latest ? fiesStatusConfig[latest.classification as FiesClassification] : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className={current?.className || fiesStatusConfig.unassessed.className}>
        {current?.label || (latest ? latest.classification : "Belum ada survei FIES")}
      </Badge>
      {latest && <span className="text-xs text-muted-foreground">FIES {latest.score}/8 · {formatDate(latest.survey_date)}</span>}
    </div>
  );
}
