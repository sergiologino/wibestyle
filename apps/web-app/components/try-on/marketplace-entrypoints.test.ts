import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("marketplace try-on entry points", () => {
  it("keeps a direct WB/Ozon action on the authenticated home", () => {
    const home = readFileSync(join(process.cwd(), "components", "home", "HomeDashboardClient.tsx"), "utf8");

    expect(home).toContain('data-testid="marketplace-try-on-primary"');
    expect(home).toContain('href="/try-on/link"');
  });

  it("keeps the link scenario on the try-on hub", () => {
    const hub = readFileSync(join(process.cwd(), "app", "try-on", "page.tsx"), "utf8");
    expect(hub).toContain('href: "/try-on/link"');
    expect(hub).toContain('data-testid="marketplace-try-on-hub"');
  });
});
