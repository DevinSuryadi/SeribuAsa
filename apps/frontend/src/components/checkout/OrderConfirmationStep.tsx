import { AlertCircle, CheckCircle2, ShoppingCart, X } from "lucide-react";
import type { OrderSummary } from "@/types/checkout";
import { useState } from "react";

interface OrderConfirmationStepProps {
  orderSummary: OrderSummary;
  error: string | null;
}

/**
 * OrderConfirmationStep - Step 3 of checkout
 * Final review before submitting order
 */
export function OrderConfirmationStep({
  orderSummary,
  error: initialError,
}: OrderConfirmationStepProps) {
  const [error, setError] = useState(initialError);
  const vendorCount = Object.keys(orderSummary.grouped_by_vendor).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi Pesanan</h2>
        <p className="text-gray-600">Tinjau pesanan Anda sebelum menyelesaikan pembayaran</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-red-600 hover:text-red-700 transition-colors"
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items by Vendor */}
          {Object.entries(orderSummary.grouped_by_vendor).map(([vendorId, items]) => (
            <div key={vendorId} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={18} />
                Pesanan{" "}
                {vendorCount > 1 ? `- Vendor ${vendorCount > 1 ? items[0].product_name : ""}` : ""}
              </h3>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        Rp {Number(item.price).toLocaleString("id-ID")} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      Rp {Number(item.subtotal).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Subtotal Vendor:</span>
                  <span className="font-bold">
                    Rp{" "}
                    {items
                      .reduce((sum, item) => sum + Number(item.subtotal), 0)
                      .toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Payment Method */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">Metode Pembayaran</h3>
            </div>
            <p className="text-sm text-gray-700">
              💳 <span className="font-medium">E-Voucher Dompet Nutrisi</span>
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Saldo akan dikurangi saat pesanan dikonfirmasi
            </p>
          </div>
        </div>

        {/* Order Summary - 1/3 width */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 h-fit">
          <h3 className="font-bold text-gray-900 mb-4">Ringkasan Total</h3>

          <div className="space-y-3 text-sm pb-4 border-b border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                Rp {orderSummary.cart_total.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Bayar dengan Dompet:</span>
              <span className="font-medium text-emerald-600">
                -Rp {orderSummary.cart_total.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-900">Total Pembayaran:</span>
              <span className="text-2xl font-bold text-emerald-600">Rp 0 (Dompet Nutrisi)</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Pembayaran penuh menggunakan saldo Dompet Nutrisi
            </p>
          </div>

          {/* Vendor Count Info */}
          {vendorCount > 1 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              📌 Pesanan akan dibuat untuk {vendorCount} vendor berbeda
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
