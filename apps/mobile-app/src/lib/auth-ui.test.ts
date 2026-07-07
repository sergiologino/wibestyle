import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile auth screen", () => {
  it("offers SMS Aero MobileID without exposing legacy OTP or email registration", () => {
    const source = readFileSync(join(process.cwd(), "app", "auth.tsx"), "utf8");

    expect(source).toContain("api.getMobileIdStatus()");
    expect(source).toContain("/auth/mobile-id");
    expect(source).toContain("searchParams.ref");
    expect(source).not.toContain("api.startOtp(");
    expect(source).not.toContain("api.verifyOtp(");
    expect(source).not.toContain("startEmailOtp");
    expect(source).not.toContain('label="Email"');
  });
});
