import { describe, expect, it } from "vitest";
import { pricing } from "./site";

describe("pricing", () => {
  it("annual price is 6990 RUB", () => {
    expect(pricing.annualRub).toBe(6990);
  });

  it("first 100 users get 50% discount", () => {
    expect(pricing.discountedAnnualRub).toBe(3495);
    expect(pricing.discountPercent).toBe(50);
    expect(pricing.firstUsersLimit).toBe(100);
  });
});
