import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Search,
  Star,
  Loader2,
  RefreshCw,
  Camera,
  CameraOff,
  Ticket,
  Package,
  CircleDot,
  ChevronRight,
  Copy,
  Download,
  ArrowLeft,
  ScanLine,
  KeyRound,
  ShieldCheck,
  ClipboardCheck,
  PartyPopper,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import {
  getVoucherBalance,
  redeemQrVoucher,
  validateVoucher as validateVoucherCode,
} from "@/services/vouchers";
import { getOrders } from "@/services/orders";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";

// ── Types ─────────────────────────────────────────────────────
type RedemptionStep = "input" | "validate" | "confirm" | "success" | "failed";

interface VoucherBalance {
  total_balance: number;
  active_vouchers: Array<{ code: string; balance: string | number; expiry_date?: string }>;
}

interface CartItem {
  name: string;
  price: number;
  qty: number;
}

// ── Step config ───────────────────────────────────────────────
const STEPS: { id: RedemptionStep; label: string; sublabel: string; Icon: React.ElementType }[] = [
  { id: "input", label: "Kode Voucher", sublabel: "Masukkan kode", Icon: KeyRound },
  { id: "validate", label: "Verifikasi", sublabel: "Periksa saldo", Icon: ShieldCheck },
  { id: "confirm", label: "Konfirmasi", sublabel: "Tinjau transaksi", Icon: ClipboardCheck },
  { id: "success", label: "Selesai", sublabel: "Berhasil!", Icon: PartyPopper },
];

const STEP_ORDER: RedemptionStep[] = ["input", "validate", "confirm", "success"];

// ── Step Progress Bar ─────────────────────────────────────────
function StepProgress({ current }: { current: RedemptionStep }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  const progressPct =
    currentIdx === 0 ? 0 : Math.round((currentIdx / (STEP_ORDER.length - 1)) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      {/* Progress track */}
      <div className="relative h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps row */}
      <div className="grid grid-cols-4 gap-1">
        {STEPS.map((s, i) => {
          const idx = STEP_ORDER.indexOf(s.id);
          const isDone = idx < currentIdx || current === "success";
          const isCurrent = s.id === current;
          const StepIcon = s.Icon;
          return (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div
                className={`
                relative h-10 w-10 rounded-xl flex items-center justify-center
                transition-all duration-300
                ${
                  isDone
                    ? "bg-green-500 text-white shadow-md shadow-green-200/60"
                    : isCurrent
                      ? "bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-offset-2 ring-primary/40"
                      : "bg-secondary/70 text-muted-foreground"
                }
              `}
              >
                {isDone ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-4.5 w-4.5" />
                )}
                {/* Active pulse */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-xl bg-primary/30 animate-ping" />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <p
                  className={`text-[10px] font-bold leading-tight ${
                    isCurrent ? "text-primary" : isDone ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </p>
                <p
                  className={`text-[9px] leading-tight hidden sm:block mt-0.5 ${
                    isCurrent
                      ? "text-primary/70"
                      : isDone
                        ? "text-green-500/80"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {s.sublabel}
                </p>
              </div>

              {/* Step number badge */}
              <span
                className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                  isCurrent
                    ? "bg-primary/10 text-primary"
                    : isDone
                      ? "bg-green-50 text-green-600"
                      : "bg-secondary text-muted-foreground/50"
                }`}
              >
                {isDone ? "✓" : `${i + 1}/${STEPS.length}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── QR Generator ─────────────────────────────────────────────
function VoucherQRGenerator({ balance }: { balance: VoucherBalance | null }) {
  const vouchers = balance?.active_vouchers ?? [];
  const [selectedCode, setSelectedCode] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    if (vouchers.length > 0 && !selectedCode) setSelectedCode(vouchers[0].code);
  }, [vouchers]);

  const payload = selectedCode
    ? `VOUCHER:${selectedCode}${customAmount ? `:${customAmount}` : ""}`
    : "";

  const handleDownloadQR = () => {
    const svgEl = document.getElementById(`gen-qr-${selectedCode}`) as SVGElement | null;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = 280; canvas.height = 280;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 280, 280);
      const a = document.createElement("a");
      a.download = `voucher-${selectedCode}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const copyCode = () => {
    if (!selectedCode) return;
    navigator.clipboard.writeText(selectedCode);
    toast.success("Kode voucher disalin!");
  };

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mx-auto mb-3">
          <QrCode className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">Tidak Ada Voucher Aktif</p>
        <p className="text-xs text-muted-foreground">
          Anda belum memiliki voucher yang dapat di-generate QR-nya.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select voucher */}
      <div>
        <Label className="text-xs font-semibold text-foreground mb-1.5 block">Pilih Voucher</Label>
        <div className="grid grid-cols-1 gap-2">
          {vouchers.slice(0, 4).map((v) => (
            <button
              key={v.code}
              type="button"
              onClick={() => setSelectedCode(v.code)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                selectedCode === v.code
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div>
                <p className="text-xs font-mono font-bold text-foreground">{v.code}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Saldo: {formatIDR(Number(v.balance || 0))}
                </p>
              </div>
              {selectedCode === v.code && (
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Optional amount */}
      <div>
        <Label className="text-xs font-semibold text-foreground mb-1.5 block">
          Nominal Transaksi (Opsional)
        </Label>
        <Input
          type="number"
          placeholder="Kosongkan jika tidak ditentukan"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="text-sm"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Isi nominal agar vendor tahu persis jumlah yang harus diproses
        </p>
      </div>

      {/* QR Display */}
      {payload && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCode className="h-4 w-4 text-green-700" />
            <p className="text-sm font-bold text-green-800">QR Voucher Anda</p>
          </div>
          <div className="flex justify-center">
            <div className="rounded-xl border-4 border-green-600 bg-white p-2 shadow-sm">
              <QRCodeSVG
                id={`gen-qr-${selectedCode}`}
                value={payload}
                size={180}
                level="H"
                fgColor="#15803d"
                bgColor="#ffffff"
              />
            </div>
          </div>
          <p className="text-xs font-mono font-bold text-green-700 mt-3">{selectedCode}</p>
          {customAmount && (
            <p className="text-xs text-green-600 mt-1">
              Nominal: {formatIDR(Number(customAmount))}
            </p>
          )}
          <div className="flex gap-2 mt-4 justify-center">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-green-300 text-green-700 hover:bg-green-100"
              onClick={copyCode}
            >
              <Copy className="h-3 w-3" /> Salin Kode
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-green-300 text-green-700 hover:bg-green-100"
              onClick={handleDownloadQR}
            >
              <Download className="h-3 w-3" /> Unduh QR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const PenukaranVoucher = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<RedemptionStep>("input");
  const [code, setCode] = useState("");
  const [balance, setBalance] = useState<VoucherBalance | null>(null);
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [manualAmount, setManualAmount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerSupport, setScannerSupport] = useState<"native" | "jsqr" | "none">("none");
  const [transactionId, setTransactionId] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const scanningRef = useRef(false);

  const isVendorMode = user?.role === "vendor" || user?.role === "admin";
  const total = selectedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const checkoutTotal = isVendorMode ? manualAmount : total;
  const totalBalance = balance?.total_balance || 0;

  // Detect scanner support
  useEffect(() => {
    if ("BarcodeDetector" in window) setScannerSupport("native");
    else if (typeof jsQR === "function") setScannerSupport("jsqr");
    else setScannerSupport("none");
  }, []);

  // Load balance + last order items
  useEffect(() => {
    if (!user?.id) return;
    getVoucherBalance(user.id)
      .then((data: VoucherBalance) => setBalance(data))
      .catch(() => setBalance(null));

    getOrders()
      .then((data) => {
        const orders = Array.isArray(data) ? data : (data as { orders?: unknown[] })?.orders || [];
        const firstOrder = Array.isArray(orders) && orders.length > 0 ? orders[0] : null;
        if (firstOrder && typeof firstOrder === "object" && "items" in firstOrder) {
          const items = Array.isArray((firstOrder as { items?: unknown[] }).items)
            ? (
                firstOrder as {
                  items: Array<{
                    product_name?: string;
                    name?: string;
                    unit_price?: string;
                    price?: number;
                    quantity?: number;
                  }>;
                }
              ).items.map((item) => ({
                name: item.product_name || item.name || "Produk",
                price: parseFloat(String(item.unit_price || item.price || 0)) || 0,
                qty: item.quantity || 1,
              }))
            : [];
          setSelectedItems(items);
        }
      })
      .catch(() => setSelectedItems([]));
  }, [user]);

  // Cleanup camera on unmount
  useEffect(
    () => () => {
      stopCamera();
    },
    []
  );

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    scanningRef.current = false;
    setCameraActive(false);
  }, []);

  const runJsQrLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(runJsQrLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (result?.data) {
      const raw = result.data.trim();
      const parsed = raw.startsWith("VOUCHER:") ? raw.replace("VOUCHER:", "").split(":")[0] : raw;
      if (parsed) {
        setCode(parsed.toUpperCase());
        toast.success("QR voucher terdeteksi! ✅");
        stopCamera();
        return;
      }
    }
    animFrameRef.current = requestAnimationFrame(runJsQrLoop);
  }, [stopCamera]);

  const runNativeLoop = useCallback(
    async (detector: {
      detect: (video: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    }) => {
      if (!videoRef.current || !scanningRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes?.length > 0) {
          const rawValue = String(barcodes[0].rawValue || "").trim();
          const parsed = rawValue.startsWith("VOUCHER:")
            ? rawValue.replace("VOUCHER:", "").split(":")[0]
            : rawValue;
          if (parsed) {
            setCode(parsed.toUpperCase());
            toast.success("QR voucher terdeteksi! ✅");
            stopCamera();
            return;
          }
        }
      } catch {
        /* ignore frame errors */
      }
      animFrameRef.current = requestAnimationFrame(() => runNativeLoop(detector));
    },
    [stopCamera]
  );

  const startCamera = async () => {
    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      toast.error("Perangkat tidak mendukung kamera");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      scanningRef.current = true;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (scannerSupport === "native") {
        type BarcodeDetectorCtor = new (opts: { formats: string[] }) => {
          detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
        };
        const detector = new (
          window as unknown as { BarcodeDetector: BarcodeDetectorCtor }
        ).BarcodeDetector({ formats: ["qr_code"] });
        animFrameRef.current = requestAnimationFrame(() => runNativeLoop(detector));
      } else if (scannerSupport === "jsqr") {
        animFrameRef.current = requestAnimationFrame(runJsQrLoop);
      } else {
        toast.info("Scanner otomatis tidak tersedia. Ketik kode secara manual.");
      }
    } catch {
      toast.error("Gagal mengakses kamera. Pastikan izin kamera diaktifkan.");
      stopCamera();
    }
  };

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error("Masukkan kode voucher");
      return;
    }
    if (checkoutTotal <= 0) {
      toast.error("Total transaksi harus lebih dari 0");
      return;
    }
    setValidating(true);
    setErrorMessage("");
    try {
      await validateVoucherCode({
        code,
        amount: checkoutTotal,
      });
      setStep("validate");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal memvalidasi voucher");
      setStep("failed");
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = async () => {
    setRedeeming(true);
    setErrorMessage("");
    try {
      const result = await redeemQrVoucher(
        {
          code,
          amount: checkoutTotal,
          notes: isVendorMode
            ? "Redeem QR voucher oleh vendor"
            : "Redeem QR voucher oleh beneficiary",
        },
        { idempotencyKey: `vendor-redeem-${code}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
      );

      setTransactionId(result.order_id);
      setStep("success");
      toast.success("Penukaran berhasil!");

      if (!isVendorMode) {
        refreshBalance();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal menukarkan voucher");
      setStep("failed");
      toast.error("Penukaran gagal");
    } finally {
      setRedeeming(false);
    }
  };

  const reset = () => {
    stopCamera();
    setStep("input");
    setCode("");
    setErrorMessage("");
  };
  const refreshBalance = () => {
    if (user?.id)
      getVoucherBalance(user.id)
        .then((data: VoucherBalance) => setBalance(data))
        .catch(() => setBalance(null));
  };

  return (
    <DashboardLayout
      title="Penukaran Voucher"
      subtitle="Scan, validasi, dan tukar voucher nutrisi."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ── Tab: Tukar vs Generate QR ── */}
        <Tabs defaultValue={isVendorMode ? "redeem" : "generate"}>
          <TabsList className="w-full h-11">
            {isVendorMode && (
              <TabsTrigger value="redeem" className="flex-1 gap-1.5 text-xs">
                <ScanLine className="h-3.5 w-3.5" /> Tukar Voucher
              </TabsTrigger>
            )}
            {!isVendorMode && (
              <TabsTrigger value="generate" className="flex-1 gap-1.5 text-xs">
                <QrCode className="h-3.5 w-3.5" /> Generate QR Saya
              </TabsTrigger>
            )}
          </TabsList>

          {/* ═══════ TAB: TUKAR VOUCHER ═══════ */}
          <TabsContent value="redeem" className="space-y-5 mt-5">
            {/* Step progress (only for non-failed states) */}
            {step !== "failed" && <StepProgress current={step} />}

            {/* ── STEP: INPUT ── */}
            {step === "input" && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="p-6 text-center border-b border-border bg-secondary/20">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <QrCode className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Masukkan Kode Voucher</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scan QR atau ketik kode voucher secara manual
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Balance info */}
                  {!isVendorMode && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            Saldo Voucher Anda
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-green-700">
                          {formatIDR(totalBalance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-600">Voucher Aktif</span>
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                          {balance?.active_vouchers?.length || 0} voucher
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Vendor mode info */}
                  {isVendorMode && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                      <p className="text-sm text-blue-800">
                        <strong>Mode Vendor/Admin:</strong> Scan QR voucher dari penerima manfaat,
                        lalu masukkan nominal transaksi untuk dikonfirmasi.
                      </p>
                    </div>
                  )}

                  {/* Amount input (vendor) or display (beneficiary) */}
                  {isVendorMode ? (
                    <div>
                      <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                        Total Transaksi (Rp)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={checkoutTotal || ""}
                        onChange={(e) => setManualAmount(Number(e.target.value || 0))}
                        placeholder="Masukkan total belanja"
                        className="text-center text-lg font-bold"
                      />
                    </div>
                  ) : (
                    total > 0 && (
                      <div className="rounded-xl bg-secondary/50 p-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Belanja (pesanan terakhir):
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {formatIDR(checkoutTotal)}
                        </span>
                      </div>
                    )
                  )}

                  {/* Camera Scanner (for vendor and beneficiary) */}
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full gap-2 ${cameraActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-primary/30 text-primary hover:bg-primary/5"}`}
                      onClick={cameraActive ? stopCamera : startCamera}
                    >
                      {cameraActive ? (
                        <>
                          <CameraOff className="h-4 w-4" /> Hentikan Kamera
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" /> Buka Scanner Kamera
                        </>
                      )}
                    </Button>

                    {cameraActive && (
                      <div className="relative rounded-xl overflow-hidden border border-border bg-black">
                        <video
                          ref={videoRef}
                          className="w-full aspect-video object-cover"
                          muted
                          playsInline
                        />
                        {/* Scanning overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative h-52 w-52">
                            <div className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                            {/* Animated scanline */}
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400 opacity-90 animate-[scanline_1.8s_ease-in-out_infinite]" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                          <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-4 py-1.5">
                            <CircleDot className="h-3 w-3 text-green-400 animate-pulse" />
                            <span className="text-[10px] text-white font-medium">
                              {scannerSupport === "none" ? "Manual mode" : "Sedang memindai..."}
                            </span>
                          </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    )}

                    <div className="flex justify-center">
                      <span
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
                          scannerSupport === "native"
                            ? "bg-green-100 text-green-700"
                            : scannerSupport === "jsqr"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {scannerSupport === "native"
                          ? "✓ Scanner Native (Chrome/Edge)"
                          : scannerSupport === "jsqr"
                            ? "✓ Scanner jsQR (Firefox/Safari)"
                            : "⚡ Mode Manual"}
                      </span>
                    </div>
                  </div>

                  {/* Code input */}
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Kode Voucher
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Contoh: VCH-2026-XXXX"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="text-center text-base tracking-widest font-mono pr-12"
                      />
                      {code && (
                        <button
                          type="button"
                          onClick={() => setCode("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full h-11 gap-2 font-semibold"
                    onClick={handleValidate}
                    disabled={validating || !code}
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    {validating ? "Memvalidasi..." : "Validasi Voucher"}
                    {!validating && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP: VALIDATE ── */}
            {step === "validate" && (
              <div className="rounded-2xl border border-green-200 bg-card overflow-hidden">
                <div className="p-5 bg-green-50 border-b border-green-200 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800">Voucher Valid!</h3>
                    <p className="text-xs text-green-600">Kode voucher berhasil divalidasi</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Voucher summary */}
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Kode Voucher</span>
                      <span className="font-mono text-sm bg-secondary px-2.5 py-1 rounded-lg font-bold">
                        {code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Saldo Tersedia</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatIDR(totalBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 border-t border-border">
                      <span className="text-sm font-semibold text-foreground">Total Transaksi</span>
                      <span className="text-lg font-extrabold text-foreground">
                        {formatIDR(checkoutTotal)}
                      </span>
                    </div>
                    {!isVendorMode && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Sisa Saldo</span>
                        <span
                          className={`text-sm font-semibold ${totalBalance - checkoutTotal >= 0 ? "text-primary" : "text-destructive"}`}
                        >
                          {formatIDR(totalBalance - checkoutTotal)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={reset}>
                      <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
                    </Button>
                    <Button className="flex-1 gap-1.5" onClick={() => setStep("confirm")}>
                      Lanjut <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP: CONFIRM ── */}
            {step === "confirm" && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-3 bg-secondary/20">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">Konfirmasi Penukaran</h3>
                    <p className="text-xs text-muted-foreground">
                      Periksa detail sebelum menukarkan voucher
                    </p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Items list (beneficiary only) */}
                  {!isVendorMode && selectedItems.length > 0 && (
                    <div className="space-y-2">
                      {selectedItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
                        >
                          <div>
                            <div className="text-sm font-medium text-foreground">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ×{item.qty} · {formatIDR(item.price)}/item
                            </div>
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            {formatIDR(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total card */}
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">Total Penukaran</span>
                      <span className="text-xl font-extrabold text-primary">
                        {formatIDR(checkoutTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Voucher yang digunakan</span>
                      <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {code}
                      </span>
                    </div>
                    {!isVendorMode && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          Sisa saldo setelah tukar
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {formatIDR(totalBalance - checkoutTotal)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep("validate")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
                    </Button>
                    <Button className="flex-1 gap-1.5" onClick={handleConfirm} disabled={redeeming}>
                      {redeeming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {redeeming ? "Memproses..." : "Konfirmasi Tukar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === "success" && (
              <div className="rounded-2xl border border-green-200 bg-card overflow-hidden text-center">
                <div className="p-10 bg-gradient-to-b from-green-50 to-card">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mx-auto mb-5">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                    <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-20" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-foreground mb-2">Berhasil! 🎉</h2>
                  <p className="text-sm text-muted-foreground">
                    Penukaran voucher selesai diproses
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2.5 text-sm text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Transaksi</span>
                      <span className="font-bold text-green-600 text-base">
                        {formatIDR(checkoutTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kode Voucher</span>
                      <span className="font-mono text-xs bg-secondary px-2 py-1 rounded-lg">
                        {code}
                      </span>
                    </div>
                    {!isVendorMode && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sisa Saldo</span>
                        <span className="font-semibold">
                          {formatIDR(totalBalance - checkoutTotal)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-2.5">
                      <span className="text-muted-foreground">ID Transaksi</span>
                      <span className="font-mono text-xs bg-secondary px-2 py-1 rounded-lg">
                        {transactionId}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={reset}>Tukar Lagi</Button>
                    <Button
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => toast.success("Terima kasih atas rating Anda!")}
                    >
                      <Star className="h-4 w-4" /> Beri Rating
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
                    Kembali ke Dashboard
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP: FAILED ── */}
            {step === "failed" && (
              <div className="rounded-2xl border border-red-200 bg-card overflow-hidden text-center">
                <div className="p-10 bg-gradient-to-b from-red-50 to-card">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 mx-auto mb-5">
                    <XCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-red-700 mb-2">Voucher Ditolak</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {errorMessage || "Kode voucher tidak ditemukan atau sudah kadaluarsa."}
                  </p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-red-600 hover:bg-red-700" onClick={reset}>
                      Coba Lagi
                    </Button>
                    <Button variant="outline" className="gap-1.5" onClick={refreshBalance}>
                      <RefreshCw className="h-4 w-4" /> Refresh Saldo
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
                    Kembali ke Dashboard
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ═══════ TAB: GENERATE QR (Hidden for Vendor) ═══════ */}
          {!isVendorMode && (
            <TabsContent value="generate" className="mt-5">
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <QrCode className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Generate QR Voucher</h3>
                      <p className="text-xs text-muted-foreground">
                        Buat QR code dari voucher Anda untuk ditunjukkan ke vendor
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <VoucherQRGenerator balance={balance} />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Scanline animation keyframe */}
        <style>{`
          @keyframes scanline {
            0%   { top: 4px; opacity: 1; }
            50%  { opacity: 0.5; }
            100% { top: calc(100% - 4px); opacity: 1; }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default PenukaranVoucher;
