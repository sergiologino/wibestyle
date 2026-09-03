import { describe, expect, it } from "vitest";
import { getSeoPage, seoPages } from "./seo-pages";

const requiredSlugs = [
  "/kak-rabotaet",
  "/ai-primerka",
  "/dlya-devushek",
  "/marketpleysy/wildberries",
  "/faq",
  "/privacy",
  "/makiyazh",
];

describe("seo-pages", () => {
  it("contains all required routes", () => {
    const slugs = seoPages.map((p) => p.slug);
    for (const slug of requiredSlugs) {
      expect(slugs).toContain(slug);
    }
  });

  it("getSeoPage returns page by slug", () => {
    const page = getSeoPage("/ai-primerka");
    expect(page?.h1).toContain("Нейропримерка");
  });

  it("discloses package-based billing in the public terms", () => {
    const terms = getSeoPage("/terms");
    const packages = terms?.sections.find((section) => section.title.startsWith("7. Пакеты примерок"));
    const usage = terms?.sections.find((section) => section.title.startsWith("8. Использование"));

    expect(packages?.body).toContain("Подписки по срокам");
    expect(packages?.body).toContain("количество примерок");
    expect(usage?.body).toContain("разовой покупкой");
    expect(usage?.body).toContain("Автоматическое продление");
  });

  it("each page has title, description, h1, intro", () => {
    for (const page of seoPages) {
      expect(page.title.length).toBeGreaterThan(5);
      expect(page.description.length).toBeGreaterThan(20);
      expect(page.h1.length).toBeGreaterThan(3);
      expect(page.intro.length).toBeGreaterThan(10);
    }
  });
});
