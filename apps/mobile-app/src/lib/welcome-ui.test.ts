import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile welcome UI", () => {
  const source = readFileSync(join(process.cwd(), "app", "welcome.tsx"), "utf8");
  const copy = readFileSync(join(process.cwd(), "src", "lib", "onboarding-copy.ts"), "utf8");

  it("uses result-photo mp4 on the result slide", () => {
    expect(source).toContain('require("../assets/onboarding/slides/result-photo.mp4")');
    expect(source).toContain("<VideoView");
    expect(source).toContain('slide.asset === "result"');
  });

  it("keeps onboarding compact and removes the redundant slide/tag", () => {
    expect(source).toContain("height * 0.31");
    expect(copy).not.toContain("Меньше хаоса перед покупкой");
    expect(copy).not.toContain("товар рядом");
  });

  it("fits onboarding photos and video without cropping the model", () => {
    expect(source).toContain('contentFit="contain"');
    expect(source).toContain('resizeMode="contain"');
    expect(source).not.toContain('contentFit="cover"');
    expect(source).not.toContain('resizeMode="cover"');
  });

  it("prefers webp slide assets where available", () => {
    expect(source).toContain("upload-photo.webp");
    expect(source).toContain("flow-photo.webp");
    expect(source).toContain("future-photo.webp");
    expect(source).toContain("paywall-photo.webp");
  });

  it("routes the trial CTA through registration before paywall", () => {
    expect(source).toContain('router.replace("/auth?next=/paywall")');
  });
});
