import type { ProductPreview } from "@wibestyle/shared-types";

export function formatProductPriceRub(priceRub?: number): string | null {
  if (priceRub == null || priceRub <= 0) {
    return null;
  }
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

export function marketplaceLabel(marketplace?: string): string {
  switch (marketplace) {
    case "wildberries":
      return "Wildberries";
    case "ozon":
      return "Ozon";
    default:
      return "Товар";
  }
}

export function favoriteProductKey(product: Pick<ProductPreview, "marketplace" | "id">): string {
  return `${product.marketplace}:${product.id}`;
}

/** Favorites need a stable marketplace product id and link back to the card. */
export function canFavoriteTryOnProduct(product?: ProductPreview | null): product is ProductPreview {
  if (!product?.id || !product.marketplace) {
    return false;
  }
  return product.marketplace !== "other" && Boolean(product.productUrl);
}

export function shouldShowProductBanner(product?: ProductPreview | null, selectedSize?: string): boolean {
  return Boolean(product?.title || selectedSize);
}

export function productBannerHref(product?: ProductPreview | null): string | null {
  const url = product?.productUrl?.trim();
  if (!url) {
    return null;
  }
  return url;
}
