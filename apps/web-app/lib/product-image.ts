export function resolveProductImageUrl(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("/assets/")
  ) {
    return imageUrl;
  }
  // Marketplace images: same-origin via Next.js rewrite → avoids cross-port img failures in dev.
  if (imageUrl.startsWith("/api/v1/marketplaces/")) {
    return imageUrl;
  }
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
  if (imageUrl.startsWith("/api/")) {
    return `${base}${imageUrl}`;
  }
  return `${base}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

export function isMarketplaceProxyImageUrl(imageUrl: string): boolean {
  return imageUrl.startsWith("/api/v1/marketplaces/");
}

/** Public marketplace proxy — no Bearer token on <img>. */
export function isPublicProductImageUrl(imageUrl: string): boolean {
  return isMarketplaceProxyImageUrl(imageUrl);
}

/** Session garment snapshot — requires authenticated fetch (see GarmentImageService). */
export function isAuthenticatedProductImageUrl(imageUrl: string): boolean {
  return imageUrl.includes("/try-on/sessions/") && imageUrl.endsWith("/garment-photo");
}
