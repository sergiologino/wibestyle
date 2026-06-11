import { existsSync } from "node:fs";
import { join } from "node:path";

const ASSET_DIR = "/assets/female-cards";
const PUBLIC_ASSET_DIR = join(process.cwd(), "public", "assets", "female-cards");
const IMAGE_EXTENSIONS = ["webp", "jpg", "jpeg", "png", "avif"] as const;

export type FemaleExampleMedia =
  | { type: "video"; src: string; poster?: string }
  | { type: "image"; src: string };

export type FemaleExampleCard = {
  id: string;
  fileBase: string;
  media: FemaleExampleMedia;
  alt: string;
  title: string;
  subtitle: string;
};

type FemaleExampleCardSource = Omit<FemaleExampleCard, "media">;

function publicAssetExists(fileName: string) {
  return existsSync(join(PUBLIC_ASSET_DIR, fileName));
}

export function resolveFemaleExampleMedia(fileBase: string): FemaleExampleMedia {
  const videoName = `${fileBase}.mp4`;
  const posterName = IMAGE_EXTENSIONS.map((ext) => `${fileBase}.${ext}`).find(publicAssetExists);

  if (publicAssetExists(videoName)) {
    return {
      type: "video",
      src: `${ASSET_DIR}/${videoName}`,
      poster: posterName ? `${ASSET_DIR}/${posterName}` : undefined,
    };
  }

  if (posterName) {
    return { type: "image", src: `${ASSET_DIR}/${posterName}` };
  }

  return { type: "image", src: `${ASSET_DIR}/${fileBase}.png` };
}

// Replace files in /public/assets/female-cards/.
// Matching rule: look-1.mp4 wins; otherwise look-1.webp/jpg/jpeg/png/avif is used.
const femaleExampleCardSources: FemaleExampleCardSource[] = [
  {
    id: "dress",
    fileBase: "look-1",
    alt: "Пример AI-примерки платья на девушке",
    title: "Платье",
    subtitle: "До покупки видно силуэт и настроение",
  },
  {
    id: "office",
    fileBase: "look-2",
    alt: "Пример AI-примерки офисного образа",
    title: "Офис",
    subtitle: "Пиджак, брюки и аксессуары в одном look",
  },
  {
    id: "evening",
    fileBase: "look-3",
    alt: "Пример AI-примерки вечернего образа",
    title: "Вечер",
    subtitle: "Проверь образ для выхода заранее",
  },
  {
    id: "city",
    fileBase: "look-4",
    alt: "Пример AI-примерки городского образа",
    title: "Город",
    subtitle: "Пальто, обувь и пропорции в полный рост",
  },
];

export const femaleExampleCards: FemaleExampleCard[] = femaleExampleCardSources.map((card) => ({
  ...card,
  media: resolveFemaleExampleMedia(card.fileBase),
}));
