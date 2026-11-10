import { AlertCircle, Heart, ShieldCheck, type LucideIcon } from "lucide-react";
import type { PrenatalClassification } from "@/services/facility-families";

export type PrenatalStatusStyle = {
  label: string;
  cls: string;
  bg: string;
  border: string;
  desc: string;
  icon: LucideIcon;
};

// Same badge palette as the toddler nutrition status.
export const prenatalStatusConfig: Record<PrenatalClassification, PrenatalStatusStyle> = {
  normal: {
    label: "Normal", cls: "text-green-700", bg: "bg-green-50", border: "border-green-200",
    desc: "Hasil pemeriksaan sesuai acuan", icon: ShieldCheck,
  },
  kek_risk: {
    label: "Risiko KEK", cls: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200",
    desc: "Ibu memerlukan dukungan gizi tambahan", icon: AlertCircle,
  },
  needs_review: {
    label: "Perlu Pemeriksaan Lanjut", cls: "text-red-700", bg: "bg-red-50", border: "border-red-200",
    desc: "Tinjau hasil bersama tenaga kesehatan", icon: Heart,
  },
};

export const formatOptional = (value: number | null | undefined, unit: string) =>
  value === null || value === undefined ? "-" : `${value} ${unit}`;
