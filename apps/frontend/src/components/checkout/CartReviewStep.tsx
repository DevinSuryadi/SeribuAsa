import { CartList } from "@/components/cart/CartList";
import { CartSummary } from "@/components/cart/CartSummary";
import { CartItemData } from "@/types/checkout";
import { Link } from "react-router-dom";

interface CartReviewStepProps {
  items: CartItemData[];
  isLoading: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onClearCart: () => Promise<void>;
  voucherBalance: number;
}

/**
 * CartReviewStep - Step 1 of checkout
 * Displays all cart items with ability to edit quantities
 */
export function CartReviewStep({
  items,
  isLoading,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  voucherBalance,
}: CartReviewStepProps) {
  const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const eligibleAmount = totalAmount; // Simplified - backend determines eligibility
  const maxVoucher = Math.min(voucherBalance, eligibleAmount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tinjau Keranjang</h2>
        <p className="text-gray-600">Periksa item Anda dan perbarui jumlah jika diperlukan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <CartList
            items={items}
            isLoading={isLoading}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemoveItem}
            onClearCart={onClearCart}
          />
        </div>

        {/* Cart Summary - 1/3 width on desktop */}
        <div>
          <CartSummary
            totalAmount={totalAmount}
            eligibleAmount={eligibleAmount}
            ineligibleAmount={0}
            voucherBalance={voucherBalance}
            maxVoucherApplicable={maxVoucher}
          />
        </div>
      </div>

      {/* Continue Shopping Link */}
      {items.length > 0 && (
        <div className="text-center pt-4 border-t border-gray-200">
          <Link
            to="/dashboard/katalog"
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
          >
            ← Lanjutkan Berbelanja
          </Link>
        </div>
      )}
    </div>
  );
}
