import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { QrCameraScanner } from "@/components/vendor/QrCameraScanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import { listFacilityOrders, previewFacilityHandover, receiveFacilityOrder, type FacilityOrder } from "@/services/facility-orders";
import { ArrowLeft, Camera, CheckCircle2, ImageIcon, Keyboard, Loader2, PackageCheck, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Step = "scan" | "preview" | "success";

export default function FacilityHandover() {
  const [step, setStep] = useState<Step>("scan");
  const [orders, setOrders] = useState<FacilityOrder[]>([]);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [token, setToken] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<FacilityOrder | null>(null);
  const [received, setReceived] = useState<FacilityOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanLocked = useRef(false);

  useEffect(() => {
    listFacilityOrders().then(setOrders).catch((err: unknown) => setError(err instanceof Error ? err.message : "Gagal memuat pesanan"));
  }, []);

  async function inspectQr(value: string) {
    const code = value.trim();
    if (!code || scanLocked.current) return;
    scanLocked.current = true;
    setBusy(true);
    setError("");
    try {
      const order = await previewFacilityHandover(code);
      setToken(code);
      setQrInput(code);
      setPreview(order);
      setCameraMode(false);
      setStep("preview");
    } catch (err) {
      setCameraMode(false);
      setError(err instanceof Error ? err.message : "QR tidak dapat dibaca atau tidak berlaku");
    } finally {
      setBusy(false);
      scanLocked.current = false;
    }
  }

  async function scanImage(file: File | undefined) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    const element = document.getElementById("facility-handover-file-reader");
    if (!element) { setUploading(false); return; }
    let scanner: Html5Qrcode | null = null;
    try {
      scanner = new Html5Qrcode(element.id, { verbose: false });
      const result = await scanner.scanFile(file, false);
      await inspectQr(result);
    } catch {
      setError("QR pada gambar tidak terbaca. Coba gambar yang lebih jelas atau gunakan kamera.");
    } finally {
      try { scanner?.clear(); } catch { /* Scanner may already be clear. */ }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false);
    }
  }

  async function confirmReceipt() {
    if (!preview || !token || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await receiveFacilityOrder(token, notes.trim() || undefined);
      setReceived(result);
      setStep("success");
      void listFacilityOrders().then(setOrders).catch(() => {});
      toast.success("Serah terima berhasil dicatat.");
    } catch (err) {
      // A response can be lost after the server commits. Check the saved state before retrying a one-use QR.
      const refreshed = await listFacilityOrders().catch(() => null);
      if (refreshed) {
        setOrders(refreshed);
        const completed = refreshed.find((order) => order.id === preview.id && order.status === "completed");
        if (completed) {
          setReceived(completed);
          setStep("success");
          toast.success("Serah terima sudah tercatat.");
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Konfirmasi serah terima gagal");
    } finally { setBusy(false); }
  }

  function reset() {
    setStep("scan"); setPreview(null); setReceived(null); setToken(""); setQrInput(""); setNotes(""); setError(""); setCameraMode(false);
  }

  const waiting = orders.filter((order) => order.status === "processing");

  return <DashboardLayout title="Serah Terima QR" subtitle="Pindai QR yang ditampilkan vendor, periksa isi pesanan, lalu konfirmasi penerimaan.">
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        {step === "scan" && <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
          <div className="relative bg-gradient-to-br from-teal-700 via-emerald-600 to-emerald-700 p-8 text-center text-white"><span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20"><QrCode className="h-10 w-10" /></span><h2 className="text-xl font-extrabold">Pindai QR Vendor</h2><p className="mt-1 text-sm text-white/80">QR berasal dari pesanan yang sedang dikirim ke faskes Anda.</p></div>
          <div className="grid grid-cols-3 gap-2 border-b p-3 text-sm font-semibold"><button type="button" onClick={() => { setCameraMode(false); setCameraError(""); }} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 ${!cameraMode ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-secondary"}`}><Keyboard className="h-4 w-4" /> Manual</button><button type="button" onClick={() => { setCameraMode(true); setCameraError(""); }} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 ${cameraMode ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-secondary"}`}><Camera className="h-4 w-4" /> Kamera</button><button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-muted-foreground hover:bg-secondary disabled:opacity-50"><ImageIcon className="h-4 w-4" /> Gambar</button><input ref={fileInputRef} type="file" accept="image/*" className="hidden" aria-label="Unggah gambar QR" onChange={(event) => { void scanImage(event.target.files?.[0]); }} /><div id="facility-handover-file-reader" className="hidden" /></div>
          <CardContent className="space-y-4 p-6">
            {cameraMode ? cameraError ? <div className="rounded-xl bg-destructive/5 p-5 text-center"><p className="text-sm text-destructive">{cameraError}</p><Button variant="link" onClick={() => setCameraMode(false)}>Gunakan input manual</Button></div> : <div className="space-y-2"><QrCameraScanner onScan={(value) => { void inspectQr(value); }} onError={setCameraError} className="h-[min(62vh,520px)] min-h-[330px] w-full" /><p className="text-center text-xs text-muted-foreground">Tempatkan QR vendor di dalam bingkai hijau.</p></div> : <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void inspectQr(qrInput); }}><Input aria-label="Kode QR serah terima" placeholder="SA-HANDOVER:..." value={qrInput} onChange={(event) => setQrInput(event.target.value)} autoComplete="off" className="font-mono text-sm" /><Button type="submit" disabled={!qrInput.trim() || busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Periksa"}</Button></form>}
            {uploading && <p className="text-sm text-muted-foreground">Membaca gambar QR...</p>}
            {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            <p className="text-xs leading-5 text-muted-foreground">Pemindaian hanya menampilkan pratinjau. Serah terima baru tercatat setelah Anda menekan konfirmasi.</p>
          </CardContent>
        </Card>}

        {step === "preview" && preview && <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm"><div className="bg-gradient-to-br from-teal-700 to-emerald-600 px-6 py-6 text-white"><h2 className="flex items-center gap-2 text-lg font-bold"><PackageCheck className="h-5 w-5" /> Periksa Pesanan</h2><p className="mt-1 text-sm text-white/80">Cocokkan barang dari vendor sebelum menerima.</p></div><CardContent className="space-y-4 p-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{preview.family_name || "Keluarga"}</p><p className="text-xs text-muted-foreground">Pesanan {preview.id.slice(0, 8)} · {preview.vendor_name || "Vendor"}</p></div><Badge variant="outline">Dalam pengiriman</Badge></div><div className="space-y-2 rounded-xl bg-secondary/20 p-4">{preview.items.map((item) => <div key={item.product_id} className="flex justify-between gap-3 text-sm"><span>{item.quantity}× {item.product_name}</span><span>{formatIDR(item.subtotal)}</span></div>)}</div><div className="flex justify-between border-t pt-3 font-semibold"><span>Nilai pesanan</span><span>{formatIDR(preview.total_amount)}</span></div><div><label htmlFor="receipt-notes" className="mb-1 block text-sm font-medium">Catatan penerimaan (opsional)</label><Input id="receipt-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} placeholder="Contoh: semua barang dan jumlah sesuai" /></div><p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Konfirmasi ini mencatat penerimaan oleh faskes. Pendanaan dan penyaluran kepada keluarga belum tercatat.</p>{error && <p role="alert" className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={reset} disabled={busy}><ArrowLeft className="mr-2 h-4 w-4" /> Scan ulang</Button><Button onClick={() => { void confirmReceipt(); }} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Konfirmasi terima</Button></div></CardContent></Card>}

        {step === "success" && received && <Card className="rounded-3xl border-emerald-200 shadow-sm"><CardContent className="flex flex-col items-center gap-4 p-8 text-center"><span className="rounded-2xl bg-emerald-50 p-4 text-emerald-700"><CheckCircle2 className="h-10 w-10" /></span><h2 className="text-xl font-bold">Serah terima tercatat</h2><p className="text-sm text-muted-foreground">Pesanan {received.id.slice(0, 8)} untuk {received.family_name || "keluarga"} sudah diterima faskes. QR ini tidak dapat dipakai lagi.</p><div className="flex flex-wrap justify-center gap-2"><Button asChild><Link to={`/dashboard/health-facility/families/${received.family_id}/redemptions`}>Riwayat keluarga</Link></Button><Button asChild variant="outline"><Link to="/dashboard/health-facility/redemptions">Semua riwayat</Link></Button><Button variant="outline" onClick={reset}><RefreshCw className="mr-2 h-4 w-4" /> Scan berikutnya</Button></div></CardContent></Card>}
      </div>

      <Card className="rounded-2xl border-border/70 shadow-sm lg:col-span-2"><CardHeader><CardTitle className="text-lg">Menunggu Serah Terima</CardTitle></CardHeader><CardContent className="space-y-3">{waiting.length ? waiting.map((order) => <div key={order.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3 text-sm font-semibold"><span>{order.family_name || "Keluarga"} · {order.vendor_name || "Vendor"}</span><span>{formatIDR(order.total_amount)}</span></div><p className="mt-1 text-xs text-muted-foreground">Pesanan {order.id.slice(0, 8)} · {order.items.map((item) => `${item.quantity}× ${item.product_name}`).join(", ")}</p></div>) : <p className="text-sm text-muted-foreground">Belum ada pesanan dalam pengiriman. <Link className="text-primary underline" to="/dashboard/health-facility/orders">Lihat pesanan</Link></p>}<p className="border-t pt-3 text-xs text-muted-foreground">Vendor menampilkan QR; akun faskes memindainya saat barang tiba.</p></CardContent></Card>
    </div>
  </DashboardLayout>;
}
