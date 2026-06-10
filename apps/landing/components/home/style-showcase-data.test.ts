import { describe, expect, it } from "vitest";
import { styleShowcaseItems } from "./style-showcase-data";

describe("styleShowcaseItems", () => {
  it("keeps production-ready style cards with accessible media", () => {
    expect(styleShowcaseItems).toHaveLength(5);

    for (const item of styleShowcaseItems) {
      expect(item.id).toMatch(/\S/);
      expect(item.title).toMatch(/\S/);
      expect(item.subtitle).toMatch(/\S/);
      expect(item.image).toMatch(/^\/assets\/.+\.(png|jpg|jpeg|webp)$/);
      expect(item.alt).toMatch(/\S/);
      expect(item.badge).toMatch(/\S/);
      expect(item.href).toMatch(/^\//);
    }
  });
});
