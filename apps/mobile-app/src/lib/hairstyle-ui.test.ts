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
    const portrait = readFileSync(join(process.cwd(), "app", "hairstyles", "portrait.tsx"), "utf8");
    expect(portrait).toContain("от макушки до плеч");
    expect(portrait).toContain("createHairstyleTryOn");
    expect(portrait).toContain("не меняет аватар одежды");
    expect(portrait).toContain("saveHairstylePortrait");
  });
});
