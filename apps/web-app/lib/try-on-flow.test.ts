import { describe, expect, it } from "vitest";
import { buildMockProduct, detectMarketplace, inferGarmentCategory } from "./try-on-flow";

describe("detectMarketplace", () => {
  it("detects wildberries links", () => {
    expect(detectMarketplace("https://www.wildberries.ru/catalog/1/detail.aspx")).toBe("wildberries");
  });

  it("detects ozon links", () => {
    expect(detectMarketplace("https://www.ozon.ru/product/123")).toBe("ozon");
  });
});

describe("buildMockProduct", () => {
  it("returns preview with sizes", () => {
    const product = buildMockProduct("https://www.ozon.ru/product/123");
    expect(product.sizes.length).toBeGreaterThan(0);
    expect(product.priceRub).toBeGreaterThan(0);
  });
});

describe("inferGarmentCategory", () => {
  it("infers dress from filename", () => {
    expect(inferGarmentCategory("my-dress-photo.jpg")).toBe("dress");
  });
});
