import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile profile balance refresh", () => {
  const home = readFileSync(join(process.cwd(), "app", "(main)", "home.tsx"), "utf8");
  const profileEditor = readFileSync(join(process.cwd(), "src", "components", "profile", "ProfileEditor.tsx"), "utf8");

  it("refreshes /me when the home screen opens and on pull-to-refresh", () => {
    expect(home).toContain("RefreshControl");
    expect(home).toContain("refreshProfile");
    expect(home).toContain("await refreshProfile();");
    expect(home).toContain("refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}");
  });

  it("shows a combined available try-on balance on the home screen", () => {
    expect(home).toContain("profile.trialGenerationsLeft + (profile.bonusGenerationsLeft ?? 0)");
    expect(home).toContain("(profile?.planGenerationsLeft ?? 0) + (profile?.bonusGenerationsLeft ?? 0)");
  });

  it("lets the profile screen pull fresh profile data", () => {
    expect(profileEditor).toContain("RefreshControl");
    expect(profileEditor).toContain("await refreshProfile();");
    expect(profileEditor).toContain("refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}");
  });
});
