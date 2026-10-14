import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveFacility, listAdminFacilities, rejectFacility, type AdminFacility } from "@/services/admin-facilities";

export default function AdminFacilities() {
  const [rows, setRows] = useState<AdminFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  async function refresh() {
    setLoading(true);
    try { setRows(await listAdminFacilities()); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat Faskes"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  async function decide(row: AdminFacility, approved: boolean) {
    const reason = reasons[row.id]?.trim() || "";
    if (!approved && reason.length < 5) { toast.error("Alasan penolakan minimal 5 karakter"); return; }
    if (!window.confirm(approved ? `Setujui Faskes ${row.name}?` : `Tolak Faskes ${row.name}?`)) return;
    setBusy(row.id);
    try {
      await (approved ? approveFacility(row.id) : rejectFacility(row.id, reason));
      toast.success(approved ? "Faskes disetujui" : "Faskes ditolak");
      await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Keputusan gagal"); }
    finally { setBusy(""); }
  }
  const pending = rows.filter((row) => row.approval_status === "pending");
  return <DashboardLayout title="Verifikasi Faskes" subtitle="Setujui fasilitas kesehatan sebelum dapat mengelola keluarga, melakukan asesmen, dan memesan bantuan." actions={<Button variant="outline" onClick={() => void refresh()} disabled={loading}>Perbarui</Button>}>
    <div className="mx-auto max-w-4xl space-y-4">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? <p className="p-5 text-muted-foreground">Memuat Faskes...</p> : <>
        <h2 className="font-semibold">Menunggu verifikasi ({pending.length})</h2>
        {pending.length === 0 && <p className="rounded-xl border bg-white p-5 text-muted-foreground">Tidak ada Faskes yang menunggu verifikasi.</p>}
        {pending.map((row) => <article key={row.id} className="space-y-3 rounded-xl border bg-white p-5"><div><h3 className="font-semibold">{row.name}</h3><p className="text-sm text-muted-foreground">{row.facility_type || "Fasilitas kesehatan"} · {row.address || "Alamat belum diisi"} · {row.phone || "Telepon belum diisi"}</p></div><Textarea aria-label={`Alasan penolakan ${row.name}`} placeholder="Alasan bila ditolak" maxLength={1000} value={reasons[row.id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [row.id]: event.target.value }))} /><div className="flex gap-2"><Button disabled={busy === row.id} onClick={() => void decide(row, true)}>Setujui</Button><Button variant="outline" disabled={busy === row.id} onClick={() => void decide(row, false)}>Tolak</Button></div></article>)}
        {rows.some((row) => row.approval_status !== "pending") && <><h2 className="pt-3 font-semibold">Riwayat</h2>{rows.filter((row) => row.approval_status !== "pending").map((row) => <div key={row.id} className="rounded-xl border bg-white p-4 text-sm"><strong>{row.name}</strong> · {row.approval_status === "approved" ? "Disetujui" : "Ditolak"}{row.review_reason && <p className="mt-1 text-muted-foreground">{row.review_reason}</p>}</div>)}</>}
      </>}
    </div>
  </DashboardLayout>;
}
