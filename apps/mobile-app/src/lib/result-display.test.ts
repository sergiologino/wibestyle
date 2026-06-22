import { describe, expect, it } from "vitest";
import { buildPublicPostUrl, formatProductMeta } from "./result-display";

describe("formatProductMeta", () => {
  it("handles photo try-ons without a product price", () => {
    expect(formatProductMeta({ brand: "", priceRub: null, selectedSize: "M" })).toBe("M");
  });

  it("formats complete marketplace metadata", () => {
    expect(formatProductMeta({ brand: "Lime", priceRub: 7999, selectedSize: "46" }))
      .toBe("Lime · 7 999 ₽ · 46");
  });
});

describe("buildPublicPostUrl", () => {
  it("builds the OpenGraph page URL from a relative backend URL", () => {
    expect(buildPublicPostUrl({
      appBaseUrl: "https://app.vibestyle.art/",
      publicUrl: "/p/my-look",
      slug: "ignored",
    })).toBe("https://app.vibestyle.art/p/my-look");
  });
});
