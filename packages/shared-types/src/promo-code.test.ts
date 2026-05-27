import { describe, expect, it } from "vitest";
import { buildPromoDeepLink, containsCyrillicHomoglyphs, validatePromoCodeInput } from "./promo-code";

describe("validatePromoCodeInput", () => {
  it("accepts latin uppercase promo codes", () => {
    expect(validatePromoCodeInput("vk2026")).toEqual({ ok: true, normalized: "VK2026" });
  });

  it("rejects cyrillic homoglyphs", () => {
    expect(validatePromoCodeInput("VK2026").ok).toBe(true);
    expect(validatePromoCodeInput("VK2026").ok).toBe(true);
    expect(validatePromoCodeInput("VК2026").ok).toBe(false);
    expect(containsCyrillicHomoglyphs("VК2026")).toBe(true);
  });

  it("builds deep links with promo query param", () => {
    expect(buildPromoDeepLink("https://app.wibestyle.ru", "VK20", "/welcome")).toBe(
      "https://app.wibestyle.ru/welcome?promo=VK20",
    );
  });
});
