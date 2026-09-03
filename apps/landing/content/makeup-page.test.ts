import { describe, expect, it } from "vitest";
import { getSeoPage } from "./seo-pages";

describe("virtual makeup landing page", () => {
  it("warms up makeup SEO while keeping the feature marked as coming soon", () => {
    const page = getSeoPage("/makiyazh");

    expect(page?.badge).toBe("Скоро");
    expect(page?.description).toContain("свадебный");
    expect(page?.keywords).toContain("примерить макияж по фото");
    expect(page?.faq).toContainEqual({
      q: "Можно ли примерить макияж онлайн по фото?",
      a: "Да. Функция макияжа готовится к запуску: можно будет примерять дневной, вечерний, деловой, яркий и свадебный макияж на портретном фото.",
    });
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
