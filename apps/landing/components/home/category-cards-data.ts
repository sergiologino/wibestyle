import { existsSync } from "node:fs";
import { join } from "node:path";

const ASSET_DIR = "/assets/category-cards";
const PUBLIC_ASSET_DIR = join(process.cwd(), "public", "assets", "category-cards");
const IMAGE_EXTENSIONS = ["png", "webp", "jpg", "jpeg", "avif"] as const;

export const CATEGORY_CARD_FILE_BASES = ["dress", "shoes", "office", "evening", "men"] as const;

type FileExists = (fileName: string) => boolean;

function publicAssetExists(fileName: string) {
  return existsSync(join(PUBLIC_ASSET_DIR, fileName));
}

export function resolveCategoryCardImage(fileBase: string, fileExists: FileExists = publicAssetExists) {
  const fileName = IMAGE_EXTENSIONS.map((extension) => `${fileBase}.${extension}`).find(fileExists);
  return fileName ? `${ASSET_DIR}/${fileName}` : undefined;
}

const categoryCardSources = [
  { id: "dress", fileBase: "dress", className: "card-dress", title: "Платья", sub: "полный рост", href: "/primerka-platya" },
  { id: "shoes", fileBase: "shoes", className: "card-shoes", title: "Обувь", sub: "крупный план + образ", href: "/primerka-obuvi" },
  { id: "office", fileBase: "office", className: "card-office", title: "Офис", sub: "пиджак, брюки, сумка", href: "/primerka-pidzhaka" },
  { id: "evening", fileBase: "evening", className: "card-party", title: "Вечер", sub: "платье, макияж, свет", href: "/dlya-devushek" },
  { id: "men", fileBase: "men", className: "card-men", title: "Для него", sub: "часы, галстук, обувь", href: "/dlya-muzhchin" },
] as const;

export const categoryCards = categoryCardSources.map((card) => ({
  ...card,
  image: resolveCategoryCardImage(card.fileBase),
}));
