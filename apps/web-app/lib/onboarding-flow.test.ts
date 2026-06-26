import { describe, expect, it } from "vitest";
import {
  INITIAL_ONBOARDING,
  advanceOnboarding,
  canStartGeneration,
  getNextOnboardingRoute,
  resolvePostAuthRoute,
  shouldShowPaywall,
} from "./onboarding-flow";

describe("getNextOnboardingRoute", () => {
  it("starts at welcome", () => {
    expect(getNextOnboardingRoute(INITIAL_ONBOARDING)).toBe("/welcome");
  });

  it("routes to avatar after auth", () => {
    const state = advanceOnboarding(advanceOnboarding(INITIAL_ONBOARDING, "welcome"), "auth");
    expect(getNextOnboardingRoute(state)).toBe("/onboarding/avatar");
  });

  it("does not send logged-in users back to welcome", () => {
    const state = { ...INITIAL_ONBOARDING, authComplete: true, welcomeSeen: false };
    expect(getNextOnboardingRoute(state)).toBe("/onboarding/avatar");
  });
});

describe("resolvePostAuthRoute", () => {
  it("sends new users to onboarding even with next param", () => {
    expect(
      resolvePostAuthRoute({ newUser: true, hasActiveAvatar: false, nextParam: "/favorites" }),
    ).toBe("/onboarding/avatar");
  });

  it("allows the onboarding trial path to continue to paywall after registration", () => {
    expect(
      resolvePostAuthRoute({ newUser: true, hasActiveAvatar: false, nextParam: "/paywall" }),
    ).toBe("/paywall");
  });

  it("respects next for returning users with avatar", () => {
    expect(
      resolvePostAuthRoute({ newUser: false, hasActiveAvatar: true, nextParam: "/favorites" }),
    ).toBe("/favorites");
  });

  it("falls back to home without next", () => {
    expect(
      resolvePostAuthRoute({ newUser: false, hasActiveAvatar: true, nextParam: null }),
    ).toBe("/home");
  });
});

describe("shouldShowPaywall", () => {
  it("shows paywall when trial is exhausted", () => {
    const profile = {
      userId: "1",
      plan: "trial" as const,
      trialGenerationsLeft: 0,
    };
    expect(shouldShowPaywall(profile, "trial_exhausted")).toBe(true);
  });
});

describe("canStartGeneration", () => {
  it("allows generation while trial quota remains", () => {
    expect(
      canStartGeneration({ userId: "1", plan: "trial", trialGenerationsLeft: 2 }),
    ).toBe(true);
  });
});
