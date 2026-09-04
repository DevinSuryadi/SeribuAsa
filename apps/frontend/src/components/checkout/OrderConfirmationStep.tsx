import { AlertCircle, Store, X } from "lucide-react";
import type { OrderSummary } from "@/types/checkout";
import { useState } from "react";
import { ProductAvatar } from "@/components/product/ProductAvatar";
import { formatIDR } from "@/lib/format";

interface OrderConfirmationStepProps {
  orderSummary: OrderSummary;
  walletBalance: number;
  error: string | null;
}

/**
 * OrderConfirmationStep — Step 2 of checkout.
 * Final review before submitting. Shows actual total (not "Rp 0").
 */
export function OrderConfirmationStep({
  orderSummary,
  walletBalance,
  error: initialError,
}: OrderConfirmationStepProps) {
  const [error, setError] = useState(initialError);
  const vendorEntries = Object.entries(orderSummary.grouped_by_vendor);
  const vendorCount = vendorEntries.length;
  const cartTotal = orderSummary.cart_total;
  const remainingBalance = Math.max(0, walletBalance - cartTotal);

  return (
    <div className="space-y-6">
      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/30">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-destructive text-sm">Pesanan gagal dibuat</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="flex-shrink-0 text-destructive hover:text-destructive/80 transition-colors"
            aria-label="Tutup pesan error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {vendorEntries.map(([vendorId, items], idx) => {
            const vendorTotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
            const vendorName = (items[0] as { vendor_store_name?: string }).vendor_store_name;
            return (
              <div
                key={vendorId}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Vendor header */}
                <div className="flex items-center gap-2.5 px-5 py-3 bg-secondary/40 border-b border-border">
                  <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-semibold text-foreground">
                    {vendorName || `Vendor ${idx + 1}`}
                  </span>
                  {vendorCount > 1 && (
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                      Pesanan {idx + 1}/{vendorCount}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="p-5 space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <ProductAvatar
                        images={item.product_images}
                        categoryName={item.category_name}
                        name={item.product_name}
                        className="h-9 w-9 flex-shrink-0 rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatIDR(Number(item.price))} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground flex-shrink-0">
                        {formatIDR(Number(item.subtotal))}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Vendor subtotal */}
                <div className="flex items-center justify-between px-5 py-3 bg-secondary/20 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Subtotal
                  </span>
                  <span className="text-sm font-bold text-foreground">{formatIDR(vendorTotal)}</span>
                </div>
              </div>
            );
          })}

          {/* Payment method */}
          

        </div>

        {/* Summary — 1/3 sticky */}
        <div className="sticky top-6 self-start lg:h-fit">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-foreground">Ringkasan Pembayaran</h3>

            <div className="space-y-2.5 text-sm pb-4 border-b border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Belanja</span>
                <span className="font-semibold text-foreground">{formatIDR(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Dompet Dipakai</span>
                <span className="font-semibold text-emerald-600">−{formatIDR(cartTotal)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-foreground text-sm">Total Dibayar</span>
              <span className="text-xl font-black text-emerald-600">{formatIDR(cartTotal)}</span>
            </div>

            <div className="rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Saldo saat ini</span>
                <span className="font-semibold text-foreground">{formatIDR(walletBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo setelah bayar</span>
                <span className="font-semibold text-foreground">{formatIDR(remainingBalance)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
