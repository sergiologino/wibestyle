import { describe, expect, it } from "vitest";
import { adminSections } from "./admin-sections";

describe("adminSections", () => {
  it("includes leads module for foundation", () => {
    expect(adminSections.some((section) => section.id === "leads")).toBe(true);
  });

  it("includes gallery moderation module", () => {
    const gallery = adminSections.find((section) => section.id === "gallery");
    expect(gallery?.href).toBe("/gallery");
    expect(gallery?.status).toBe("Ready");
  });
});
