import { describe, expect, it } from "vitest";
import { appPreviewScreens } from "./app-preview-data";
import { finalCtaArt } from "./final-cta-art-data";
import { heroCollageLooks, heroProductCard } from "./hero-collage-data";

describe("component landing banners", () => {
  it("keeps hero collage cards replaceable and accessible", () => {
    expect(heroCollageLooks.length).toBeGreaterThanOrEqual(4);
    for (const look of heroCollageLooks) {
      expect(look.image).toMatch(/^\/assets\/.+\.(png|jpg|jpeg|webp)$/);
      expect(look.alt).toMatch(/\S/);
      expect(look.title).toMatch(/\S/);
    }
    expect(heroProductCard.image).toMatch(/^\/assets\/.+\.(png|jpg|jpeg|webp)$/);
  });

  it("keeps phone preview screens replaceable and accessible", () => {
    expect(appPreviewScreens).toHaveLength(2);
    for (const screen of appPreviewScreens) {
      expect(screen.image).toMatch(/^\/assets\/.+\.(png|jpg|jpeg|webp)$/);
      expect(screen.alt).toMatch(/\S/);
      expect(screen.title).toMatch(/\S/);
    }
  });

  it("keeps final CTA art configurable", () => {
    expect(finalCtaArt.qrImage).toMatch(/^\/assets\/.+\.(png|jpg|jpeg|webp)$/);
    expect(finalCtaArt.qrAlt).toMatch(/\S/);
    expect(finalCtaArt.bags.length).toBeGreaterThanOrEqual(3);
  });
});
