import { useState } from "react";
import { Activity, AlertCircle, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gestationalWeeks, localIsoDate } from "@/lib/pregnancy";
import {
  addFamilyPrenatalMeasurement,
  type FamilyChild,
  type PrenatalMeasurementInput,
} from "@/services/facility-families";

type PrenatalMeasurementDialogProps = {
  familyId: string;
  child: Pick<FamilyChild, "id" | "full_name" | "last_menstrual_period"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void> | void;
};

type FieldKey = "date" | "weight" | "muac" | "fundal" | "heartRate" | "fetalWeight";

const emptyForm: Record<FieldKey, string> = {
  date: "", weight: "", muac: "", fundal: "", heartRate: "", fetalWeight: "",
};

// Ranges reject typing mistakes; clinical thresholds are evaluated by the server.
const limits: Record<Exclude<FieldKey, "date">, { max: number; message: string }> = {
  weight: { max: 200, message: "Berat badan ibu harus lebih dari 0 dan paling tinggi 200 kg" },
  muac: { max: 60, message: "LiLA ibu harus lebih dari 0 dan paling tinggi 60 cm" },
  fundal: { max: 60, message: "Tinggi fundus uteri harus lebih dari 0 dan paling tinggi 60 cm" },
  heartRate: { max: 250, message: "Denyut jantung janin harus lebih dari 0 dan paling tinggi 250 kali per menit" },
  fetalWeight: { max: 6000, message: "Taksiran berat janin harus lebih dari 0 dan paling tinggi 6.000 gram" },
};

export default function PrenatalMeasurementDialog({
  familyId, child, open, onOpenChange, onSaved,
}: PrenatalMeasurementDialogProps) {
  const today = localIsoDate();
  const [form, setForm] = useState<Record<FieldKey, string>>({ ...emptyForm, date: today });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const lastPeriod = child?.last_menstrual_period ?? "";

  const update = (key: FieldKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const reset = () => {
    setForm({ ...emptyForm, date: localIsoDate() });
    setErrors({});
  };

  const validate = () => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!form.date) next.date = "Tanggal pemeriksaan wajib diisi";
    else if (form.date > today) next.date = "Tanggal tidak boleh di masa depan";
    else if (lastPeriod && form.date < lastPeriod) next.date = "Tanggal pemeriksaan tidak boleh sebelum HPHT";

    (Object.keys(limits) as Array<keyof typeof limits>).forEach((key) => {
      const required = key === "weight" || key === "muac";
      if (!form[key]) {
        if (required) next[key] = key === "weight" ? "Berat badan ibu wajib diisi" : "LiLA ibu wajib diisi";
        return;
      }
      const value = Number(form[key]);
      if (Number.isNaN(value) || value <= 0 || value > limits[key].max) next[key] = limits[key].message;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!child || !validate()) return;
    const optional = (value: string) => (value ? Number(value) : undefined);
    const payload: PrenatalMeasurementInput = {
      measurement_date: form.date,
      maternal_weight: Number(form.weight),
      maternal_muac: Number(form.muac),
      fundal_height: optional(form.fundal),
      fetal_heart_rate: optional(form.heartRate),
      estimated_fetal_weight: optional(form.fetalWeight),
    };
    setSubmitting(true);
    try {
      await addFamilyPrenatalMeasurement(familyId, child.id, payload);
      toast.success("Data pemeriksaan kehamilan berhasil disimpan");
      reset();
      onOpenChange(false);
      await onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pemeriksaan kehamilan");
    } finally {
      setSubmitting(false);
    }
  };

  const error = (key: FieldKey) => errors[key] && <p className="text-xs text-destructive mt-1">{errors[key]}</p>;

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Input Pemeriksaan Kehamilan — {child?.full_name || "Anak"}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
          <div className="flex gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-bold">Pastikan data pemeriksaan sudah tepat</p>
              <p className="mt-1 text-xs leading-relaxed">
                Data yang sudah disimpan tidak bisa diedit. Periksa kembali tanggal dan hasil
                pemeriksaan sebelum menekan tombol simpan.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="prenatal-date" className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Tanggal Pemeriksaan</Label>
            <Input id="prenatal-date" type="date" value={form.date} min={lastPeriod || undefined} max={today} onChange={(e) => update("date", e.target.value)} />
            {error("date")}
            {lastPeriod && form.date && form.date >= lastPeriod && form.date <= today && (
              <p className="text-xs text-muted-foreground mt-1">Usia kehamilan pada tanggal ini: {gestationalWeeks(lastPeriod, form.date)} minggu</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="prenatal-weight">Berat Badan Ibu (kg)</Label>
              <Input id="prenatal-weight" type="number" value={form.weight} onChange={(e) => update("weight", e.target.value)} placeholder="0.0" step="0.1" min="0.1" max="200" />
              {error("weight")}
            </div>
            <div>
              <Label htmlFor="prenatal-muac">LiLA Ibu (cm)</Label>
              <Input id="prenatal-muac" type="number" value={form.muac} onChange={(e) => update("muac", e.target.value)} placeholder="0.0" step="0.1" min="0.1" max="60" />
              {error("muac")}
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">LiLA di bawah 23,5 cm menandakan risiko kurang energi kronis (KEK).</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="prenatal-fundal">Tinggi Fundus Uteri (cm) — Opsional</Label>
              <Input id="prenatal-fundal" type="number" value={form.fundal} onChange={(e) => update("fundal", e.target.value)} placeholder="0.0" step="0.1" min="0.1" max="60" />
              {error("fundal")}
            </div>
            <div>
              <Label htmlFor="prenatal-heart-rate">Denyut Jantung Janin (/menit) — Opsional</Label>
              <Input id="prenatal-heart-rate" type="number" value={form.heartRate} onChange={(e) => update("heartRate", e.target.value)} placeholder="0" step="1" min="1" max="250" />
              {error("heartRate")}
            </div>
          </div>
          <div>
            <Label htmlFor="prenatal-fetal-weight">Taksiran Berat Janin (gram) — Opsional</Label>
            <Input id="prenatal-fetal-weight" type="number" value={form.fetalWeight} onChange={(e) => update("fetalWeight", e.target.value)} placeholder="0" step="1" min="1" max="6000" />
            <p className="text-xs text-muted-foreground mt-1">Diisi apabila tersedia hasil pemeriksaan USG.</p>
            {error("fetalWeight")}
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting || !child}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitting ? "Menyimpan..." : "Simpan Pemeriksaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
