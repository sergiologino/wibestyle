import { describe, expect, it } from "vitest";
import { foundationSteps } from "./foundation-steps";

describe("foundationSteps", () => {
  it("describes MVP try-on flow", () => {
    expect(foundationSteps).toHaveLength(3);
    expect(foundationSteps[1]?.title).toContain("ссылку");
  });
});
