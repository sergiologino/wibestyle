import { describe, expect, it } from "vitest";
import {
  isAuthenticatedProductImageUrl,
  isMarketplaceProxyImageUrl,
  isPublicProductImageUrl,
  resolveProductImageUrl,
} from "./product-image";

describe("resolveProductImageUrl", () => {
  it("keeps marketplace proxy paths same-origin for Next rewrite", () => {
    expect(resolveProductImageUrl("/api/v1/marketplaces/wildberries/123/image")).toBe(
      "/api/v1/marketplaces/wildberries/123/image",
    );
    expect(isMarketplaceProxyImageUrl("/api/v1/marketplaces/ozon/slug/image")).toBe(true);
    expect(isPublicProductImageUrl("/api/v1/marketplaces/wildberries/1/image")).toBe(true);
  });

  it("detects authenticated garment snapshot urls", () => {
    expect(
      isAuthenticatedProductImageUrl("/api/v1/try-on/sessions/abc-123/garment-photo"),
    ).toBe(true);
    expect(isAuthenticatedProductImageUrl("/api/v1/marketplaces/wildberries/1/image")).toBe(false);
  });

  it("prefixes other API paths with NEXT_PUBLIC_API_URL", () => {
    expect(resolveProductImageUrl("/api/v1/gallery/posts/x/image")).toBe(
      "http://localhost:8080/api/v1/gallery/posts/x/image",
    );
  });

  it("keeps absolute CDN urls unchanged", () => {
    const url = "https://basket-01.wbbasket.ru/vol0/part0/1/images/big/1.webp";
    expect(resolveProductImageUrl(url)).toBe(url);
  });
});
