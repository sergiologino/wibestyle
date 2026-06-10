export type BeforeAfterItem = {
  id: string;
  beforeImage: string;
  beforeAlt: string;
  afterPosterImage: string;
  afterVideo: string;
  afterAlt: string;
  title?: string;
  subtitle?: string;
  labelBefore?: string;
  labelAfter?: string;
};

// Temporary demo assets live in /public/assets/before-after-demo/.
// Replace these paths with production photos/videos without changing the component.
export const beforeAfterItems: BeforeAfterItem[] = [
  {
    id: "dress",
    beforeImage: "/assets/before-after-demo/look-1-before.png",
    beforeAlt: "Фото до нейропримерки платья в базовой одежде",
    afterPosterImage: "/assets/before-after-demo/look-1-after-poster.png",
    afterVideo: "/assets/before-after-demo/look-1-after.mp4",
    afterAlt: "Видео после нейропримерки платья на фигуре",
    title: "Платье по ссылке",
    subtitle: "Силуэт, длина и цвет до покупки",
  },
  {
    id: "office",
    beforeImage: "/assets/before-after-demo/look-2-before.png",
    beforeAlt: "Фото до нейропримерки офисного образа",
    afterPosterImage: "/assets/before-after-demo/look-2-after-poster.png",
    afterVideo: "/assets/before-after-demo/look-2-after.mp4",
    afterAlt: "Видео после нейропримерки офисного образа",
    title: "Офисный look",
    subtitle: "Пиджак, брюки и общий баланс",
  },
];
