import { describe, expect, it } from "vitest";
import { wibeTokens } from "./index";

describe("wibeTokens", () => {
  it("uses brand pink from landing palette", () => {
    expect(wibeTokens.colors.pink).toBe("#ff1fa2");
  });

  it("defines layered card shadow", () => {
    expect(wibeTokens.shadow.card).toContain("255, 31, 162");
    expect(wibeTokens.shadow.card).toContain("120, 44, 255");
  });
});
