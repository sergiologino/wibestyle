import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_REFRESH_LEAD_MS,
  computeAccessTokenExpiresAt,
  isRefreshTokenRejected,
  isTransientRefreshError,
  shouldRefreshAccessToken,
} from "@/lib/session-auth";
import { ApiError } from "@wibestyle/api-client";

describe("session-auth", () => {
  it("computes access token expiry from expiresIn", () => {
    const before = Date.now();
    const expiresAt = computeAccessTokenExpiresAt(3600);
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000 - 5);
    expect(expiresAt).toBeLessThanOrEqual(before + 3600 * 1000 + 5);
  });

  it("refreshes before JWT expiry lead window", () => {
    const now = 1_000_000;
    const expiresAt = now + ACCESS_TOKEN_REFRESH_LEAD_MS - 1;
    expect(shouldRefreshAccessToken(expiresAt, now)).toBe(true);
    expect(shouldRefreshAccessToken(expiresAt + ACCESS_TOKEN_REFRESH_LEAD_MS + 1, now)).toBe(false);
  });

  it("detects rejected refresh tokens", () => {
    expect(isRefreshTokenRejected(new ApiError("Invalid refresh token", 401, "REFRESH_TOKEN_INVALID"))).toBe(true);
    expect(isRefreshTokenRejected(new ApiError("Server error", 500))).toBe(false);
    expect(isTransientRefreshError(new ApiError("Server error", 500))).toBe(true);
    expect(isTransientRefreshError(new TypeError("Failed to fetch"))).toBe(true);
  });
});
