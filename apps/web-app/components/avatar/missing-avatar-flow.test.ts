import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("missing avatar flow", () => {
  const topBar = readFileSync(join(process.cwd(), "components", "AppTopBar.tsx"), "utf8");
  const homeGate = readFileSync(join(process.cwd(), "components", "home", "HomeGateClient.tsx"), "utf8");
  const tryOnGate = readFileSync(join(process.cwd(), "components", "try-on", "TryOnGateClient.tsx"), "utf8");
  const avatarManager = readFileSync(join(process.cwd(), "components", "avatar", "AvatarManager.tsx"), "utf8");

  it("keeps browsing available and places a global link to avatar setup", () => {
    expect(topBar).toContain("AvatarRequiredNotice compact");
    expect(homeGate).not.toContain("getNextOnboardingRoute");
    expect(tryOnGate).not.toContain("tryOnSetupRedirect");
    expect(tryOnGate).toContain("pointer-events-none");
  });

  it("opens first-avatar upload directly in profile", () => {
    expect(avatarManager).toContain("needsFirstAvatar");
    expect(avatarManager).toContain("adding || needsFirstAvatar");
    expect(avatarManager).toContain("Добавить фото");
    expect(avatarManager).not.toContain("Добавьте фото ниже");
    expect(avatarManager).toContain("primaryAction={newPhoto ? (");
    expect(avatarManager).toContain("Создать аватар");
  });
});
