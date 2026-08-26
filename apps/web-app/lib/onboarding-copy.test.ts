import { describe, expect, it } from "vitest";
import { onboardingSlides } from "./onboarding-copy";
import { mobileOnboardingSlides } from "../../mobile-app/src/lib/onboarding-copy";

describe("onboardingSlides", () => {
  it("matches the seven-screen mobile onboarding story", () => {
    expect(onboardingSlides).toHaveLength(7);
    expect(onboardingSlides.map((slide) => slide.id)).toEqual([
      "intro",
      "photo",
      "link",
      "result",
      "hair",
      "share",
      "future",
    ]);
  });

  it("starts with the app overview and ends with stylist on request", () => {
    expect(onboardingSlides.slice(0, 4).map((slide) => slide.id)).toEqual(["intro", "photo", "link", "result"]);
    expect(onboardingSlides.at(-1)).toMatchObject({
      id: "future",
      title: "Стилист по запросу",
    });
  });

  it("keeps referral, privacy-control, and trial cards out of onboarding", () => {
    expect(onboardingSlides.map((slide) => slide.id)).not.toEqual(expect.arrayContaining(["referral", "privacy", "trial"]));
    expect(onboardingSlides.map((slide) => `${slide.title} ${slide.text}`)).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/trial|реферал|приглаш/i)]),
    );
  });

  it("explains how to share a completed look in social networks", () => {
    expect(onboardingSlides.find((slide) => slide.id === "share")).toMatchObject({
      title: "Делись в соцсетях",
      bullets: expect.arrayContaining(["сторис"]),
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
    }) => ({
      id: slide.id,
      eyebrow: slide.eyebrow,
      title: slide.title,
      text: slide.text,
      tone: slide.tone,
      bullets: slide.bullets,
      footnote: slide.footnote,
    });

    expect(onboardingSlides.map(comparable)).toEqual(mobileOnboardingSlides.map(comparable));
  });

  it("keeps replaceable media in the onboarding public folder", () => {
    expect(onboardingSlides.every((slide) => slide.image.startsWith("/assets/onboarding/slides/"))).toBe(true);
    expect(onboardingSlides.find((slide) => slide.id === "result")).toMatchObject({
      image: "/assets/onboarding/slides/result-photo.png",
      video: "/assets/onboarding/slides/result-photo.mp4",
    });
    expect(onboardingSlides.find((slide) => slide.id === "link")).toMatchObject({
      image: "/assets/onboarding/slides/flow-photo.webp",
      video: "/assets/onboarding/slides/link-product-video.mp4",
    });
    expect(onboardingSlides.find((slide) => slide.id === "intro")?.image).toBe("/assets/onboarding/slides/app-intro-photo.png");
    expect(onboardingSlides.find((slide) => slide.id === "hair")?.image).toBe("/assets/onboarding/slides/hair-color-photo.png");
    expect(onboardingSlides.find((slide) => slide.id === "share")?.image).toBe("/assets/onboarding/slides/share-social-photo.png");
    expect(onboardingSlides.find((slide) => slide.id === "photo")?.image).toMatch(/\.webp$/);
    expect(onboardingSlides.find((slide) => slide.id === "future")?.image).toMatch(/\.webp$/);
  });
});
