import { useState } from "react";
import { Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { formatIDR } from "@/lib/format";

interface CartItemProps {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  isLoading?: boolean;
  categoryName?: string;
  images?: string[];
  availableStock?: number;
}

import { ProductAvatar } from "@/components/product/ProductAvatar";

export function CartItem({
  id,
  productName,
  quantity,
  price,
  subtotal,
  onUpdateQuantity,
  onRemove,
  isLoading = false,
  categoryName,
  images = [],
  availableStock,
}: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const maxQuantity = Math.max(0, Math.min(100, availableStock ?? 100));
  const isStockLimited = availableStock !== undefined;
  const isOutOfStock = isStockLimited && maxQuantity <= 0;

  const handleQty = async (newQty: number) => {
    if (newQty < 1 || newQty > maxQuantity || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(id, newQty);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await onRemove(id);
    } finally {
      setIsUpdating(false);
    }
  };

  const busy = isUpdating || isLoading;

  return (
    <div
      className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
        isOutOfStock
          ? "border-slate-200 bg-slate-50 opacity-75"
          : "border-border/80 bg-card hover:border-border hover:shadow-sm"
      }`}
    >
      {/* Product icon */}
      <ProductAvatar
        images={images}
        categoryName={categoryName || "Produk"}
        name={productName}
        className="h-12 w-12 rounded-xl flex-shrink-0"
      />

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{productName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatIDR(price)} / satuan</p>
        {isStockLimited && (
          <p className={`text-[11px] mt-1 ${quantity > maxQuantity ? "text-destructive" : "text-muted-foreground"}`}>
            {isOutOfStock ? "Stok habis" : `Stok tersedia: ${maxQuantity}`}
          </p>
        )}
      </div>

      {/* Qty stepper */}
      <div className="flex items-center gap-0.5 rounded-xl border border-border overflow-hidden bg-secondary/30 flex-shrink-0">
        <button
          type="button"
          onClick={() => handleQty(quantity - 1)}
          disabled={busy || quantity <= 1}
          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Kurangi"
        >
          <Minus className="h-3 w-3" aria-hidden="true" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-foreground">
          {busy ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : quantity}
        </span>
        <button
          type="button"
          onClick={() => handleQty(quantity + 1)}
          disabled={busy || quantity >= maxQuantity}
          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Tambah"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0 w-24 hidden sm:block">
        <p className="text-sm font-black text-foreground">{formatIDR(subtotal)}</p>
        <p className="text-[10px] text-muted-foreground">
          {quantity} × {formatIDR(price)}
        </p>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={handleRemove}
        disabled={busy}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
        aria-label={`Hapus ${productName}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
