import { describe, expect, it } from "vitest";
import { getSeoPage } from "./seo-pages";

describe("look request landing page", () => {
  it("targets full-look requests and uses dedicated visual slots", () => {
    const page = getSeoPage("/podbor-obraza");

    expect(page?.badge).toBe("Скоро");
    expect(page?.title).not.toContain("скоро");
    expect(page?.description).not.toContain("июля 2026");
    expect(page?.keywords).toContain("персональный стилист онлайн");
    expect(page?.faq).toContainEqual({
      q: "Что входит в подбор полного образа?",
      a: "В полный образ входят одежда, обувь, аксессуары, причёска, цвет волос и макияж под событие, сезон и ваш стиль.",
    });
    expect(page?.visuals).toMatchObject({
      type: "mosaic",
      images: [
        { src: "/assets/look-request/full-look.png" },
        { src: "/assets/look-request/accessories.png" },
        { src: "/assets/look-request/shoes.png" },
        { src: "/assets/look-request/makeup.png" },
      ],
    });
  });
});
