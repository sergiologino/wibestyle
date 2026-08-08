import { describe, expect, it } from "vitest";
import { getSeoPage } from "./seo-pages";

describe("look request landing page", () => {
  it("clearly marks the feature as coming soon and uses dedicated visual slots", () => {
    const page = getSeoPage("/podbor-obraza");

    expect(page?.badge).toBe("Скоро");
    expect(page?.faq).toContainEqual({
      q: "Когда появится функция?",
      a: "В ближайших релизах августа–сентября.",
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
