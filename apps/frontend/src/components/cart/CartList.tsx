import { useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { CartItem } from "./CartItem";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

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
    setIsClearing(true);
    setError(null);
    try {
      await onClearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengosongkan keranjang");
    } finally {
      setIsClearing(false);
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />}
        title="Keranjang Kosong"
        description="Mulai tambahkan produk ke keranjang Anda"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/30">
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-destructive hover:text-destructive/80 transition-colors"
            aria-label="Tutup pesan error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-3">
        {isLoading && items.length === 0
          ? // Show 3 skeleton items while loading
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg animate-pulse"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            ))
          : items.map((item) => (
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
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleClearCart}
            disabled={isClearing || isLoading}
            className="w-full py-2 text-sm font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? "Menghapus..." : "Kosongkan Keranjang"}
          </button>
        </div>
      )}
    </div>
  );
}
