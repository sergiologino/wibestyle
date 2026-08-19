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
    expect(topBar).toContain("hasReadyAvatar === false");
    expect(homeGate).not.toContain("getNextOnboardingRoute");
    expect(tryOnGate).not.toContain("pointer-events-none");
    expect(tryOnGate).toContain("api.listAvatars()");
    expect(tryOnGate).toContain('avatar.status === "READY" && avatar.active');
    expect(tryOnGate).toContain("tryOnSetupMessage(setupIssue)");
  });

  it("opens first-avatar upload directly in profile only after avatars are loaded", () => {
    expect(avatarManager).toContain("needsFirstAvatar");
    expect(avatarManager).toContain("!loading && !activeAvatarId && readyAvatarCount === 0");
    expect(avatarManager).toContain("adding || needsFirstAvatar");
    expect(avatarManager).toContain("Добавить фото");
    expect(avatarManager).not.toContain("Добавьте фото ниже");
    expect(avatarManager).toContain("void addAvatar(newPhoto)");
    expect(avatarManager).not.toContain("primaryAction={newPhoto ? (");
    expect(avatarManager).not.toContain("Создать аватар");
  });
});
