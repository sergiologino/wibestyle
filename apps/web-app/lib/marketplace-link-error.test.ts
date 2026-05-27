import { describe, expect, it } from "vitest";
import { formatMarketplaceLinkError } from "@/lib/marketplace-link-error";

describe("formatMarketplaceLinkError", () => {
  it("adds photo upload hint for marketplace image errors", () => {
    const message = formatMarketplaceLinkError("Не найдено фото товара", "PRODUCT_IMAGE_NOT_FOUND");
    expect(message).toContain("Фото из галереи");
  });

  it("keeps other errors unchanged", () => {
    expect(formatMarketplaceLinkError("Ошибка сети")).toBe("Ошибка сети");
  });
});
