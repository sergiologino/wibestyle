import { existsSync } from "node:fs";
import path from "node:path";

export type ImageSlot = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

const publicRoots = [
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "apps", "landing", "public"),
];

function publicAssetWithWebpPriority(basePath: string) {
  const extensions = [".webp", ".png", ".jpg"];

  for (const extension of extensions) {
    const src = `${basePath}${extension}`;
    const relativePath = src.replace(/^\//, "");
    if (publicRoots.some((root) => existsSync(path.join(root, relativePath)))) {
      return src;
    }
  }

  return `${basePath}.webp`;
}

/** Замените только `src` на свои файлы в `/public/assets/`. */
export const imageSlots = {
  heroBefore: {
    src: "/assets/hero-before.png",
    alt: "Девушка до нейропримерки в базовой облегающей одежде",
    width: 660,
    height: 1180,
  },
  heroCollage: {
    src: "/assets/hero-collage.png",
    alt: "Коллаж нейропримерок: летнее платье, офисный образ, вечерний образ, пальто и обувь",
    width: 1200,
    height: 900,
  },
  beforeAfter: {
    src: "/assets/before-after.png",
    alt: "Карточки до и после нейропримерки одежды",
    width: 900,
    height: 660,
  },
  styles: {
    src: "/assets/styles.png",
    alt: "Стили Casual, Office, Party, Romantic и Men's style",
    width: 900,
    height: 660,
  },
  phoneMockups: {
    src: "/assets/phone-mockups.png",
    alt: "Мокап приложения Я на стиле с экраном примерки и сохранения образа",
    width: 800,
    height: 900,
  },
  ctaBags: {
    src: "/assets/cta-bags.png",
    alt: "Яркие shopping bags приложения Я на стиле",
    width: 840,
    height: 600,
  },
  qrDemo: {
    src: "/assets/qr-demo.png",
    alt: "Демо QR-код для установки приложения",
    width: 300,
    height: 300,
  },
  femaleCard1: {
    src: "/assets/female-card-1.png",
    alt: "Нейропримерка летнего платья на девушке",
    width: 600,
    height: 800,
  },
  femaleCard2: {
    src: "/assets/female-card-2.png",
    alt: "Нейропримерка офисного образа на девушке",
    width: 600,
    height: 800,
  },
  femaleCard3: {
    src: "/assets/female-card-3.png",
    alt: "Нейропримерка вечернего образа на девушке",
    width: 600,
    height: 800,
  },
  femaleCard4: {
    src: "/assets/female-card-4.png",
    alt: "Нейропримерка пальто и обуви на девушке",
    width: 600,
    height: 800,
  },
  hairstylePreview1: {
    src: publicAssetWithWebpPriority("/assets/hairstyles/hairstyle-preview-1"),
    alt: "Пример виртуальной примерки причёски",
    width: 600,
    height: 800,
  },
  hairstylePreview2: {
    src: publicAssetWithWebpPriority("/assets/hairstyles/hairstyle-preview-2"),
    alt: "Пример виртуальной примерки укладки и цвета волос",
    width: 600,
    height: 800,
  },
  hairstylePreview3: {
    src: publicAssetWithWebpPriority("/assets/hairstyles/hairstyle-preview-3"),
    alt: "Пример виртуальной примерки стрижки и формы волос",
    width: 600,
    height: 800,
  },
  hairstylePreview4: {
    src: publicAssetWithWebpPriority("/assets/hairstyles/hairstyle-preview-4"),
    alt: "Пример виртуального эксперимента с цветом волос",
    width: 600,
    height: 800,
  },
  /** Replaceable close-up makeup visuals in /public/assets/makeup/. */
  makeupEveningBefore: {
    src: "/assets/makeup/makeup-evening-before.png",
    alt: "Девушка до примерки вечернего макияжа — базовый образ",
    width: 600,
    height: 800,
  },
  makeupEveningAfter: {
    src: "/assets/makeup/makeup-evening-after.png",
    alt: "Вечерний макияж и образ после нейростилиста",
    width: 600,
    height: 800,
  },
  makeupLightBefore: {
    src: "/assets/makeup/makeup-light-before.png",
    alt: "Образ до — насыщенный макияж, требующий смягчения",
    width: 600,
    height: 800,
  },
  makeupLightAfter: {
    src: "/assets/makeup/makeup-light-after.png",
    alt: "Лёгкий стильный макияж и цельный look — после",
    width: 600,
    height: 800,
  },
  lookRequestFullLook: {
    src: "/assets/look-request/full-look.png",
    alt: "Полный лук с одеждой, обувью, аксессуарами и макияжем",
    width: 600,
    height: 800,
  },
  lookRequestAccessories: {
    src: "/assets/look-request/accessories.png",
    alt: "Аксессуары для полного образа: сумка, украшения и детали",
    width: 600,
    height: 800,
  },
  lookRequestShoes: {
    src: "/assets/look-request/shoes.png",
    alt: "Обувь как часть подобранного образа",
    width: 600,
    height: 800,
  },
  lookRequestMakeup: {
    src: "/assets/look-request/makeup.png",
    alt: "Макияж и укладка как часть полного образа",
    width: 600,
    height: 800,
  },
} satisfies Record<string, ImageSlot>;
