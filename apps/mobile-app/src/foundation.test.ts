import { describe, expect, it } from "vitest";
import { mobileFoundation } from "./foundation";

describe("mobileFoundation", () => {
  it("targets single-item photo try-on MVP", () => {
    expect(mobileFoundation.primaryFlow).toBe("single-item-photo-try-on");
  });
});
