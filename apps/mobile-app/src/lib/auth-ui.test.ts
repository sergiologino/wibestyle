import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile auth screen", () => {
  it("offers phone OTP without exposing email registration", () => {
    const source = readFileSync(join(process.cwd(), "app", "auth.tsx"), "utf8");

    expect(source).toContain("api.startOtp(phone)");
    expect(source).toContain("api.verifyOtp(requestId, code)");
    expect(source).not.toContain("startEmailOtp");
    expect(source).not.toContain('label="Email"');
  });
});
