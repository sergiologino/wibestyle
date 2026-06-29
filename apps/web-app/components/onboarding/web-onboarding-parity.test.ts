import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("web onboarding parity", () => {
  const welcome = readFileSync(join(process.cwd(), "components", "onboarding", "WelcomeClient.tsx"), "utf8");
  const media = readFileSync(join(process.cwd(), "components", "onboarding", "OnboardingMedia.tsx"), "utf8");

  it("fits photos and video without cropping or increasing the compact mobile height", () => {
    expect(welcome).toContain("h-[clamp(188px,31dvh,310px)]");
    expect(media).toContain("object-contain");
    expect(media).not.toContain("object-cover");
  });

  it("routes skip and trial through registration to paywall", () => {
    expect(welcome).toContain('authUrl.searchParams.set("next", "/paywall")');
    expect(welcome).toContain('activeIndex === 0 ? openTrial()');
    expect(welcome).toContain('activeIndex === 0 ? "Пропустить"');
  });
});
