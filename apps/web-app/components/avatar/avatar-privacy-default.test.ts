import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("avatar privacy defaults", () => {
  it("keeps face visible until the user opts into hiding it", () => {
    const onboarding = readFileSync(join(process.cwd(), "components", "onboarding", "AvatarOnboardingForm.tsx"), "utf8");
    const profile = readFileSync(join(process.cwd(), "components", "settings", "ProfileSettingsClient.tsx"), "utf8");
    const manager = readFileSync(join(process.cwd(), "components", "avatar", "AvatarManager.tsx"), "utf8");

    expect(onboarding).toContain("const [hideFace, setHideFace] = useState(false)");
    expect(profile).toContain("setHideFace(profile.privacy?.faceHidden ?? false)");
    expect(manager).toContain("const [hideFace, setHideFace] = useState(false)");
  });
});
