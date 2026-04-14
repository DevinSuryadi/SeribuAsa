import { useState } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItemProps {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * CartItem component for displaying and managing individual cart items
 */
export function CartItem({
  id,
  productName,
  quantity,
  price,
  subtotal,
  onUpdateQuantity,
  onRemove,
  isLoading = false,
}: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 100) return;

    setIsUpdating(true);
    setError(null);
    try {
      await onUpdateQuantity(id, newQuantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await onRemove(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{productName}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Rp {price.toLocaleString("id-ID")} × {quantity} =
          <span className="font-medium text-gray-900"> Rp {subtotal.toLocaleString("id-ID")}</span>
        </p>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-3 ml-4">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={isUpdating || isLoading || quantity <= 1}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus size={16} className="text-gray-600" />
          </button>
          <span className="px-3 py-2 text-sm font-medium text-gray-900 min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={isUpdating || isLoading || quantity >= 100}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isUpdating || isLoading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  );
}
