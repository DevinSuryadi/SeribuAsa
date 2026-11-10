import { useState } from "react";
import { Baby, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localIsoDate } from "@/lib/pregnancy";
import { recordFamilyChildBirth, type FamilyChild } from "@/services/facility-families";

type BirthRecordChild = Pick<
  FamilyChild,
  "id" | "full_name" | "date_of_birth" | "expected_birth_date" | "last_menstrual_period"
> & { gender: string | null };

type BirthRecordDialogProps = {
  familyId: string;
  child: BirthRecordChild;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (child: FamilyChild) => Promise<void> | void;
};

type Gender = "male" | "female";
type FormErrors = { name?: string; date?: string };

const TEMPORARY_NAME_PREFIX = "Bayi Ny.";

function initialValues(child: BirthRecordChild) {
  const today = localIsoDate();
  // A pregnancy past its due date is dated at the expected birth date until confirmed.
  const knownDate = child.date_of_birth ?? child.expected_birth_date;
  return {
    name: child.full_name.startsWith(TEMPORARY_NAME_PREFIX) ? "" : child.full_name,
    date: knownDate && knownDate <= today ? knownDate : today,
    gender: (child.gender === "male" ? "male" : "female") as Gender,
  };
}

export default function BirthRecordDialog({ familyId, child, open, onOpenChange, onSaved }: BirthRecordDialogProps) {
  const [values, setValues] = useState(() => initialValues(child));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const today = localIsoDate();
  const lastPeriod = child.last_menstrual_period ?? "";

  const validate = () => {
    const next: FormErrors = {};
    if (!values.name.trim()) next.name = "Nama anak wajib diisi";
    if (!values.date) next.date = "Tanggal lahir wajib diisi";
    else if (values.date > today) next.date = "Tanggal lahir tidak boleh di masa depan";
    else if (lastPeriod && values.date <= lastPeriod) next.date = "Tanggal lahir harus setelah HPHT";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const born = await recordFamilyChildBirth(familyId, child.id, {
        full_name: values.name.trim(),
        date_of_birth: values.date,
        gender: values.gender,
      });
      toast.success("Data kelahiran berhasil disimpan");
      onOpenChange(false);
      await onSaved(born);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan data kelahiran");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) { setValues(initialValues(child)); setErrors({}); }
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" /> Catat Kelahiran — {child.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Riwayat pemeriksaan kehamilan tetap tersimpan. Setelah data kelahiran disimpan,
            pemantauan dilanjutkan dengan pengukuran balita.
          </p>
          <div>
            <Label htmlFor="birth-name">Nama Lengkap Anak</Label>
            <Input
              id="birth-name"
              value={values.name}
              onChange={(e) => { setValues((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="Contoh: Budi Santoso"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="birth-date" className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Tanggal Lahir</Label>
            <Input
              id="birth-date"
              type="date"
              value={values.date}
              min={lastPeriod || undefined}
              max={today}
              onChange={(e) => { setValues((p) => ({ ...p, date: e.target.value })); setErrors((p) => ({ ...p, date: undefined })); }}
            />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
          </div>
          <div>
            <Label>Jenis Kelamin</Label>
            <Select value={values.gender} onValueChange={(v: Gender) => setValues((p) => ({ ...p, gender: v }))}>
              <SelectTrigger aria-label="Jenis Kelamin"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Laki-laki</SelectItem>
                <SelectItem value="female">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitting ? "Menyimpan..." : "Simpan Data Kelahiran"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
