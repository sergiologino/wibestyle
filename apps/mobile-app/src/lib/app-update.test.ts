import { describe, expect, it } from "vitest";
import { compareVersions, shouldPromptForUpdate } from "./app-update";

describe("mobile app update logic", () => {
  it("compares dotted app versions numerically", () => {
    expect(compareVersions("1.0.9", "1.0.10")).toBe(-1);
    expect(compareVersions("1.2.0", "1.1.9")).toBe(1);
    expect(compareVersions("1.0", "1.0.0")).toBe(0);
  });

  it("separates recommended and required updates", () => {
    expect(shouldPromptForUpdate({
      currentVersion: "1.0.0",
      latestVersion: "1.0.1",
      minSupportedVersion: "1.0.0",
      forceUpdate: false,
    })).toEqual({ required: false, recommended: true, shouldPrompt: true });

    expect(shouldPromptForUpdate({
      currentVersion: "1.0.0",
      latestVersion: "1.0.2",
      minSupportedVersion: "1.0.1",
      forceUpdate: false,
    })).toEqual({ required: true, recommended: true, shouldPrompt: true });
  });
});
