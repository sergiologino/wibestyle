import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("gallery pagination", () => {
  it("loads ten posts at a time and defers non-critical image decoding", () => {
    const source = readFileSync(join(process.cwd(), "components", "gallery", "GalleryClient.tsx"), "utf8");
    expect(source).toContain("const GALLERY_PAGE_SIZE = 10");
    expect(source).toContain("limit: GALLERY_PAGE_SIZE");
    expect(source).toContain('loading="lazy"');
  });
});
