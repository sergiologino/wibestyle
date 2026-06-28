import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile referral UI", () => {
  it("links profile to a dedicated share and reward-history screen", () => {
    const profile = readFileSync(join(process.cwd(), "src", "components", "profile", "ProfileEditor.tsx"), "utf8");
    const page = readFileSync(join(process.cwd(), "app", "referrals.tsx"), "utf8");
    expect(profile).toContain('router.push("/referrals"');
    expect(page).toContain("api.getReferrals()");
    expect(page).toContain("Share.share");
    expect(page).toContain("История начислений");
  });
});
