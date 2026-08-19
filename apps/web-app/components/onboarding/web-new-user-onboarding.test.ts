import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("web new user onboarding routing", () => {
  it("keeps authenticated new users on welcome slides before avatar setup", () => {
    const welcome = readFileSync(join(process.cwd(), "components", "onboarding", "WelcomeClient.tsx"), "utf8");
    const provider = readFileSync(join(process.cwd(), "components", "providers", "AppSessionProvider.tsx"), "utf8");
    const sync = readFileSync(join(process.cwd(), "lib", "session-onboarding.ts"), "utf8");
    const flow = readFileSync(join(process.cwd(), "lib", "onboarding-flow.ts"), "utf8");
    expect(welcome).toContain("onboarding.welcomeSeen || onboarding.avatarComplete");
    expect(welcome).toContain("function skipOnboarding()");
    expect(welcome).toContain('router.push("/settings")');
    expect(flow).toContain('return "/welcome"');
    expect(provider).toContain("...sessionRef.current.onboarding");
    expect(provider).not.toContain("welcomeSeen: true,");
    expect(sync).toContain("if (!profile.activeAvatarId)");
    expect(sync).not.toContain("welcomeSeen: true,\n      authComplete: true,\n      step: \"avatar\"");
  });
});
