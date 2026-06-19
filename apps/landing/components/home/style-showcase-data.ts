export type StyleShowcaseItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  badge: string;
  href: string;
};

// Temporary demo assets. Replace image paths with production photos when they are ready.
export const styleShowcaseItems: StyleShowcaseItem[] = [
  {
    id: "casual",
    title: "Casual",
    subtitle: "Брюки, кофта, лёгкая обувь",
    image: "/assets/female-card-4.png",
    alt: "Casual образ после нейропримерки одежды",
    badge: "на каждый день",
    href: "/dlya-devushek",
  },
  {
    id: "office",
    title: "Office",
    subtitle: "Пиджак, юбка, блузка",
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
    title: "Men's style",
    subtitle: "Пиджак, часы, обувь",
    image: "/assets/hero-collage.png",
    alt: "Мужской стиль с пиджаком и аксессуарами",
    badge: "для него",
    href: "/dlya-muzhchin",
  },
];
