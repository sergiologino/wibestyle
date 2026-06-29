import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile marketplace try-on entry points", () => {
  it("keeps a prominent WB/Ozon action on home", () => {
    const home = readFileSync(join(process.cwd(), "app", "(main)", "home.tsx"), "utf8");
    expect(home).toContain('accessibilityLabel="Примерить по ссылке Wildberries или Ozon"');
    expect(home).toContain('router.push("/try-on/link")');
  });

  it("keeps the marketplace option and route screen", () => {
    const hub = readFileSync(join(process.cwd(), "app", "(main)", "try-on.tsx"), "utf8");
    const linkScreen = readFileSync(join(process.cwd(), "app", "try-on", "link.tsx"), "utf8");
    expect(hub).toContain('href: "/try-on/link"');
    expect(linkScreen).toContain("api.parseLink(normalizedUrl)");
    expect(linkScreen).toContain("api.createLinkTryOnSession(product.productUrl, size)");
  });
});
