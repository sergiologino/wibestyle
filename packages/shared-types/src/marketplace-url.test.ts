import { describe, expect, it } from "vitest";
import { extractMarketplaceUrl } from "./marketplace-url";

describe("extractMarketplaceUrl", () => {
  it("extracts a Wildberries URL from shared product text", () => {
    expect(
      extractMarketplaceUrl(
        "Летний костюм 2 в 1 https://www.wildberries.ru/catalog/755269515/detail.aspx?targetUrl=SN",
      ),
    ).toBe("https://www.wildberries.ru/catalog/755269515/detail.aspx?targetUrl=SN");
  });

  it("keeps an Ozon URL with its query string", () => {
    const url = "https://www.ozon.ru/product/plate-3731731230/?at=tracking";
    expect(extractMarketplaceUrl(url)).toBe(url);
  });

  it("removes punctuation added after a shared URL", () => {
    expect(extractMarketplaceUrl("Товар: https://www.ozon.ru/product/plate-3731731230/)."))
      .toBe("https://www.ozon.ru/product/plate-3731731230/");
  });
});
