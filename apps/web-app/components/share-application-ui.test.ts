import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("application sharing in web navbar", () => {
  const source = readFileSync(join(process.cwd(), "components", "AppTopBar.tsx"), "utf8");

  it("uses an icon-only subtle navbar action instead of a marketplace shortcut", () => {
    expect(source).toContain('aria-label="Поделиться приложением"');
    expect(source).toContain('data-testid="share-application-header"');
    expect(source).not.toContain('data-testid="marketplace-try-on-header"');
  });

  it("uses referral data and the standard Web Share API with clipboard fallback", () => {
    expect(source).toContain("api.getReferrals()");
    expect(source).toContain("navigator.share");
    expect(source).toContain("navigator.clipboard.writeText");
    expect(source).toContain("Если он купит месячную подписку");
  });
});
