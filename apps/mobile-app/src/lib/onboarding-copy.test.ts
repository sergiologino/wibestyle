import { describe, expect, it } from "vitest";
import { mobileOnboardingSlides } from "./onboarding-copy";

describe("mobileOnboardingSlides", () => {
  it("contains the requested seven-screen onboarding flow", () => {
    expect(mobileOnboardingSlides.map((slide) => slide.id)).toEqual(["intro", "photo", "link", "result", "hair", "share", "future"]);
  });

  it("explains the product flow before hair and sharing benefits", () => {
    expect(mobileOnboardingSlides.slice(0, 4).map((slide) => slide.id)).toEqual(["intro", "photo", "link", "result"]);
    expect(mobileOnboardingSlides.find((slide) => slide.id === "hair")).toMatchObject({
      title: "Прически и окрашивание",
      asset: "hair",
    });
  });

  it("shows that a completed look can be shared in Instagram and other social networks", () => {
    expect(mobileOnboardingSlides.find((slide) => slide.id === "share")).toMatchObject({
      asset: "share",
      bullets: expect.arrayContaining(["сторис"]),
    });
  });

  it("uses short video for the product-link card and result video for the try-on card", () => {
    expect(mobileOnboardingSlides.find((slide) => slide.id === "link")).toMatchObject({ asset: "flow", video: "link" });
    expect(mobileOnboardingSlides.find((slide) => slide.id === "result")).toMatchObject({ asset: "result", video: "result" });
  });

  it("ends with stylist on request", () => {
    expect(mobileOnboardingSlides.at(-1)).toMatchObject({ id: "future", title: "Стилист по запросу" });
    expect(mobileOnboardingSlides.map((slide) => slide.id)).not.toEqual(expect.arrayContaining(["referral", "privacy", "trial"]));
  });

  it("uses replaceable local assets by stable keys", () => {
    const assetKeys = mobileOnboardingSlides.map((slide) => slide.asset);
    expect(assetKeys).toEqual(["intro", "upload", "flow", "result", "hair", "share", "future"]);
  });
});
