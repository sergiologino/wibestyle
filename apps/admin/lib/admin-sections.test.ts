import { describe, expect, it } from "vitest";
import { adminSections } from "./admin-sections";

describe("adminSections", () => {
  it("includes leads module for foundation", () => {
    expect(adminSections.some((section) => section.id === "leads")).toBe(true);
  });

  it("links referral conversion report", () => {
    const referrals = adminSections.find((section) => section.id === "referrals");
    expect(referrals?.href).toBe("/referrals");
    expect(referrals?.status).toBe("Ready");
  });

  it("includes gallery moderation module", () => {
    const gallery = adminSections.find((section) => section.id === "gallery");
    expect(gallery?.href).toBe("/gallery");
    expect(gallery?.status).toBe("Ready");
  });

  it("links AI providers module", () => {
    const providers = adminSections.find((section) => section.id === "providers");
    expect(providers?.href).toBe("/ai-providers");
    expect(providers?.status).toBe("Ready");
  });
});
