import { describe, expect, it } from "vitest";
import { homeFaq } from "./home-faq";
import { getSeoPage } from "./seo-pages";

describe("home GEO FAQ", () => {
  it("keeps an indexable long-tail question set for search and AI answers", () => {
    expect(homeFaq.length).toBeGreaterThanOrEqual(15);

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
    expect(text).toContain("видео пример");
    expect(text).toContain("скачивать");
    expect(text).toContain("соцсети");
    expect(text).toContain("реферальная");
    expect(text).toContain("бонусные примерки");
    expect(text).toContain("сторис");
    expect(text).toContain("скачать");
  });

  it("does not describe the full-look scenario as currently available", () => {
    const fullLook = homeFaq.find((item) => item.q.startsWith("Можно ли собрать полный образ"));

    expect(fullLook?.a).toContain("сейчас в работе");
  });

  it("describes one-time try-on packages instead of a time subscription", () => {
    const pricing = homeFaq.find((item) => item.q === "Сколько стоят примерки?");

    expect(pricing?.a).toContain("нет подписки по срокам");
    expect(pricing?.a).toContain("20 примерок");
    expect(pricing?.a).toContain("50 примерок");
    expect(pricing?.a).toContain("100 примерок");
  });

  it("reuses the same FAQ on the dedicated FAQ page", () => {
    expect(getSeoPage("/faq")?.faq).toBe(homeFaq);
  });
});
