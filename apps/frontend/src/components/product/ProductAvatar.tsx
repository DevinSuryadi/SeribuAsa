/**
 * ProductAvatar — Progressive image component for products.
 *
 * Priority:
 *  1. product.images[0] (actual photo from vendor)
 *  2. category-based gradient + emoji (deterministic fallback, no DB change needed)
 *
 * Usage:
 *  <ProductAvatar categoryName="Sayuran" images={product.images} name="Bayam" className="h-12 w-12" />
 */

import { useState } from "react";

// ── Category → visual config ────────────────────────────────────
interface CategoryVisual {
  emoji: string;
  from: string;
  to: string;
  label: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  // Food staples
  pokok:    { emoji: "🌾", from: "#d97706", to: "#92400e", label: "Makanan Pokok" },
  beras:    { emoji: "🌾", from: "#d97706", to: "#92400e", label: "Beras" },
  gandum:   { emoji: "🌾", from: "#d97706", to: "#92400e", label: "Gandum" },

  // Protein
  protein:  { emoji: "🥚", from: "#f59e0b", to: "#b45309", label: "Protein" },
  telur:    { emoji: "🥚", from: "#f59e0b", to: "#b45309", label: "Telur" },
  daging:   { emoji: "🥩", from: "#dc2626", to: "#991b1b", label: "Daging" },
  ikan:     { emoji: "🐟", from: "#0ea5e9", to: "#0369a1", label: "Ikan" },
  ayam:     { emoji: "🍗", from: "#f97316", to: "#c2410c", label: "Ayam" },

  // Dairy
  susu:     { emoji: "🥛", from: "#3b82f6", to: "#1d4ed8", label: "Susu" },
  dairy:    { emoji: "🧀", from: "#eab308", to: "#a16207", label: "Dairy" },

  // Vegetables
  sayuran:  { emoji: "🥦", from: "#16a34a", to: "#14532d", label: "Sayuran" },
  sayur:    { emoji: "🥬", from: "#16a34a", to: "#14532d", label: "Sayur" },
  wortel:   { emoji: "🥕", from: "#f97316", to: "#c2410c", label: "Wortel" },
  tomat:    { emoji: "🍅", from: "#ef4444", to: "#b91c1c", label: "Tomat" },
  bayam:    { emoji: "🥬", from: "#15803d", to: "#14532d", label: "Bayam" },

  // Fruits
  buah:     { emoji: "🍎", from: "#ec4899", to: "#be185d", label: "Buah" },
  fruit:    { emoji: "🍊", from: "#f97316", to: "#ea580c", label: "Buah" },
  pisang:   { emoji: "🍌", from: "#eab308", to: "#a16207", label: "Pisang" },
  apel:     { emoji: "🍎", from: "#dc2626", to: "#991b1b", label: "Apel" },
  jeruk:    { emoji: "🍊", from: "#f97316", to: "#ea580c", label: "Jeruk" },

  // Snacks & processed
  snack:    { emoji: "🍪", from: "#a78bfa", to: "#6d28d9", label: "Snack" },
  camilan:  { emoji: "🍿", from: "#a78bfa", to: "#6d28d9", label: "Camilan" },
  kue:      { emoji: "🎂", from: "#f472b6", to: "#db2777", label: "Kue" },

  // Condiments
  bumbu:    { emoji: "🧄", from: "#84cc16", to: "#4d7c0f", label: "Bumbu" },
  minyak:   { emoji: "🫙", from: "#fbbf24", to: "#d97706", label: "Minyak" },

  // Beverages
  minuman:  { emoji: "🧃", from: "#06b6d4", to: "#0e7490", label: "Minuman" },
  jus:      { emoji: "🧃", from: "#10b981", to: "#065f46", label: "Jus" },

  // Default
  default:  { emoji: "🛒", from: "#059669", to: "#047857", label: "Produk" },
};

function getVisualFromCategory(categoryName?: string | null): CategoryVisual {
  if (!categoryName) return CATEGORY_VISUALS.default;
  const key = categoryName.toLowerCase().trim();
  // Exact match first
  if (CATEGORY_VISUALS[key]) return CATEGORY_VISUALS[key];
  // Partial match
  for (const [k, v] of Object.entries(CATEGORY_VISUALS)) {
    if (k === "default") continue;
    if (key.includes(k) || k.includes(key)) return v;
  }
  return CATEGORY_VISUALS.default;
}

// ── Component ───────────────────────────────────────────────────
interface ProductAvatarProps {
  /** First URL will be used, falls back to gradient */
  images?: string[] | null;
  /** Category name for gradient fallback */
  categoryName?: string | null;
  /** Product name (used for alt text) */
  name?: string;
  /** Tailwind classes for width/height, e.g. "h-12 w-12" */
  className?: string;
  /** Extra Tailwind classes for the gradient fallback container */
  fallbackClassName?: string;
  /** Size of the emoji in the fallback */
  emojiSize?: string;
}

export function ProductAvatar({
  images,
  categoryName,
  name = "Produk",
  className = "h-12 w-12",
  fallbackClassName = "",
  emojiSize = "text-2xl",
}: ProductAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;
  const visual = getVisualFromCategory(categoryName);

  // If has valid image URL and no load error → show real image
  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${className} object-cover rounded-xl`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Gradient fallback
  return (
    <div
      className={`${className} ${fallbackClassName} flex-shrink-0 flex items-center justify-center rounded-xl`}
      style={{ background: `linear-gradient(135deg, ${visual.from} 0%, ${visual.to} 100%)` }}
      role="img"
      aria-label={name}
    >
      <span className={emojiSize} aria-hidden="true">{visual.emoji}</span>
    </div>
  );
}

/**
 * ProductAvatarLarge — Larger hero variant for product detail dialogs.
 * Same logic but styled for the top of a product card/modal.
 */
export function ProductAvatarLarge({
  images,
  categoryName,
  name = "Produk",
  className = "aspect-[4/3] w-full",
}: Pick<ProductAvatarProps, "images" | "categoryName" | "name" | "className">) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;
  const visual = getVisualFromCategory(categoryName);

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${className} object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center relative overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${visual.from} 0%, ${visual.to} 100%)` }}
      role="img"
      aria-label={name}
    >
      {/* Decorative background blobs */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-black/10 blur-xl pointer-events-none" />
      <span className="relative z-10 text-5xl" aria-hidden="true">{visual.emoji}</span>
    </div>
  );
}

// Re-export helper for use in plain JS contexts
export { getVisualFromCategory };
