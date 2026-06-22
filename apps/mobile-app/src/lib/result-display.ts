export function formatProductMeta(input: {
  brand?: string | null;
  priceRub?: number | null;
  selectedSize?: string | null;
}): string {
  return [
    input.brand?.trim() || null,
    typeof input.priceRub === "number" ? `${input.priceRub.toLocaleString("ru-RU")} ₽` : null,
    input.selectedSize?.trim() || null,
  ].filter(Boolean).join(" · ");
}

export function buildPublicPostUrl(input: {
  appBaseUrl: string;
  publicUrl?: string | null;
  slug: string;
}): string {
  const publicPath = input.publicUrl || `/p/${input.slug}`;
  if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
    return publicPath;
  }
  const base = input.appBaseUrl.replace(/\/$/, "");
  return `${base}${publicPath.startsWith("/") ? publicPath : `/${publicPath}`}`;
}
