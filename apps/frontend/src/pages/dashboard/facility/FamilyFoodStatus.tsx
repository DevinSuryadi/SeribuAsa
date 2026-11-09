import { formatDate } from "@/lib/format";
import { fiesStatusConfig, fiesTextClass, type FiesClassification } from "@/lib/status-config";
import type { Family } from "@/services/facility-families";

export default function FamilyFoodStatus({ family }: { family: Family }) {
  const latest = family.latest_fies;
  const classification = (latest?.classification || "unassessed") as FiesClassification;
  const current = latest ? fiesStatusConfig[classification] : null;

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className={`inline-flex items-center text-[13px] font-medium ${fiesTextClass[classification] || fiesTextClass.unassessed}`}>
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
        {current?.label || (latest ? latest.classification : "Belum ada survei FIES")}
      </span>
      {latest && <span className="text-xs text-muted-foreground">FIES {latest.score}/8 · {formatDate(latest.survey_date)}</span>}
    </span>
  );
}
