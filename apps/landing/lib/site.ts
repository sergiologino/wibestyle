export const siteConfig = {
  name: "Я на стиле",
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "https://yanastile.app",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.vibestyle.art",
  rustoreUrl: process.env.NEXT_PUBLIC_RUSTORE_URL?.trim() || null,
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
