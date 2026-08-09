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

  it("discloses recurring-payment conditions in the public terms", () => {
    const terms = getSeoPage("/terms");
    const recurring = terms?.sections.find((section) => section.title.startsWith("8. Автоплатежи"));
    expect(recurring?.body).toContain("отдельно включил");
    expect(recurring?.body).toContain("один раз в месяц");
    expect(recurring?.body).toContain("один раз в год");
    expect(recurring?.body).toContain("отключить автопродление");
    expect(recurring?.body).toContain("до трёх раз");
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
