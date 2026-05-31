import { describe, expect, it } from "vitest";
import {
  canFavoriteTryOnProduct,
  favoriteProductKey,
  formatProductPriceRub,
  marketplaceLabel,
  productBannerHref,
  shouldShowProductBanner,
} from "./try-on-product";
import type { ProductPreview } from "@wibestyle/shared-types";

const wbProduct: ProductPreview = {
  id: "123",
  marketplace: "wildberries",
  title: "Платье летнее",
  brand: "Brand",
  priceRub: 4290,
  imageUrl: "/img.jpg",
  sizes: ["M"],
  productUrl: "https://www.wildberries.ru/catalog/123/detail.aspx",
};

describe("try-on-product", () => {
  it("formats price", () => {
    expect(formatProductPriceRub(4290)).toBe("4 290 ₽");
    expect(formatProductPriceRub(0)).toBeNull();
  });

  it("labels marketplace", () => {
    expect(marketplaceLabel("wildberries")).toBe("Wildberries");
    expect(marketplaceLabel("ozon")).toBe("Ozon");
  });

  it("builds favorite key", () => {
    expect(favoriteProductKey(wbProduct)).toBe("wildberries:123");
  });

  it("allows favorites for marketplace links only", () => {
    expect(canFavoriteTryOnProduct(wbProduct)).toBe(true);
    expect(canFavoriteTryOnProduct({ ...wbProduct, marketplace: "other" })).toBe(false);
    expect(canFavoriteTryOnProduct({ ...wbProduct, productUrl: "" })).toBe(false);
  });

  it("shows banner when product or size exists", () => {
    expect(shouldShowProductBanner(wbProduct, "M")).toBe(true);
    expect(shouldShowProductBanner(undefined, "M")).toBe(true);
    expect(shouldShowProductBanner(undefined, undefined)).toBe(false);
  });

  it("returns banner href when url present", () => {
    expect(productBannerHref(wbProduct)).toContain("wildberries");
    expect(productBannerHref({ ...wbProduct, productUrl: "" })).toBeNull();
  });
});
