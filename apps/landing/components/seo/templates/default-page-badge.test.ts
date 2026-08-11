import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("default SEO-page badge", () => {
  it("overlaps a coming-soon badge with the title", () => {
    const source = readFileSync(join(process.cwd(), "components", "seo", "templates", "DefaultSeoPage.tsx"), "utf8");
    expect(source).toContain('const isComingSoon = page.badge === "Скоро";');
    expect(source).toContain('className={isComingSoon ? "seo-title--coming-soon" : undefined}');
    expect(source).toContain('className="seo-coming-soon-badge"');
  });

  it("passes mosaic height variants to visual components", () => {
    const source = readFileSync(join(process.cwd(), "components", "seo", "templates", "DefaultSeoPage.tsx"), "utf8");
    expect(source).toContain('page.visualsTall ? " seo-visual-band--tall-mosaic" : ""');
    expect(source).toContain("tall={page.visualsTall}");
  });
});
