export type HeroCollageLook = {
  id: string;
  title: string;
  image: string;
  alt: string;
  className: string;
};

export const heroCollageLooks: HeroCollageLook[] = [
  {
    id: "summer",
    title: "Летний вайб",
    image: "/assets/female-card-1.png",
    alt: "Летний образ после AI-примерки",
    className: "hero-look-card--summer",
  },
  {
    id: "office",
    title: "Офисный шик",
    image: "/assets/female-card-2.png",
    alt: "Офисный образ после AI-примерки",
    className: "hero-look-card--office",
  },
  {
    id: "evening",
    title: "Вечерний образ",
    image: "/assets/female-card-3.png",
    alt: "Вечерний образ после AI-примерки",
    className: "hero-look-card--evening",
  },
  {
    id: "city",
    title: "Стиль в городе",
    image: "/assets/female-card-4.png",
    alt: "Городской образ после AI-примерки",
    className: "hero-look-card--city",
  },
];

export const heroProductCard = {
  marketplace: "Wildberries",
  title: "Костюм Love Republic",
  price: "7 999 ₽",
  image: "/assets/female-card-1.png",
  alt: "Карточка товара для AI-примерки",
} as const;
