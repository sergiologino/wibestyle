import { describe, expect, it } from "vitest";
import { homeFaq } from "./home-faq";
import { getSeoPage } from "./seo-pages";

describe("home GEO FAQ", () => {
  it("keeps an indexable 10-15 question set for search and AI answers", () => {
    expect(homeFaq.length).toBeGreaterThanOrEqual(10);
    expect(homeFaq.length).toBeLessThanOrEqual(15);

    for (const item of homeFaq) {
      expect(item.q.length).toBeGreaterThan(10);
      expect(item.a.length).toBeGreaterThan(40);
    }
  });

  it("covers clothing, privacy, personalization, hair, makeup, and full-look intents", () => {
    const text = homeFaq.map((item) => `${item.q} ${item.a}`).join("\n").toLowerCase();

    expect(text).toContain("wildberries");
    expect(text).toContain("ozon");
    expect(text).toContain("скрыть лицо");
    expect(text).toContain("размер");
    expect(text).toContain("причёск");
    expect(text).toContain("стриж");
    expect(text).toContain("цвет волос");
    expect(text).toContain("макияж");
    expect(text).toContain("полный look");
  });

  it("reuses the same FAQ on the dedicated FAQ page", () => {
    expect(getSeoPage("/faq")?.faq).toBe(homeFaq);
  });
});
