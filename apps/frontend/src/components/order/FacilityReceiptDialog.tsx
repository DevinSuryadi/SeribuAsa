import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confirmFacilityReceipt, type FacilityOrder } from "@/services/facility-orders";
import { uploadImage } from "@/services/upload";

function localDateTime(value: Date) {
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 19);
}

export default function FacilityReceiptDialog({ order, onClose, onSaved }: {
  order: FacilityOrder | null;
  onClose: () => void;
  onSaved: (order: FacilityOrder) => void;
}) {
  const [arrivedAt, setArrivedAt] = useState("");
  const [complete, setComplete] = useState(true);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!order) return;
    setArrivedAt(order.arrived_at ? localDateTime(new Date(order.arrived_at)) : localDateTime(new Date()));
    setComplete(order.receipt_status !== "discrepancy");
    setNotes("");
    setPhoto(null);
  }, [order]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!order || busy) return;
    if (!complete && !notes.trim()) { toast.error("Jelaskan barang yang bermasalah"); return; }
    if (photo && (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024)) {
      toast.error("Foto harus JPG, PNG, atau WebP dan maksimal 5 MB"); return;
    }
    setBusy(true);
    try {
      let evidenceUrl: string | undefined;
      if (photo) {
        const uploaded = await uploadImage(photo, "facility_receipt_evidence");
        if (uploaded.error || !uploaded.url) throw new Error(uploaded.error || "Foto gagal diunggah");
        evidenceUrl = uploaded.url;
      }
      const saved = await confirmFacilityReceipt(order.id, {
        arrived_at: order.arrived_at || new Date(arrivedAt).toISOString(),
        items_complete: complete,
        evidence_url: evidenceUrl,
        notes: notes.trim() || undefined,
      });
      toast.success(complete ? "Barang diterima lengkap. Pencairan Vendor menunggu persetujuan Admin." : "Ketidaksesuaian barang dicatat. Pencairan ditahan.");
      onSaved(saved);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mencatat penerimaan");
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open={Boolean(order)} onOpenChange={(open: boolean) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Konfirmasi barang tiba di Faskes</DialogTitle>
        <p className="text-sm text-muted-foreground">Periksa jenis dan jumlah barang sebelum menerima. Batas transfer Vendor dihitung tiga hari sejak waktu barang tiba.</p>
      </DialogHeader>
      {order && <form className="space-y-4" onSubmit={submit}>
        <ul className="rounded-lg border p-3 text-sm">{order.items.map((item) => <li key={item.product_id}>{item.quantity}× {item.product_name}</li>)}</ul>
        <div className="space-y-1"><Label htmlFor="receipt-arrival">Waktu barang tiba</Label><Input id="receipt-arrival" type="datetime-local" step="1" required value={arrivedAt} disabled={Boolean(order.arrived_at)} onChange={(event) => setArrivedAt(event.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="receipt-condition">Hasil pemeriksaan</Label><select id="receipt-condition" className="h-10 w-full rounded-md border px-3 text-sm" value={complete ? "complete" : "discrepancy"} onChange={(event) => setComplete(event.target.value === "complete")}><option value="complete">Barang sesuai dan lengkap</option><option value="discrepancy">Ada barang kurang, rusak, atau tidak sesuai</option></select></div>
        <div className="space-y-1"><Label htmlFor="receipt-notes">Catatan {complete ? "(opsional)" : "(wajib)"}</Label><Textarea id="receipt-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} placeholder={complete ? "Kondisi barang saat tiba" : "Sebutkan barang dan jumlah yang bermasalah"} /></div>
        <div className="space-y-1"><Label htmlFor="receipt-photo">Foto barang saat tiba (opsional)</Label><Input id="receipt-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Batal</Button><Button type="submit" disabled={busy || !arrivedAt || (!complete && !notes.trim())}>{busy ? "Menyimpan..." : "Simpan pemeriksaan"}</Button></div>
      </form>}
    </DialogContent>
  </Dialog>;
}
