import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("home store links", () => {
  it("keeps the web CTA explicit, sends RuStore to the published app and disables unavailable stores", () => {
    const source = readFileSync(join(process.cwd(), "components", "home", "HomePage.tsx"), "utf8");
    expect(source).toContain("Перейти в веб-приложение");
    expect(source).toContain('href={siteConfig.rustoreUrl}');
    expect(source).toContain("store-button--disabled");
    expect(source).not.toContain('href="#lead" data-analytics="hero_googleplay"');
  });
});
