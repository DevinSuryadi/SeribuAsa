import { CartList } from "@/components/cart/CartList";
import { CartSummary } from "@/components/cart/CartSummary";
import type { CartItemData } from "@/types/checkout";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

interface CartReviewStepProps {
  items: CartItemData[];
  isLoading: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onClearCart: () => Promise<void>;
  walletBalance: number;
}

/**
 * CartReviewStep — Step 1 of checkout.
 * Shows cart items + wallet balance status in one view (replaces old Step 2 WalletReviewStep).
 */
export function CartReviewStep({
  items,
  isLoading,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  walletBalance,
}: CartReviewStepProps) {
  const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const canAfford = walletBalance >= totalAmount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Tinjau Keranjang</h2>
        <p className="text-sm text-muted-foreground">
          Periksa item dan pastikan saldo Dompet Nutrisi Anda mencukupi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items — 2/3 */}
        <div className="lg:col-span-2">
          <CartList
            items={items}
            isLoading={isLoading}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemoveItem}
            onClearCart={onClearCart}
          />
        </div>

        {/* Summary — 1/3, sticky on desktop */}
        <div className="lg:sticky lg:top-24 h-fit space-y-3">
          <CartSummary
            totalAmount={totalAmount}
            walletBalance={walletBalance}
            canAfford={canAfford}
            isLoading={isLoading}
          />

          {!canAfford && totalAmount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              💡 Kurangi jumlah item atau hapus produk termahal untuk melanjutkan checkout.
            </div>
          )}
        </div>
      </div>

      {/* Continue shopping */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Link
            to="/dashboard/katalog"
            className="text-sm text-primary hover:underline font-medium"
          >
            Tambah produk lainnya
          </Link>
        </div>
      )}
    </div>
  );
}
