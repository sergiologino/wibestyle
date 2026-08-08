import { describe, expect, it } from "vitest";
import { getSeoPage } from "./seo-pages";

describe("virtual makeup landing page", () => {
  it("marks the feature as coming soon and uses dedicated image slots", () => {
    const page = getSeoPage("/makiyazh");

    expect(page?.badge).toBe("Скоро");
    expect(page?.visuals).toMatchObject({
      type: "beforeAfterPairs",
      pairs: [
        {
          before: { src: "/assets/makeup/makeup-evening-before.png" },
          after: { src: "/assets/makeup/makeup-evening-after.png" },
        },
        {
          before: { src: "/assets/makeup/makeup-light-before.png" },
          after: { src: "/assets/makeup/makeup-light-after.png" },
        },
      ],
    });
  });
});
