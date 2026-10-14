import { useEffect, useState } from "react";
import { Camera, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { distributeFacilityOrder, type FacilityOrder } from "@/services/facility-orders";
import { uploadImage } from "@/services/upload";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function FacilityDistributionDialog({ order, onClose, onDistributed }: {
  order: FacilityOrder | null;
  onClose: () => void;
  onDistributed: (order: FacilityOrder) => void;
}) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientRelation, setRecipientRelation] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [itemsComplete, setItemsComplete] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setRecipientName("");
    setRecipientRelation("");
    setNotes("");
    setPhoto(null);
    setItemsComplete(false);
  }, [order]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!order || saving) return;
    if (order.receipt_status !== "accepted") { toast.error("Konfirmasi barang diterima lengkap oleh Faskes terlebih dahulu"); return; }
    if (!recipientName.trim()) { toast.error("Nama penerima wajib diisi"); return; }
    if (!photo) { toast.error("Foto bukti penyaluran wajib diunggah"); return; }
    if (!itemsComplete) { toast.error("Pastikan seluruh barang sudah diserahkan"); return; }
    if (!photo.type.startsWith("image/") || photo.size > MAX_PHOTO_SIZE) {
      toast.error("Gunakan foto JPG, PNG, atau WebP berukuran maksimal 5 MB");
      return;
    }

    setSaving(true);
    try {
      const uploaded = await uploadImage(photo, "distribution_evidence");
      if (uploaded.error || !uploaded.url) throw new Error(uploaded.error || "Foto bukti gagal diunggah");
      const updated = await distributeFacilityOrder(order.id, {
        recipient_name: recipientName.trim(),
        recipient_relation: recipientRelation || undefined,
        evidence_url: uploaded.url,
        items_complete: true,
        notes: notes.trim() || undefined,
      });
      toast.success(`Bantuan untuk ${order.family_name || "keluarga"} berhasil dicatat`);
      onDistributed(updated);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mencatat penyaluran");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open: boolean) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary" /> Unggah Bukti Penerimaan</DialogTitle>
          <p className="text-sm text-muted-foreground">Isi setelah seluruh bantuan diserahkan kepada {order?.family_name || "keluarga tujuan"}. Penyimpanan bukti sekaligus menyelesaikan penyaluran.</p>
        </DialogHeader>
        {order && <form className="space-y-4" onSubmit={submit}>
          <div className="rounded-xl bg-secondary/30 p-4">
            <p className="mb-2 text-sm font-semibold">Barang yang diserahkan</p>
            <ul className="space-y-1 text-sm text-muted-foreground">{order.items.map((item) => <li key={item.product_id}>{item.quantity}× {item.product_name}</li>)}</ul>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distribution-recipient">Nama penerima</Label>
            <Input id="distribution-recipient" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} maxLength={255} required placeholder="Nama anggota keluarga yang menerima" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distribution-relation">Hubungan dengan kepala keluarga</Label>
            <select id="distribution-relation" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={recipientRelation} onChange={(event) => setRecipientRelation(event.target.value)}>
              <option value="">Pilih hubungan (opsional)</option>
              <option value="Kepala keluarga">Kepala keluarga</option>
              <option value="Pasangan">Pasangan</option>
              <option value="Anak dewasa">Anak dewasa</option>
              <option value="Wali keluarga">Wali keluarga</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distribution-photo">Foto bukti penerimaan</Label>
            <label htmlFor="distribution-photo" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary hover:bg-primary/10">
              <Camera className="h-5 w-5" />
              <span>{photo ? photo.name : "Ambil atau pilih foto saat bantuan diterima"}</span>
            </label>
            <input id="distribution-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground">JPG, PNG, atau WebP maksimal 5 MB. Foto barang bersama penerima atau pendamping; wajah tidak wajib terlihat jelas.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distribution-notes">Catatan (opsional)</Label>
            <Textarea id="distribution-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} placeholder="Contoh: bantuan diterima lengkap dan dalam kondisi baik" />
          </div>
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={itemsComplete} onChange={(event) => setItemsComplete(event.target.checked)} />
            <span>Saya memastikan seluruh barang telah diterima oleh keluarga yang tercantum.</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
            <Button type="submit" disabled={saving || !recipientName.trim() || !photo || !itemsComplete}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{saving ? "Menyimpan..." : "Simpan Bukti"}</Button>
          </div>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
