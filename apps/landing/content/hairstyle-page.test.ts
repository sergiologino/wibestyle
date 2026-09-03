import { describe, expect, it } from "vitest";
import { getSeoPage } from "./seo-pages";

describe("hairstyle landing page", () => {
  it("targets hairstyles, haircuts, and hair color intents with dedicated visual slots", () => {
    const page = getSeoPage("/pricheski");
    expect(page?.badge).toBeUndefined();
    expect(page?.visualsCompact).not.toBe(true);
    expect(page?.visualsTall).toBe(true);
    expect(page?.title).toContain("стрижку");
    expect(page?.description).toContain("цвет волос");
    expect(page?.keywords).toContain("изменить цвет волос онлайн");
    expect(page?.faq).toContainEqual({
      q: "Можно ли изменить цвет волос на фото?",
      a: "Да. Можно попробовать новый оттенок до окрашивания и сохранить вариант для обсуждения с мастером.",
    });
    expect(page?.visuals).toMatchObject({
      type: "mosaic",
    });
    if (page?.visuals?.type === "mosaic") {
      expect(page.visuals.images).toHaveLength(4);
      expect(page.visuals.labels).toHaveLength(4);
      page.visuals.images.forEach((image, index) => {
        expect(image.src).toMatch(new RegExp(`/assets/hairstyles/hairstyle-preview-${index + 1}\\.(webp|png|jpg)$`));
      });
    }
  });
});
