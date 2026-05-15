export type ImageSlot = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

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
  /** Замените на свои close-up фото макияжа в /public/assets/makeup/ */
  makeupEveningBefore: {
    src: "/assets/female-card-1.png",
    alt: "Девушка до примерки вечернего макияжа — базовый образ",
    width: 600,
    height: 800,
  },
  makeupEveningAfter: {
    src: "/assets/female-card-3.png",
    alt: "Вечерний макияж и образ после нейростилиста",
    width: 600,
    height: 800,
  },
  makeupLightBefore: {
    src: "/assets/female-card-2.png",
    alt: "Образ до — насыщенный макияж, требующий смягчения",
    width: 600,
    height: 800,
  },
  makeupLightAfter: {
    src: "/assets/female-card-4.png",
    alt: "Лёгкий стильный макияж и цельный look — после",
    width: 600,
    height: 800,
  },
} satisfies Record<string, ImageSlot>;
