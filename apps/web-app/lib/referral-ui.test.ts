import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("web referral UI", () => {
  it("links profile to a dedicated referral history page", () => {
    const profile = readFileSync(join(process.cwd(), "components", "settings", "ProfileSettingsClient.tsx"), "utf8");
    const page = readFileSync(join(process.cwd(), "components", "referrals", "ReferralClient.tsx"), "utf8");
    expect(profile).toContain('href="/referrals"');
    expect(page).toContain("api.getReferrals()");
    expect(page).toContain("История начислений");
    expect(page).toContain("Поделиться ссылкой");
  });
});
