import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("profile layout", () => {
  const profile = readFileSync(join(process.cwd(), "components", "settings", "ProfileSettingsClient.tsx"), "utf8");
  const avatars = readFileSync(join(process.cwd(), "components", "avatar", "AvatarManager.tsx"), "utf8");

  it("styles the referral destination as a prominent invitation card", () => {
    expect(profile).toContain('href="/referrals"');
    expect(profile).toContain("Бонусы за приглашения");
    expect(profile).toContain("bg-[linear-gradient(120deg,#fff0f8,#f4edff,#fff7ef)]");
  });

  it("keeps additional avatars compact and explains shared anthropometry", () => {
    expect(avatars).toContain("Мои аватары");
    expect(avatars).toContain("образов одного человека");
    expect(avatars).toContain("Антропометрия общая для всех аватаров");
    expect(avatars).toContain("relative w-28");
    expect(avatars).toContain("aspect-[4/5]");
  });
});
