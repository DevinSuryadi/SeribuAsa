import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createFamily, updateFamily, type Family, type FamilyInput } from "@/services/facility-families";

const emptyForm = { kk_number: "", head_name: "", address: "", phone: "", family_size: "" };

export default function FamilyForm({ open, onOpenChange, family, onSaved }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family?: Family | null;
  onSaved: (family: Family) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(family ? {
      kk_number: family.kk_number,
      head_name: family.head_name,
      address: family.address || "",
      phone: family.phone || "",
      family_size: family.family_size?.toString() || "",
    } : emptyForm);
  }, [open, family]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[0-9]{16}$/.test(form.kk_number)) {
      toast.error("Nomor KK harus terdiri dari 16 digit angka");
      return;
    }
    if (!form.head_name.trim()) {
      toast.error("Nama kepala keluarga wajib diisi");
      return;
    }
    const size = form.family_size ? Number(form.family_size) : null;
    if (size !== null && (!Number.isInteger(size) || size < 1)) {
      toast.error("Jumlah anggota keluarga harus lebih dari 0");
      return;
    }
    const data: FamilyInput = {
      kk_number: form.kk_number,
      head_name: form.head_name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      family_size: size,
    };
    try {
      setSaving(true);
      const saved = family ? await updateFamily(family.id, data) : await createFamily(data);
      toast.success(family ? "Data keluarga diperbarui" : "Keluarga berhasil didaftarkan");
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan keluarga");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{family ? "Edit Data Keluarga" : "Daftarkan Keluarga"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="family-kk">Nomor Kartu Keluarga</Label>
            <Input id="family-kk" inputMode="numeric" maxLength={16} required value={form.kk_number}
              onChange={(event) => setForm({ ...form, kk_number: event.target.value.replace(/\D/g, "") })}
              placeholder="16 digit nomor KK" />
            <p className="text-xs text-muted-foreground">Nomor KK hanya dapat terdaftar pada satu fasilitas kesehatan.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="family-head">Nama kepala keluarga</Label>
            <Input id="family-head" required maxLength={255} value={form.head_name}
              onChange={(event) => setForm({ ...form, head_name: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="family-address">Alamat</Label>
            <Input id="family-address" value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="family-phone">Nomor telepon</Label>
              <Input id="family-phone" type="tel" maxLength={20} value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="family-size">Jumlah anggota keluarga</Label>
              <Input id="family-size" type="number" min="1" step="1" value={form.family_size}
                onChange={(event) => setForm({ ...form, family_size: event.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {family ? "Simpan Perubahan" : "Daftarkan Keluarga"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
