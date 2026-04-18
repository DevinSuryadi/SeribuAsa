import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Search,
  ShoppingBasket,
  Star,
  Loader2,
  RefreshCw,
  Camera,
  CameraOff,
} from "lucide-react";
import { formatIDR } from "@/lib/format";
import { getVoucherBalance, redeemVoucher } from "@/services/vouchers";
import { getOrders } from "@/services/orders";
import { toast } from "sonner";

type Step = "scan" | "validate" | "items" | "confirm" | "success" | "failed";

const PenukaranVoucher = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("scan");
  const [code, setCode] = useState("");
  const [balance, setBalance] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [manualAmount, setManualAmount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const total = selectedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const isVendorMode = user?.role === "vendor" || user?.role === "admin";
  const checkoutTotal = isVendorMode ? manualAmount : total;
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (user?.id) {
      getVoucherBalance(user.id)
        .then((data) => setBalance(data))
        .catch(() => setBalance(null));

      getOrders()
        .then((data) => {
          const orders = Array.isArray(data) ? data : data?.orders || [];
          if (orders.length > 0) {
            const lastOrder = orders[0];
            const items =
              lastOrder.items?.map((item: any) => ({
                name: item.product_name || item.name,
                price: parseFloat(item.unit_price) || 0,
                qty: item.quantity || 1,
              })) || [];
            setSelectedItems(items);
          }
        })
        .catch(() => setSelectedItems([]));
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    scanningRef.current = false;
  };

  const startCamera = async () => {
    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      toast.error("Perangkat tidak mendukung kamera");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      scanningRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!("BarcodeDetector" in window)) {
        toast.info("Scanner otomatis tidak tersedia di browser ini. Gunakan input manual.");
        return;
      }

      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const loop = async () => {
        if (!videoRef.current || !scanningRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = String(barcodes[0].rawValue || "").trim();
            const parsedCode = rawValue.startsWith("VOUCHER:")
              ? rawValue.replace("VOUCHER:", "")
              : rawValue;

            if (parsedCode) {
              setCode(parsedCode.toUpperCase());
              toast.success("QR voucher terdeteksi");
              stopCamera();
              return;
            }
          }
        } catch {
          // Ignore transient decode failures
        }
        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    } catch {
      toast.error("Gagal mengakses kamera");
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
      if (!isVendorMode) {
        if (!balance || balance.total_balance <= 0) {
          setErrorMessage("Saldo voucher tidak mencukupi atau tidak ada voucher aktif.");
          setStep("failed");
          return;
        }

        const voucherMatch = balance.active_vouchers?.find(
          (v: any) => v.code.toLowerCase() === code.toLowerCase()
        );

        if (!voucherMatch) {
          setErrorMessage("Kode voucher tidak ditemukan atau sudah kadaluarsa.");
          setStep("failed");
          return;
        }

        if (parseFloat(voucherMatch.balance) < checkoutTotal) {
          setErrorMessage("Saldo voucher tidak mencukupi untuk transaksi ini.");
          setStep("failed");
          return;
        }
      }

      setStep("validate");
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memvalidasi voucher");
      setStep("failed");
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = async () => {
    setRedeeming(true);
    setErrorMessage("");

    try {
      const orderId = `ORD-${Date.now()}`;
      const result = await redeemVoucher(
        {
          voucher_codes: [code],
          amount: checkoutTotal,
          order_id: orderId,
        },
        {
          idempotencyKey: `vendor-redeem-${code}-${orderId}-${checkoutTotal}`,
        }
      );

      if (result.success) {
        setTransactionId(orderId);
        setStep("success");
        toast.success("Penukaran berhasil!");
      } else {
        setErrorMessage("Gagal menukarkan voucher");
        setStep("failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menukarkan voucher");
      setStep("failed");
      toast.error("Penukaran gagal");
    } finally {
      setRedeeming(false);
    }
  };

  const reset = () => {
    stopCamera();
    setStep("scan");
    setCode("");
    setErrorMessage("");
  };

  const refreshBalance = () => {
    if (user?.id) {
      getVoucherBalance(user.id)
        .then((data) => setBalance(data))
        .catch(() => setBalance(null));
    }
  };

  const totalBalance = balance?.total_balance || 0;

  return (
    <DashboardLayout
      title="Penukaran Voucher"
      subtitle="Verifikasi dan tukar voucher penerima manfaat."
    >
      <div className="max-w-lg mx-auto space-y-6">
        {step === "scan" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Masukkan Kode Voucher</CardTitle>
              <CardDescription>Scan QR atau masukkan kode voucher penerima</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isVendorMode && (
                <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saldo Anda:</span>
                    <span className="font-bold text-primary">{formatIDR(totalBalance)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Voucher Aktif:</span>
                    <span className="font-medium">{balance?.active_vouchers?.length || 0}</span>
                  </div>
                </div>
              )}

              {isVendorMode && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  Mode vendor: scan QR voucher dari penerima, lalu konfirmasi nominal transaksi.
                </div>
              )}

              {isVendorMode ? (
                <div>
                  <Label>Total Transaksi (IDR)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={checkoutTotal || ""}
                    onChange={(e) => setManualAmount(Number(e.target.value || 0))}
                    placeholder="0"
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-secondary/30 p-3 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Total Belanja:</span>
                  <span className="font-semibold text-foreground">{formatIDR(checkoutTotal)}</span>
                </div>
              )}

              {isVendorMode && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {!cameraActive ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={startCamera}
                      >
                        <Camera className="h-4 w-4" /> Mulai Scanner
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={stopCamera}
                      >
                        <CameraOff className="h-4 w-4" /> Hentikan Kamera
                      </Button>
                    )}
                  </div>

                  {cameraActive && (
                    <video
                      ref={videoRef}
                      className="w-full rounded-lg border border-gray-200 bg-black/80"
                      muted
                      playsInline
                    />
                  )}
                </div>
              )}

              <div>
                <Label>Kode Voucher</Label>
                <Input
                  placeholder="Contoh: VCH-2026-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              <Button className="w-full gap-2" onClick={handleValidate} disabled={validating}>
                {validating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}{" "}
                Validasi Voucher
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/dashboard/katalog")}
              >
                Kembali ke Katalog
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "validate" && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" /> Voucher Valid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kode:</span>
                  <span className="font-mono text-xs">{code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo Voucher:</span>
                  <span className="font-bold text-primary">{formatIDR(totalBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Belanja:</span>
                  <span className="font-semibold text-foreground">{formatIDR(checkoutTotal)}</span>
                </div>
                {!isVendorMode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sisa Saldo:</span>
                    <span className="font-medium">{formatIDR(totalBalance - checkoutTotal)}</span>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => setStep("items")}>
                Lanjut Pilih Item
              </Button>
              <Button variant="ghost" className="w-full" onClick={reset}>
                Batal
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "items" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" /> Item Pembelian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">x{item.qty}</div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatIDR(item.price * item.qty)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-border font-bold">
                <span>Total</span>
                <span className="text-primary">{formatIDR(total)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Sisa saldo setelah transaksi: {formatIDR(totalBalance - total)}
              </div>
              <Button className="w-full" onClick={handleConfirm} disabled={redeeming}>
                {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {redeeming ? "Memproses..." : "Konfirmasi Penukaran"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={reset}>
                Batal
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card className="text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Penukaran Berhasil!</h2>
              <div className="rounded-lg bg-secondary/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-primary">{formatIDR(checkoutTotal)}</span>
                </div>
                {!isVendorMode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sisa Saldo:</span>
                    <span className="font-medium">{formatIDR(totalBalance - checkoutTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Transaksi:</span>
                  <span className="font-mono text-xs">{transactionId}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={reset}>
                  Tukar Voucher Lain
                </Button>
                <Button
                  className="flex-1 gap-2"
                  variant="outline"
                  onClick={() => toast.success("Terima kasih atas rating Anda!")}
                >
                  <Star className="h-4 w-4" /> Beri Rating
                </Button>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
                Kembali ke Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "failed" && (
          <Card className="text-center border-destructive/30">
            <CardContent className="pt-8 pb-8 space-y-4">
              <XCircle className="h-16 w-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold text-destructive">Penukaran Gagal</h2>
              <p className="text-muted-foreground">
                {errorMessage ||
                  "Kode voucher yang dimasukkan tidak ditemukan atau sudah kadaluarsa."}
              </p>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={reset}>
                  Coba Lagi
                </Button>
                <Button className="flex-1" variant="outline" onClick={refreshBalance}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh Saldo
                </Button>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
                Kembali ke Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PenukaranVoucher;
