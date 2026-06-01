import { describe, expect, it } from "vitest";
import { isAccessTokenUsable, shouldRefreshAccessToken } from "./session-auth";

describe("session-auth", () => {
  it("treats missing token as not usable", () => {
    expect(isAccessTokenUsable(null)).toBe(false);
  });

  it("refreshes when expiry is near", () => {
    const exp = Date.now() + 60_000;
    const token = "header." + btoa(JSON.stringify({ exp: Math.floor(exp / 1000) })) + ".sig";
    expect(shouldRefreshAccessToken(token, exp)).toBe(true);
  });
});
