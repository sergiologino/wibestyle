import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_FLAGS, isFeatureEnabled } from "./index";

describe("DEFAULT_FEATURE_FLAGS", () => {
  it("keeps future modules disabled in MVP foundation", () => {
    expect(DEFAULT_FEATURE_FLAGS.futureMakeup).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.futureStylist).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.search).toBe(false);
  });
});

describe("isFeatureEnabled", () => {
  it("returns flag value", () => {
    expect(isFeatureEnabled(DEFAULT_FEATURE_FLAGS, "eliteFrame")).toBe(false);
    expect(isFeatureEnabled({ ...DEFAULT_FEATURE_FLAGS, eliteFrame: true }, "eliteFrame")).toBe(true);
  });
});
