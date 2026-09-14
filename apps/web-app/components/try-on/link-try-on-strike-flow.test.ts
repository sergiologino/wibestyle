import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("web link try-on strike flow", () => {
  const source = readFileSync(join(process.cwd(), "components", "try-on", "LinkTryOnClient.tsx"), "utf8");

  it("offers hairstyle and hair color selection for the stylist focus group", () => {
    expect(source).toContain("profile?.stylistAvailable");
    expect(source).toContain('data-testid="link-try-on-hair-strike"');
    expect(source).toContain('data-testid="link-try-on-hair-color-gallery"');
    expect(source).toContain("api.getHairColorCatalog");
  });

  it("runs clothing first and then hairstyle from the finished try-on session", () => {
    expect(source).toContain("api.generateTryOn(created.session.id)");
    expect(source).toContain("waitForClothingResult(created.session.id)");
    expect(source).toContain("api.createHairstyleTryOnFromSession(created.session.id, selectedStyleId, selectedColorId)");
    expect(source).toContain("hasEnoughGenerationsForStrike(profile)");
  });
});
