import { describe, expect, it } from "vitest";
import { getSeoPage } from "./seo-pages";

describe("hairstyle landing page", () => {
  it("clearly marks the feature as coming soon and uses dedicated visual slots", () => {
    const page = getSeoPage("/pricheski");
    expect(page?.badge).toBe("Скоро");
    expect(page?.faq).toContainEqual({ q: "Когда?", a: "В ближайших релизах августа–сентября." });
    expect(page?.visuals).toMatchObject({
      type: "mosaic",
      images: [
        { src: "/assets/hairstyles/hairstyle-preview-1.png" },
        { src: "/assets/hairstyles/hairstyle-preview-2.png" },
      ],
    });
  });
});
