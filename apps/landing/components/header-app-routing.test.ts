import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("header application routing", () => {
  it("opens RuStore only for Android and preserves the web-app fallback elsewhere", () => {
    const source = readFileSync(join(process.cwd(), "components", "Header.tsx"), "utf8");
    expect(source).toContain("/Android/i.test(window.navigator.userAgent)");
    expect(source).toContain("setAppHref(siteConfig.rustoreUrl)");
    expect(source).toContain("href={appHref}");
  });
});
