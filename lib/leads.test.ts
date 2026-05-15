import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { getRemainingDiscountSpots, registerLead } from "./leads";

const leadsFile = path.join(process.cwd(), "data", "leads.json");

afterEach(async () => {
  try {
    await fs.unlink(leadsFile);
  } catch {
    // ignore
  }
});

describe("registerLead", () => {
  it("assigns discount for first registration", async () => {
    const record = await registerLead({
      phoneOrEmail: "test@example.com",
      consent: true,
      createdAt: new Date().toISOString(),
    });
    expect(record.spotNumber).toBe(1);
    expect(record.hasDiscount).toBe(true);
    expect(record.priceWithDiscount).toBe(3495);
  });

  it("tracks remaining discount spots", async () => {
    await registerLead({
      phoneOrEmail: "a@test.com",
      consent: true,
      createdAt: new Date().toISOString(),
    });
    const remaining = await getRemainingDiscountSpots();
    expect(remaining).toBe(99);
  });
});
