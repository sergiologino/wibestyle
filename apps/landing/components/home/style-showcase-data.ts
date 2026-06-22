export type StyleShowcaseItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  badge: string;
  href: string;
};

export const styleShowcaseItems: StyleShowcaseItem[] = [
  {
    id: "casual",
    title: "Casual",
    subtitle: "Красная блузка, кофта и брюки",
    image: "/assets/female-card-4.png",
    alt: "Casual образ после нейропримерки одежды",
    badge: "на каждый день",
    href: "/dlya-devushek",
  },
  {
    id: "office",
    title: "Office",
    subtitle: "Пиджак, юбка и блузка",
    image: "/assets/female-card-2.png",
    alt: "Офисный стиль после нейропримерки",
    badge: "деловой look",
    href: "/primerka-pidzhaka",
  },
  {
    id: "party",
    title: "Party",
    subtitle: "Платье, свет, вечерний вайб",
    image: "/assets/female-card-3.png",
    alt: "Вечерний образ для вечеринки после нейропримерки",
    badge: "вау-эффект",
    href: "/primerka-platya",
  },
  {
    id: "romantic",
    title: "Romantic",
    subtitle: "Мягкие цвета и женственный силуэт",
    image: "/assets/female-card-1.png",
    alt: "Романтичный образ после нейропримерки",
    badge: "свидание",
    href: "/dlya-devushek",
  },
  {
    id: "men",
    title: "Вечер",
    subtitle: "Бордовое платье, каблуки и сумка",
    image: "/assets/style-showcase/men.png",
    alt: "Вечерний образ в бордовом платье с сумкой",
    badge: "для вечера",
    href: "/primerka-platya",
  },
];
