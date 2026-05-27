import { describe, expect, it } from "vitest";
import { parsePositiveInt, validateRequiredAnthropometry } from "./avatar-validation";

describe("validateRequiredAnthropometry", () => {
  it("accepts complete measurements", () => {
    expect(
      validateRequiredAnthropometry({ heightCm: 170, bustCm: 90, waistCm: 70, hipsCm: 98 }),
    ).toBeNull();
  });

  it("requires all mandatory fields", () => {
    expect(validateRequiredAnthropometry({ heightCm: 170 })).toMatch(/рост|груд|тал|бёдер/i);
  });
});

describe("parsePositiveInt", () => {
  it("parses valid numbers", () => {
    expect(parsePositiveInt("170")).toBe(170);
  });

  it("returns undefined for invalid input", () => {
    expect(parsePositiveInt("")).toBeUndefined();
    expect(parsePositiveInt("abc")).toBeUndefined();
  });
});
