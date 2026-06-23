import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("AuthClient", () => {
  it("offers phone OTP without exposing email registration", () => {
    const source = readFileSync(join(process.cwd(), "components", "auth", "AuthClient.tsx"), "utf8");

    expect(source).toContain("<OtpForm />");
    expect(source).not.toContain("EmailOtpForm");
    expect(source).not.toContain(">Email<");
  });
});
