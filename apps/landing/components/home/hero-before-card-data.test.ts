import { describe, expect, it } from "vitest";
import { heroBeforeCard } from "./hero-before-card-data";

describe("heroBeforeCard", () => {
  it("keeps the replaceable hero before image accessible", () => {
    expect(heroBeforeCard.image).toMatch(/^\/assets\/.+\.(png|jpg|jpeg|webp)$/);
    expect(heroBeforeCard.alt).toContain("до");
    expect(heroBeforeCard.label).toBe("ты");
    expect(heroBeforeCard.sublabel).toBe("без образа");
  });
});
