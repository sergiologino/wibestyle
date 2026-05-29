import type { GarmentCategory, ProductPreview } from "@wibestyle/shared-types";

export type TryOnLinkStep = "paste_link" | "preview" | "size" | "generating" | "result";

export function detectMarketplace(url: string): ProductPreview["marketplace"] {
  const lower = url.toLowerCase();
  if (lower.includes("wildberries") || lower.includes("wb.ru")) return "wildberries";
  if (lower.includes("ozon")) return "ozon";
  return "other";
}

export function buildMockProduct(url: string): ProductPreview {
  const marketplace = detectMarketplace(url);
  return {
    id: `product_${Date.now()}`,
    marketplace,
    title: marketplace === "wildberries" ? "Лёгкое платье миди" : "Пиджак oversize",
    brand: marketplace === "wildberries" ? "Brand Look" : "Urban Line",
    priceRub: marketplace === "wildberries" ? 4290 : 6890,
    imageUrl: "/assets/demo-garment.svg",
    sizes: ["XS", "S", "M", "L", "XL"],
    productUrl: url,
  };
}

export const DEFAULT_TRYON_SIZES = ["XS", "S", "M", "L", "XL"] as const;

export const GARMENT_CATEGORY_LABELS: Record<GarmentCategory, string> = {
  dress: "Платье",
  top: "Верх",
  pants: "Брюки",
  jacket: "Пиджак",
  shoes: "Обувь",
  accessory: "Аксессуар",
  other: "Другое",
};

export function inferGarmentCategory(fileName: string): GarmentCategory {
  const lower = fileName.toLowerCase();
  if (lower.includes("dress") || lower.includes("plat")) return "dress";
  if (lower.includes("shoe") || lower.includes("obuv")) return "shoes";
  if (lower.includes("jacket") || lower.includes("pidzh")) return "jacket";
  return "other";
}

export function buildPhotoProductPreview(
  file: File,
  category: GarmentCategory,
  previewUrl: string,
): ProductPreview {
  return {
    id: `photo_${Date.now()}`,
    marketplace: "other",
    title: GARMENT_CATEGORY_LABELS[category],
    brand: "Фото из галереи",
    priceRub: 0,
    imageUrl: previewUrl,
    sizes: [...DEFAULT_TRYON_SIZES],
    productUrl: "",
    categories: [category],
  };
}
