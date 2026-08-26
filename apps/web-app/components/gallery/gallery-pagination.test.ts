import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("gallery pagination", () => {
  it("loads ten posts at a time and defers non-critical image decoding", () => {
    const source = readFileSync(join(process.cwd(), "components", "gallery", "GalleryClient.tsx"), "utf8");
    expect(source).toContain("const GALLERY_PAGE_SIZE = 10");
    expect(source).toContain("const GALLERY_TIMEOUT_MS = 8000");
    expect(source).toContain("listPublicGalleryPosts");
    expect(source).toContain("readFeedCache");
    expect(source).toContain("writeFeedCache");
    expect(source).toContain("GALLERY_CACHE_KEY");
    expect(source).toContain("apiBaseUrl()");
    expect(source).not.toContain("api.listGalleryPosts({ limit: GALLERY_PAGE_SIZE })");
    expect(source).toContain("limit: GALLERY_PAGE_SIZE");
    expect(source).toContain('loading="lazy"');
    expect(source).toContain("pointer-events-none");
    expect(source).toContain("Не удалось загрузить галерею");
    expect(source).toContain('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3');
  });
});
