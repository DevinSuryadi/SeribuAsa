import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertTriangle, Loader2, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { simulatePayment } from "@/services/donations";
import { DonationHero } from "@/components/donation/DonationHero";

export default function MockPaymentModal() {
  const { donationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { amount = 0, paymentMethod = "bank_transfer" } = location.state || {};

  const [vaNumber] = useState(
    () =>
      `8801 ${Math.random().toString().slice(2, 6)} ${Math.random().toString().slice(2, 6)} ${Math.random().toString().slice(2, 6)}`
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(vaNumber.replace(/\s/g, ""));
    toast.success("Nomor VA disalin!");
  };

  const handleSimulatePayment = async () => {
    if (!donationId) {
      toast.error("Error", { description: "ID donasi tidak ditemukan" });
      return;
    }

    setLoading(true);

    try {
      // Add small delay for demo UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result: any = await simulatePayment(donationId);
      setSuccess(true);

      setTimeout(() => {
        navigate("/donation/success", {
          state: {
            donationId: result.donation_id,
            amount: result.amount,
            transactionId: result.transaction_id,
            impact: result.impact,
          },
        });
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error("Simulasi pembayaran gagal", { description: errorMessage });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 animate-pulse" />
            <h2 className="mt-4 text-2xl font-bold text-green-700">Pembayaran Berhasil!</h2>
            <p className="mt-2 text-gray-600">Donasi Anda telah dikonfirmasi</p>
            <p className="mt-1 text-sm text-gray-500">Mengalihkan ke halaman sukses...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <DonationHero
            icon={CreditCard}
            title="Simulasi Pembayaran"
            subtitle="Ini adalah mode demo. Klik tombol di bawah untuk mensimulasikan pembayaran berhasil."
            color="green"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Virtual Account</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{vaNumber}</span>
                <button onClick={copyToClipboard} className="text-gray-400 hover:text-gray-600">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jumlah</span>
              <span className="font-semibold">Rp {amount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Metode</span>
              <Badge variant="secondary" className="capitalize">
                {paymentMethod.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Berlaku sampai</span>
              <span className="font-semibold">24 jam</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Warning Banner */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <p className="font-medium">Mode Demo</p>
              <p className="text-sm text-yellow-700 mt-1">
                Di production, Anda akan diarahkan ke halaman pembayaran Midtrans yang sebenarnya.
              </p>
            </AlertDescription>
          </Alert>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleSimulatePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Simulasikan Pembayaran"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
