import { seoPages } from "@/content/seo-pages";
import { pricing, siteConfig } from "@/lib/site";

export function GET() {
  const lines = [
    `# ${siteConfig.name}`,
    "",
    siteConfig.description,
    "",
    "## Возможности",
    "- AI-примерка одежды по фото и ссылке с маркетплейса",
    "- Примерка причёсок, стрижек и цвета волос по фото",
    "- Виртуальный макияж онлайн по фото готовится к запуску",
    "- Персональный нейростилист для полного образа: одежда, обувь, аксессуары, причёска и макияж",
    "- Wildberries, Ozon, Яндекс Маркет и другие",
    "- Сохранение и шеринг образов",
    "- Приватный режим (скрытие лица)",
    "",
    "## Цена",
    `- Годовая подписка: ${pricing.annualRub} RUB`,
    `- Первые ${pricing.firstUsersLimit} участников: скидка ${pricing.discountPercent}% (${pricing.discountedAnnualRub} RUB/год)`,
    "",
    "## Ключевые страницы",
    ...seoPages.map((p) => `- ${siteConfig.domain}${p.slug} — ${p.h1}`),
    "",
    "## Будущие функции",
    "Макияж и полный образ — в ближайших релизах. Причёски, стрижки и цвет волос уже продвигаются как отдельный сценарий.",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
