import { describe, expect, it } from "vitest";
import { FIRST_100_PROMO_CODE, onboardingSlides } from "./onboarding-copy";
import { mobileOnboardingSlides } from "../../mobile-app/src/lib/onboarding-copy";

describe("onboardingSlides", () => {
  it("matches the seven-screen mobile onboarding story", () => {
    expect(onboardingSlides).toHaveLength(7);
    expect(onboardingSlides.map((slide) => slide.id)).toEqual([
      "photo",
      "link",
      "result",
      "privacy",
      "future",
      "trial",
      "referral",
    ]);
  });

  it("starts with user flow and ends with trial paywall CTA", () => {
    expect(onboardingSlides.slice(0, 3).map((slide) => slide.id)).toEqual(["photo", "link", "result"]);
    expect(onboardingSlides.at(-1)).toMatchObject({
      id: "referral",
      cta: "trial",
    });
  });

  it("keeps web copy synchronized with the mobile onboarding", () => {
    const comparable = (slide: {
      id: string;
      eyebrow: string;
      title: string;
      text: string;
      tone: string;
      bullets: string[];
      footnote?: string;
      cta?: string;
    }) => ({
      id: slide.id,
      eyebrow: slide.eyebrow,
      title: slide.title,
      text: slide.text,
      tone: slide.tone,
      bullets: slide.bullets,
      footnote: slide.footnote,
      cta: slide.cta,
    });

    expect(onboardingSlides.map(comparable)).toEqual(mobileOnboardingSlides.map(comparable));
  });

  it("keeps replaceable media in the onboarding public folder", () => {
    expect(onboardingSlides.every((slide) => slide.image.startsWith("/assets/onboarding/slides/"))).toBe(true);
    expect(onboardingSlides.find((slide) => slide.id === "result")).toMatchObject({
      image: "/assets/onboarding/slides/result-photo.png",
      video: "/assets/onboarding/slides/result-photo.mp4",
    });
    expect(onboardingSlides.find((slide) => slide.id === "photo")?.image).toMatch(/\.webp$/);
    expect(onboardingSlides.find((slide) => slide.id === "link")?.image).toMatch(/\.webp$/);
    expect(onboardingSlides.find((slide) => slide.id === "future")?.image).toMatch(/\.webp$/);
    expect(onboardingSlides.find((slide) => slide.id === "trial")?.image).toMatch(/\.webp$/);
  });

  it("documents the first-100 promo code", () => {
    expect(FIRST_100_PROMO_CODE).toBe("FIRST100");
  });
});
