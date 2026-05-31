import { describe, expect, it } from "vitest";
import {
  isPaidSubscription,
  isExternalPaymentUrl,
  subscriptionNudgeLevel,
  subscriptionNudgeCopy,
} from "./billing-plan";
import type { UserProfile } from "@wibestyle/shared-types";

const trialProfile = (left: number): UserProfile => ({
  userId: "u1",
  plan: "trial",
  trialGenerationsLeft: left,
});

describe("billing-plan", () => {
  it("detects paid subscription", () => {
    expect(isPaidSubscription(trialProfile(3))).toBe(false);
    expect(isPaidSubscription({ ...trialProfile(0), plan: "wibe" })).toBe(true);
  });

  it("escalates nudge by trial remaining", () => {
    expect(subscriptionNudgeLevel(trialProfile(5))).toBe("soft");
    expect(subscriptionNudgeLevel(trialProfile(3))).toBe("medium");
    expect(subscriptionNudgeLevel(trialProfile(1))).toBe("urgent");
    expect(subscriptionNudgeLevel({ ...trialProfile(2), plan: "elite" })).toBe("none");
  });

  it("builds nudge copy", () => {
    expect(subscriptionNudgeCopy("medium", 2).title).toContain("2");
  });

  it("detects external yookassa redirect", () => {
    expect(isExternalPaymentUrl("yookassa", "https://yoomoney.ru/checkout")).toBe(true);
    expect(isExternalPaymentUrl("mock", "/api/v1/billing/webhooks/mock/simulate")).toBe(false);
  });
});
