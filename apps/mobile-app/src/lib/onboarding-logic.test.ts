import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { UserProfile } from "@wibestyle/shared-types";
import {
  advanceOnboarding,
  canStartGeneration,
  getInitialRoute,
  INITIAL_ONBOARDING,
  resolvePostAuthRoute,
  syncOnboardingFromProfile,
} from "./onboarding-logic";

describe("onboarding-logic", () => {
  it("routes new users to welcome", () => {
    expect(getInitialRoute(INITIAL_ONBOARDING)).toBe("/welcome");
  });

  it("routes authenticated users with avatar to home", () => {
    const onboarding = advanceOnboarding(
      advanceOnboarding(advanceOnboarding(INITIAL_ONBOARDING, "welcome"), "auth"),
      "avatar",
    );
    expect(getInitialRoute(onboarding)).toBe("/(main)/home");
  });

  it("syncs avatar completion from profile", () => {
    const profile = {
      userId: "u1",
      plan: "trial",
      trialGenerationsLeft: 2,
      activeAvatarId: "a1",
    } as UserProfile;
    const synced = syncOnboardingFromProfile(INITIAL_ONBOARDING, profile);
    expect(synced.avatarComplete).toBe(true);
    expect(synced.step).toBe("complete");
  });

  it("sends post-auth to the unified profile avatar flow when needed", () => {
    expect(resolvePostAuthRoute({ newUser: true, hasActiveAvatar: false })).toBe("/(main)/profile");
    expect(resolvePostAuthRoute({ newUser: false, hasActiveAvatar: true })).toBe("/(main)/home");
  });

  it("keeps the legacy onboarding URL as a redirect to the shared profile screen", () => {
    const route = readFileSync(join(process.cwd(), "app", "onboarding", "avatar.tsx"), "utf8");
    expect(route).toContain('<Redirect href="/(main)/profile" />');
  });

  it("respects explicit paywall route after onboarding registration", () => {
    expect(resolvePostAuthRoute({ newUser: true, hasActiveAvatar: false, nextParam: "/paywall" })).toBe("/paywall");
  });

  it("allows trial users to spend referral bonuses", () => {
    expect(canStartGeneration({
      userId: "u1",
      plan: "trial",
      trialGenerationsLeft: 0,
      bonusGenerationsLeft: 3,
    })).toBe(true);
  });
});
