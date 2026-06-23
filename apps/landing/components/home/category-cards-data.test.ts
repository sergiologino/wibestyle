import { describe, expect, it } from "vitest";
import { CATEGORY_CARD_FILE_BASES, categoryCards, resolveCategoryCardImage } from "./category-cards-data";

describe("categoryCards", () => {
  it("reserves one stable image basename for every category", () => {
    expect(categoryCards.map((card) => card.fileBase)).toEqual(CATEGORY_CARD_FILE_BASES);
    expect(categoryCards).toHaveLength(5);

    for (const card of categoryCards) {
      expect(card.title).toMatch(/\S/);
      expect(card.sub).toMatch(/\S/);
      expect(card.href).toMatch(/^\//);
    }
  });

  it("selects a supplied image without requiring JSX changes", () => {
    expect(resolveCategoryCardImage("office", (fileName) => fileName === "office.jpg")).toBe(
      "/assets/category-cards/office.jpg",
    );
    expect(resolveCategoryCardImage("office", () => false)).toBeUndefined();
  });
});
