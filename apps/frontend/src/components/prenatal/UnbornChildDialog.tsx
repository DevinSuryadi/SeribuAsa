import { useState } from "react";
import { Baby, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import { PREGNANCY_LENGTH_DAYS, addDays, expectedBirthDate, gestationalWeeks, localIsoDate } from "@/lib/pregnancy";
import { addFamilyUnbornChild, type FamilyChild } from "@/services/facility-families";

type UnbornChildDialogProps = {
  familyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (child: FamilyChild) => Promise<void> | void;
};

type FormErrors = { motherName?: string; lastPeriod?: string };

export default function UnbornChildDialog({ familyId, open, onOpenChange, onSaved }: UnbornChildDialogProps) {
  const [motherName, setMotherName] = useState("");
  const [lastPeriod, setLastPeriod] = useState("");
  const [childName, setChildName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const today = localIsoDate();
  // The pregnancy must still be ongoing, so the HPHT is at most 279 days ago.
  const earliestLastPeriod = addDays(today, 1 - PREGNANCY_LENGTH_DAYS);

  const reset = () => {
    setMotherName("");
    setLastPeriod("");
    setChildName("");
    setErrors({});
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!motherName.trim()) next.motherName = "Nama ibu wajib diisi";
    if (!lastPeriod) next.lastPeriod = "HPHT wajib diisi";
    else if (lastPeriod > today) next.lastPeriod = "HPHT tidak boleh di masa depan";
    else if (lastPeriod < earliestLastPeriod) {
      next.lastPeriod = "Usia kehamilan sudah mencapai 40 minggu. Daftarkan anak melalui formulir Tambah Anak.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const child = await addFamilyUnbornChild(familyId, {
        mother_name: motherName.trim(),
        last_menstrual_period: lastPeriod,
        full_name: childName.trim() || undefined,
      });
      toast.success("Anak dalam kandungan berhasil ditambahkan");
      reset();
      onOpenChange(false);
      await onSaved(child);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan anak dalam kandungan");
    } finally {
      setSubmitting(false);
    }
  };

  const showTimeline = Boolean(lastPeriod) && lastPeriod <= today && lastPeriod >= earliestLastPeriod;

  return (
    <Dialog open={open} onOpenChange={(next: boolean) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" /> Tambah Anak dalam Kandungan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="unborn-mother-name">Nama Ibu</Label>
            <Input
              id="unborn-mother-name"
              value={motherName}
              onChange={(e) => { setMotherName(e.target.value); setErrors((p) => ({ ...p, motherName: undefined })); }}
              placeholder="Contoh: Siti Aminah"
            />
            {errors.motherName && <p className="text-xs text-destructive mt-1">{errors.motherName}</p>}
          </div>
          <div>
            <Label htmlFor="unborn-last-period" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Hari Pertama Haid Terakhir (HPHT)
            </Label>
            <Input
              id="unborn-last-period"
              type="date"
              value={lastPeriod}
              min={earliestLastPeriod}
              max={today}
              onChange={(e) => { setLastPeriod(e.target.value); setErrors((p) => ({ ...p, lastPeriod: undefined })); }}
            />
            {errors.lastPeriod && <p className="text-xs text-destructive mt-1">{errors.lastPeriod}</p>}
            {showTimeline && (
              <p className="text-xs text-muted-foreground mt-1">
                Usia kehamilan {gestationalWeeks(lastPeriod, today)} minggu · Perkiraan lahir {formatDate(expectedBirthDate(lastPeriod))}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="unborn-child-name">Nama Anak — Opsional</Label>
            <Input
              id="unborn-child-name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder={motherName.trim() ? `Bayi Ny. ${motherName.trim()}` : "Contoh: Bayi Ny. Siti Aminah"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Jika belum ditentukan, sistem menggunakan nama sementara Bayi Ny. diikuti nama ibu.
            </p>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitting ? "Menyimpan..." : "Tambah Anak dalam Kandungan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
