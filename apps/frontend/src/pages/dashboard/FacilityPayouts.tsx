import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import {
  approveFacilityPayout, listAdminFacilityPayouts, listVendorFacilityPayouts,
  recordFacilityTransfer, type FacilityPayout,
} from "@/services/facility-payouts";

function dateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default function FacilityPayouts({ admin = false }: { admin?: boolean }) {
  const [rows, setRows] = useState<FacilityPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [references, setReferences] = useState<Record<string, string>>({});
  const [transferTimes, setTransferTimes] = useState<Record<string, string>>({});

  async function refresh() {
    setLoading(true);
    try {
      setRows(await (admin ? listAdminFacilityPayouts() : listVendorFacilityPayouts()));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pencairan");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, [admin]);

  async function approve(row: FacilityPayout) {
    setBusy(row.id);
    try { await approveFacilityPayout(row.id); toast.success("Pencairan disetujui"); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal menyetujui"); }
    finally { setBusy(""); }
  }

  async function record(row: FacilityPayout) {
    const reference = references[row.id]?.trim();
    if (!reference || reference.length < 4) { toast.error("Isi referensi transfer bank minimal 4 karakter"); return; }
    const transferredAt = transferTimes[row.id];
    if (!transferredAt) { toast.error("Isi waktu transfer bank yang sebenarnya"); return; }
    if (!window.confirm("Pastikan transfer bank sudah dilakukan. Catat referensinya sebagai bukti pembayaran?")) return;
    setBusy(row.id);
    try { await recordFacilityTransfer(row.id, reference, new Date(transferredAt).toISOString()); toast.success("Transfer tercatat"); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Gagal mencatat transfer"); }
    finally { setBusy(""); }
  }

  return <DashboardLayout
    title={admin ? "Pencairan Vendor Faskes" : "Pencairan Pesanan Faskes"}
    subtitle={admin ? "Periksa penerimaan Faskes, setujui, dan catat transfer maksimal tiga hari sejak barang tiba." : "Pantau persetujuan dan transfer pesanan yang diterima Faskes."}
    actions={<Button variant="outline" onClick={() => void refresh()} disabled={loading}>Perbarui</Button>}
  >
    <div className="mx-auto max-w-5xl space-y-4">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? <p className="p-6 text-muted-foreground">Memuat pencairan...</p> : rows.length === 0 ? <p className="rounded-xl border bg-white p-8 text-center text-muted-foreground">Belum ada barang diterima Faskes yang menunggu pencairan.</p> : rows.map((row) => <article key={row.id} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-semibold">Pesanan #{row.order_id.slice(0, 8)} · {row.vendor_name || "Vendor"}</h2><p className="text-sm text-muted-foreground">Barang tiba {dateTime(row.arrived_at)} · Dikonfirmasi {dateTime(row.confirmed_at)}</p></div>
          <Badge variant="outline" className={row.overdue || row.late ? "border-red-300 bg-red-50 text-red-800" : ""}>{row.late ? "Terlambat dibayar" : row.overdue ? "Lewat tenggat" : row.status === "paid" ? "Transfer tercatat" : row.status === "approved" ? "Disetujui" : "Perlu persetujuan"}</Badge>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3"><p>Jumlah: <strong>{formatIDR(row.amount)}</strong></p><p>Jatuh tempo: <strong>{dateTime(row.due_at)}</strong></p><p>Status penyaluran: <strong>{row.order_status === "completed" ? "Sudah ke keluarga" : "Di Faskes"}</strong></p></div>
        {row.receipt_notes && <p className="rounded-lg bg-slate-50 p-3 text-sm">Catatan Faskes: {row.receipt_notes}</p>}
        {row.receipt_evidence_url && <a href={row.receipt_evidence_url} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">Lihat bukti penerimaan Faskes</a>}
        <p className="text-sm">Rekening tujuan: {row.bank_name && row.bank_account_number && row.bank_account_holder ? `${row.bank_name} · ${row.bank_account_number} · ${row.bank_account_holder}` : "Belum lengkap"}</p>
        {row.status === "paid" && <p className="text-sm">Transfer {dateTime(row.paid_at)} · Dicatat {dateTime(row.recorded_at)} · Referensi {row.transfer_reference}</p>}
        {admin && row.status === "pending_approval" && <Button disabled={busy === row.id} onClick={() => void approve(row)}>Setujui pencairan</Button>}
        {admin && row.status === "approved" && <div className="flex flex-wrap gap-2"><Input className="max-w-xs" aria-label={`Referensi transfer untuk pesanan ${row.order_id.slice(0, 8)}`} placeholder="Referensi transfer bank" maxLength={120} value={references[row.id] || ""} onChange={(event) => setReferences((current) => ({ ...current, [row.id]: event.target.value }))} /><Input className="max-w-xs" type="datetime-local" aria-label={`Waktu transfer untuk pesanan ${row.order_id.slice(0, 8)}`} value={transferTimes[row.id] || ""} onChange={(event) => setTransferTimes((current) => ({ ...current, [row.id]: event.target.value }))} /><Button disabled={busy === row.id} onClick={() => void record(row)}>Catat transfer yang sudah dilakukan</Button></div>}
      </article>)}
    </div>
  </DashboardLayout>;
}
