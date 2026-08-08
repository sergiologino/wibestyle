import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("editorial SEO-page badge", () => {
  it("overlaps a coming-soon badge with the title", () => {
    const source = readFileSync(join(process.cwd(), "components", "seo", "templates", "EditorialSeoPage.tsx"), "utf8");

    expect(source).toContain('const isComingSoon = page.badge === "Скоро";');
    expect(source).toContain('className={isComingSoon ? "seo-title--coming-soon" : undefined}');
    expect(source).toContain('className="seo-coming-soon-badge"');
  });
});
