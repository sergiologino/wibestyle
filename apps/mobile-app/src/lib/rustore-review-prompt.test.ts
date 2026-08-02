import { describe, expect, it } from "vitest";
import {
  deferReviewPromptInState,
  emptyReviewPromptState,
  getReviewPromptThreshold,
  recordNegativeReviewFeedbackInState,
  recordSuccessfulTryOnInState,
  shouldShowReviewPromptGate,
} from "./rustore-review-prompt";

describe("RuStore review prompt logic", () => {
  it("uses 3 successful try-ons for trial and 5 for paid users", () => {
    expect(getReviewPromptThreshold("trial")).toBe(3);
    expect(getReviewPromptThreshold("wibe")).toBe(5);
    expect(getReviewPromptThreshold("elite")).toBe(5);
  });

  it("counts each try-on session only once", () => {
    const first = recordSuccessfulTryOnInState(emptyReviewPromptState(), "session-1");
    const duplicate = recordSuccessfulTryOnInState(first, "session-1");
    expect(duplicate.successfulTryOnCount).toBe(1);
    expect(duplicate.countedSessionIds).toEqual(["session-1"]);
  });

  it("shows the gate after the trial threshold", () => {
    const now = new Date("2026-07-30T10:00:00.000Z");
    const state = ["s1", "s2", "s3"].reduce(recordSuccessfulTryOnInState, emptyReviewPromptState());
    expect(shouldShowReviewPromptGate(state, "trial", now)).toBe(true);
  });

  it("does not show during postpone or negative feedback cooldown", () => {
    const now = new Date("2026-07-30T10:00:00.000Z");
    const ready = ["s1", "s2", "s3"].reduce(recordSuccessfulTryOnInState, emptyReviewPromptState());
    expect(shouldShowReviewPromptGate(deferReviewPromptInState(ready, now), "trial", now)).toBe(false);
    expect(shouldShowReviewPromptGate(recordNegativeReviewFeedbackInState(ready, "bad_fit", now), "trial", now)).toBe(false);
  });
});
