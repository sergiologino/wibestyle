import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("try-on result actions", () => {
  const source = readFileSync(join(process.cwd(), "components", "try-on", "ResultClient.tsx"), "utf8");

  it("renders an explicit visible video button", () => {
    expect(source).toContain('aria-label="Сделать видео из результата примерки"');
    expect(source).toContain("<span>Сделать видео</span>");
    expect(source).toContain("bg-[#782cff]");
  });

  it("renders try again as a primary action", () => {
    expect(source).toContain('data-testid="try-on-again"');
    expect(source).toContain('isHairstyle ? "Выбрать другую причёску" : "Примерить ещё одну вещь"');
    expect(source).toContain('href={isHairstyle ? "/hairstyles" : "/try-on"}');
  });

  it("toggles gallery publishing and supports owner unpublish", () => {
    expect(source).toContain("api.listMyGalleryPosts()");
    expect(source).toContain("api.deleteMyGalleryPost");
    expect(source).toContain("galleryPostFor");
    expect(source).toContain("Показать в галерее");
    expect(source).toContain("Убрать из галереи");
    expect(source).toContain("Убрать фото");
    expect(source).toContain("Убрать видео");
  });
});
