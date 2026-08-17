import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("avatar privacy defaults", () => {
  it("keeps face visible until the user opts into hiding it", () => {
    const onboardingRoute = readFileSync(join(process.cwd(), "app", "onboarding", "avatar", "page.tsx"), "utf8");
    const profile = readFileSync(join(process.cwd(), "components", "settings", "ProfileSettingsClient.tsx"), "utf8");
    const manager = readFileSync(join(process.cwd(), "components", "avatar", "AvatarManager.tsx"), "utf8");
    const preview = readFileSync(join(process.cwd(), "components", "avatar", "AvatarPrivacyPreview.tsx"), "utf8");

    expect(onboardingRoute).toContain('redirect("/settings")');
    expect(profile).toContain("setHideFace(profile.privacy?.faceHidden ?? false)");
    expect(manager).toContain("const [hideFace, setHideFace] = useState(false)");
    expect(preview).not.toContain("Скрыть фон");
    expect(preview).not.toContain("avatar-preview--hide-bg");
    expect(manager).toContain("privacyBackgroundHidden: false");
    expect(preview).toContain("showSelectHint");
    expect(preview).toContain("Нажмите на образец");
    expect(preview).toContain("Кликните по образцу");
    expect(preview).toContain("avatarTapHint");
  });
});
