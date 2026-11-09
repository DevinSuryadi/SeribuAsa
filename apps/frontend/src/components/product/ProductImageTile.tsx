import { useState } from "react";
import { getVisualFromCategory } from "@/components/product/ProductAvatar";

export function ProductImageTile({ images, name, categoryName }: { images?: string[] | null; name: string; categoryName?: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = images?.[0];

  return (
    <div className="m-2 mb-0 flex aspect-[3/2] items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f7]">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className="text-5xl transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
        >
          {getVisualFromCategory(categoryName).emoji}
        </span>
      )}
    </div>
  );
}
