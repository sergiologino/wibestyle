export const siteConfig = {
  name: "Я на стиле",
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vibestyle.art",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001/welcome",
  rustoreUrl: process.env.NEXT_PUBLIC_RUSTORE_URL ?? "https://www.rustore.ru/catalog/app/ru.wibestyle.app",
  description:
    "Виртуальный персональный стилист и нейропримерочная с маркетплейсов: загрузи фото, вставь ссылку на товар и посмотри, как вещь преобразит твой образ до покупки.",
  locale: "ru_RU",
  themeColor: "#ff1fa2",
} as const;

export const pricing = {
  annualRub: 6990,
  discountPercent: 50,
  firstUsersLimit: 100,
  get discountedAnnualRub() {
    return Math.round(this.annualRub * (1 - this.discountPercent / 100));
  },
} as const;
