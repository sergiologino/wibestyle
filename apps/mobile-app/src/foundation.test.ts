import { describe, expect, it } from "vitest";
import { mobileFoundation } from "./foundation";
import { colors } from "./theme/tokens";

describe("mobile foundation", () => {
  it("keeps product naming", () => {
    expect(mobileFoundation.appName).toBe("Я на стиле");
  });

  it("uses brand pink token", () => {
    expect(colors.pink).toBe("#ff1fa2");
  });
});
