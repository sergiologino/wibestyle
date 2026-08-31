import { describe, expect, it } from "vitest";
import { getSeoPage } from "./seo-pages";

describe("hairstyle landing page", () => {
  it("targets hairstyles, haircuts, and hair color intents with dedicated visual slots", () => {
    const page = getSeoPage("/pricheski");
    expect(page?.badge).toBe("Скоро");
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
      images: [
        { src: "/assets/hairstyles/hairstyle-preview-1.png" },
        { src: "/assets/hairstyles/hairstyle-preview-2.png" },
      ],
    });
  });
});
