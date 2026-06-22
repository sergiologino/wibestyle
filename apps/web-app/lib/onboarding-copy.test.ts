import { describe, expect, it } from "vitest";
import { FIRST_100_PROMO_CODE, onboardingSlides } from "./onboarding-copy";

describe("onboardingSlides", () => {
  it("contains a mobile-first 6-8 screen onboarding story", () => {
    expect(onboardingSlides.length).toBeGreaterThanOrEqual(6);
    expect(onboardingSlides.length).toBeLessThanOrEqual(8);
  });

  it("starts with user flow and ends with trial paywall CTA", () => {
    expect(onboardingSlides.slice(0, 3).map((slide) => slide.id)).toEqual(["photo", "link", "result"]);
    expect(onboardingSlides.at(-1)).toMatchObject({
      id: "trial",
      cta: "trial",
    });
  });

  it("keeps replaceable media in the onboarding public folder", () => {
    expect(onboardingSlides.every((slide) => slide.image.startsWith("/assets/onboarding/slides/"))).toBe(true);
    expect(onboardingSlides.every((slide) => slide.mediaBase.startsWith("/assets/onboarding/slides/"))).toBe(true);
    expect(onboardingSlides.every((slide) => slide.image === `${slide.mediaBase}.png`)).toBe(true);
  });

  it("documents the first-100 promo code", () => {
    expect(FIRST_100_PROMO_CODE).toBe("FIRST100");
  });
});
