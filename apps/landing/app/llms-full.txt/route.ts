import { seoPages } from "@/content/seo-pages";
import { homeFaq } from "@/content/home-faq";
import { pricing, siteConfig } from "@/lib/site";

export function GET() {
  const blocks = seoPages.map(
    (p) => {
      const keywords = p.keywords?.length ? `\nКлючевые темы: ${p.keywords.join(", ")}` : "";
      const faq = p.faq.length
        ? `\nFAQ:\n${p.faq.map((item) => `- ${item.q}: ${item.a}`).join("\n")}`
        : "";

      return `### ${p.h1}\nURL: ${siteConfig.domain}${p.slug}\n${p.intro}${keywords}${faq}\n`;
    },
  );

  const body = [
    `# ${siteConfig.name} — полный обзор`,
    "",
    siteConfig.description,
    "",
    "## Тарифы",
    `Подписки по срокам нет. Доступны одноразовые пакеты примерок: 20 примерок — ${pricing.tryOn20Rub} ₽, 50 примерок — ${pricing.tryOn50Rub} ₽, 100 примерок — ${pricing.tryOn100Rub} ₽.`,
    "",
    "## Индексируемый FAQ для ИИ",
    ...homeFaq.map((item) => `- ${item.q}: ${item.a}`),
    "",
    "## Страницы",
    ...blocks,
    "",
    "## Ограничения",
    "AI-примерка не гарантирует точную посадку. Нет официальной интеграции с маркетплейсами — только ссылки на товары.",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
