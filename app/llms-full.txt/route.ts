import { seoPages } from "@/content/seo-pages";
import { pricing, siteConfig } from "@/lib/site";

export function GET() {
  const blocks = seoPages.map(
    (p) => `### ${p.h1}\nURL: ${siteConfig.domain}${p.slug}\n${p.intro}\n`,
  );

  const body = [
    `# ${siteConfig.name} — полный обзор`,
    "",
    siteConfig.description,
    "",
    "## Тариф",
    `Годовая подписка ${pricing.annualRub} ₽. Первые ${pricing.firstUsersLimit} — ${pricing.discountedAnnualRub} ₽ (−${pricing.discountPercent}%).`,
    "",
    "## Страницы",
    ...blocks,
    "",
    "## Ограничения",
    "AI-примерка не гарантирует точную посадку. Нет официальной интеграции с маркетплейсами — только ссылки на товары.",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
