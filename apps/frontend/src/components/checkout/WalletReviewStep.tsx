import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletReviewStepProps {
  cartTotal: number;
  walletBalance: number;
  isLoading: boolean;
  onConfirm: () => void;
}

/**
 * WalletReviewStep - Step 2 of checkout
 * Review wallet balance and confirm order
 */
export function WalletReviewStep({
  cartTotal,
  walletBalance,
  isLoading,
  onConfirm,
}: WalletReviewStepProps) {
  const hasEnoughBalance = walletBalance >= cartTotal;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi Dompet Nutrisi</h2>
        <p className="text-gray-600">Saldo Dompet Nutrisi Anda akan digunakan untuk pembayaran</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Status - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-900 mb-1">Saldo Dompet Nutrisi</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  Rp {walletBalance.toLocaleString("id-ID")}
                </h3>
              </div>
              <div className="bg-emerald-600 rounded-full p-3">
                <Wallet className="text-white" size={24} />
              </div>
            </div>
          </div>

          {/* Balance Check */}
          {hasEnoughBalance ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Saldo Mencukupi</p>
                <p className="text-sm text-green-700">Saldo Anda mencukupi untuk pesanan ini</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Saldo Tidak Mencukupi</p>
                <p className="text-sm text-red-700">
                  Anda kekurangan Rp {(cartTotal - walletBalance).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary - 1/3 width */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 h-fit space-y-4">
          <h3 className="font-bold text-gray-900">Ringkasan</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Barang:</span>
              <span className="font-medium">Rp {cartTotal.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Bayar dengan Dompet:</span>
              <span className="font-bold text-emerald-600">
                -Rp {cartTotal.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Sisa Saldo:</span>
                <span className="text-lg font-bold text-gray-900">
                  Rp {Math.max(0, walletBalance - cartTotal).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!hasEnoughBalance || isLoading}
            onClick={onConfirm}
          >
            {isLoading ? "Memproses..." : "Konfirmasi Pesanan"}
          </Button>

          {!hasEnoughBalance && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 text-center">
              Silakan tambah saldo atau kurangi jumlah barang
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
