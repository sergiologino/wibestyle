function normalizePublicUrl(value: string | undefined, fallback: string, defaultPath = ""): string {
  const raw = value?.trim();
  if (!raw) return fallback;

  try {
    const url = new URL(raw.startsWith("//") ? `https:${raw}` : /^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (defaultPath && url.pathname === "/") {
      url.pathname = defaultPath;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export const siteConfig = {
  name: "Я на стиле",
  domain: normalizePublicUrl(process.env.NEXT_PUBLIC_SITE_URL, "https://vibestyle.art"),
  appUrl: normalizePublicUrl(process.env.NEXT_PUBLIC_APP_URL, "https://app.vibestyle.art/home", "/home"),
  rustoreUrl: normalizePublicUrl(process.env.NEXT_PUBLIC_RUSTORE_URL, "https://www.rustore.ru/catalog/app/ru.vibestyle.app"),
  description:
    "Виртуальный персональный стилист и нейропримерочная для полного образа: одежда с маркетплейсов, стрижки, причёски, цвет волос и макияж по фото.",
  locale: "ru_RU",
  themeColor: "#ff1fa2",
} as const;

export const pricing = {
  tryOn20Rub: 400,
  tryOn50Rub: 900,
  tryOn100Rub: 1600,
  recommendedPackageTryOns: 50,
  get minTryOnUnitRub() {
    return Math.round(this.tryOn20Rub / 20);
  },
} as const;
