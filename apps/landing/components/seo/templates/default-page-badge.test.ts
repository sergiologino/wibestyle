import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("default SEO-page badge", () => {
  it("renders a page's explicit availability badge above its title", () => {
    const source = readFileSync(join(process.cwd(), "components", "seo", "templates", "DefaultSeoPage.tsx"), "utf8");
    expect(source).toContain('{page.badge ? <span className="pill">{page.badge}</span> : null}');
  });
});
