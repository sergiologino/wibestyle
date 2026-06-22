import { describe, expect, it } from "vitest";
import { femaleExampleCards, resolveFemaleExampleMedia } from "./female-cards-data";

describe("femaleExampleCards", () => {
  it("keeps gallery media replaceable and accessible", () => {
    expect(femaleExampleCards).toHaveLength(4);

    for (const card of femaleExampleCards) {
      expect(card.fileBase).toMatch(/\S/);
      expect(card.media.src).toMatch(/^\/assets\/female-cards\/.+\.(mp4|png|jpg|jpeg|webp|avif)$/);
      expect(card.alt).toMatch(/\S/);
      expect(card.title).toMatch(/\S/);
      expect(card.subtitle).toMatch(/\S/);
    }
  });

  it("falls back to matching image when mp4 is absent", () => {
    expect(resolveFemaleExampleMedia("look-1")).toEqual({
      type: "image",
      src: "/assets/female-cards/look-1.png",
    });
  });

  it("keeps captions aligned with the office and everyday photos", () => {
    const office = femaleExampleCards.find((card) => card.id === "office");
    const everyday = femaleExampleCards.find((card) => card.id === "city");

    expect(office?.subtitle).toBe("Пиджак, юбка и блузка в офисном образе");
    expect(everyday).toMatchObject({
      title: "На каждый день",
      subtitle: "Красная блузка, кофта и брюки",
    });
  });
});
