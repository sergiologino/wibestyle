import { describe, expect, it } from "vitest";
import { formatProductMeta } from "./result-display";

describe("formatProductMeta", () => {
  it("handles photo try-ons without a product price", () => {
    expect(formatProductMeta({ brand: "", priceRub: null, selectedSize: "M" })).toBe("M");
  });

  it("formats complete marketplace metadata", () => {
    expect(formatProductMeta({ brand: "Lime", priceRub: 7999, selectedSize: "46" }))
      .toBe("Lime · 7 999 ₽ · 46");
  });
});
