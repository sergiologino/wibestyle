import { describe, expect, it } from "vitest";
import { FIRST_100_PROMO_CODE, mobileOnboardingSlides } from "./onboarding-copy";

describe("mobileOnboardingSlides", () => {
  it("contains a 6-8 screen onboarding flow", () => {
    expect(mobileOnboardingSlides.length).toBeGreaterThanOrEqual(6);
    expect(mobileOnboardingSlides.length).toBeLessThanOrEqual(8);
  });

  it("explains the product flow before benefits", () => {
    expect(mobileOnboardingSlides.slice(0, 3).map((slide) => slide.id)).toEqual(["photo", "link", "result"]);
  });

  it("ends with a trial paywall action and first-100 promo", () => {
    expect(mobileOnboardingSlides.at(-1)).toMatchObject({ id: "trial", cta: "trial" });
    expect(FIRST_100_PROMO_CODE).toBe("FIRST100");
  });

  it("uses replaceable local assets by stable keys", () => {
    const assetKeys = mobileOnboardingSlides.map((slide) => slide.asset);
    expect(assetKeys).toEqual(["upload", "flow", "result", "style", "privacy", "future", "paywall"]);
  });
});
