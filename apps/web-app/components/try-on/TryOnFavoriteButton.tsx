"use client";

import clsx from "clsx";
import type { ProductPreview } from "@wibestyle/shared-types";
import { canFavoriteTryOnProduct, favoriteProductKey } from "@/lib/try-on-product";

type Props = {
  product: ProductPreview;
  isFavorite: boolean;
  loading: boolean;
  onToggle: () => void;
};

export default function TryOnFavoriteButton({ product, isFavorite, loading, onToggle }: Props) {
  if (!canFavoriteTryOnProduct(product)) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={isFavorite}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
        isFavorite
          ? "border-[#ff1fa2] bg-[#fff0f9] text-[#ff1fa2]"
          : "border-[#ffd1ed] bg-white text-[#6d6273] hover:border-[#ff1fa2] hover:text-[#ff1fa2]",
        loading && "opacity-60",
      )}
      disabled={loading}
      onClick={onToggle}
    >
      <span aria-hidden className={clsx("text-base leading-none transition-transform", isFavorite && "scale-110")}>
        {isFavorite ? "♥" : "♡"}
      </span>
      <span>{isFavorite ? "В избранном" : "Понравилось"}</span>
    </button>
  );
}

export { favoriteProductKey };
