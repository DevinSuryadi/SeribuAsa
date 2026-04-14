import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { CartItem } from "./CartItem";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface CartItemData {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

interface CartListProps {
  items: CartItemData[];
  isLoading?: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  onClearCart: () => Promise<void>;
}

/**
 * CartList component for displaying all cart items
 */
export function CartList({
  items,
  isLoading = false,
  onUpdateQuantity,
  onRemove,
  onClearCart,
}: CartListProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) return;

    setIsClearing(true);
    setError(null);
    try {
      await onClearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cart");
    } finally {
      setIsClearing(false);
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Keranjang Kosong"
        description="Mulai tambahkan produk ke keranjang Anda"
        color="blue"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <CartItem
            key={item.id}
            id={item.id}
            productName={item.product_name}
            quantity={item.quantity}
            price={Number(item.price)}
            subtotal={Number(item.subtotal)}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Clear Cart Button */}
      {items.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleClearCart}
            disabled={isClearing || isLoading}
            className="w-full py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? "Menghapus..." : "Kosongkan Keranjang"}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Memperbarui keranjang...</p>
        </div>
      )}
    </div>
  );
}
