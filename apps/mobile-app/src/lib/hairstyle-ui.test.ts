import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HAIRSTYLES } from "./hairstyle-catalog";

describe("hairstyle try-on", () => {
  it("keeps a curated catalogue without duplicate style ids", () => {
    expect(HAIRSTYLES.length).toBeGreaterThanOrEqual(18);
    expect(new Set(HAIRSTYLES.map((item) => item.id)).size).toBe(HAIRSTYLES.length);
    expect(HAIRSTYLES.some((item) => item.id === "smooth-bob")).toBe(true);
  });

  it("uses a dedicated close-up portrait rather than the clothing avatar", () => {
    const catalogue = readFileSync(join(process.cwd(), "app", "hairstyles", "index.tsx"), "utf8");
    const portrait = readFileSync(join(process.cwd(), "app", "hairstyles", "portrait.tsx"), "utf8");
    const profile = readFileSync(join(process.cwd(), "src", "components", "profile", "ProfileEditor.tsx"), "utf8");
    const manager = readFileSync(join(process.cwd(), "src", "components", "profile", "HairstylePortraitManager.tsx"), "utf8");
    expect(catalogue).toContain('const hairstyleImagePath = (styleId: string) => `/api/v1/hairstyles/${styleId}/image`');
    expect(catalogue).toContain("buildProductImageSource(getApiBaseUrl(), hairstyleImagePath(style.id), null, getAppBaseUrl())");
    expect(catalogue).toContain("api.getHairColorCatalog");
    expect(catalogue).toContain("color.imageUrl");
    expect(catalogue).toContain("colorId");
    expect(catalogue).toContain("Запустить примерку");
    expect(portrait).toContain("uploads.createHairstyleTryOn(null, style?.id ?? null, colorId ?? null)");
    expect(manager).toContain("от макушки до плеч");
    expect(manager).toContain("uploadHairstylePortrait");
    expect(profile).toContain("HairstylePortraitManager");
    expect(portrait).toContain("Загрузить портрет в профиле");
    expect(portrait).toContain("router.replace(`/try-on/result/${sessionId}`)");
    expect(portrait).toContain("не меняет аватар одежды");
    expect(portrait).not.toContain("saveHairstylePortrait");
  });
});
