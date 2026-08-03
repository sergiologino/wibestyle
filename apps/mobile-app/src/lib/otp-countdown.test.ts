import { describe, expect, it } from "vitest";
import { formatCountdown, secondsUntil } from "./otp-countdown";

describe("OTP resend countdown", () => {
  it("rounds up the remaining time so a resend is never offered early", () => {
    expect(secondsUntil(180_100, 100)).toBe(180);
    expect(secondsUntil(101, 100)).toBe(1);
    expect(secondsUntil(100, 100)).toBe(0);
  });

  it("formats the 180-second backend cooldown for the mobile UI", () => {
    expect(formatCountdown(180)).toBe("3:00");
    expect(formatCountdown(61)).toBe("1:01");
    expect(formatCountdown(0)).toBe("0:00");
  });
});
