import { describe, expect, it } from "vitest";
import { onboardingPitchSteps } from "./onboarding-copy";

describe("onboardingPitchSteps", () => {
  it("has three onboarding steps for first launch", () => {
    expect(onboardingPitchSteps).toHaveLength(3);
  });
});
