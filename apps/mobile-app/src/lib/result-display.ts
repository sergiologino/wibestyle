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
