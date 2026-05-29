import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_REFRESH_LEAD_MS,
  computeAccessTokenExpiresAt,
  decodeJwtExpMs,
  isAccessTokenUsable,
  isAuthenticatedSession,
  isRefreshTokenRejected,
  isTransientRefreshError,
  needsAccessTokenRefresh,
  shouldRefreshAccessToken,
} from "@/lib/session-auth";
import { ApiError } from "@wibestyle/api-client";

function jwtWithExp(expSeconds: number) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: "user-1", exp: expSeconds }));
  return `${header}.${payload}.signature`;
}

describe("session-auth", () => {
  it("computes access token expiry from expiresIn", () => {
    const before = Date.now();
    const expiresAt = computeAccessTokenExpiresAt(3600);
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000 - 5);
    expect(expiresAt).toBeLessThanOrEqual(before + 3600 * 1000 + 5);
  });

  it("reads JWT exp from access token", () => {
    const exp = 1_780_054_062;
    const token = jwtWithExp(exp);
    expect(decodeJwtExpMs(token)).toBe(exp * 1000);
    expect(isAccessTokenUsable(token, null, exp * 1000 - 60_000)).toBe(true);
    expect(isAccessTokenUsable(token, null, exp * 1000 + 60_000)).toBe(false);
  });

  it("refreshes before JWT expiry lead window", () => {
    const now = 1_000_000;
    const token = jwtWithExp(Math.floor((now + ACCESS_TOKEN_REFRESH_LEAD_MS) / 1000));
    expect(shouldRefreshAccessToken(token, null, now)).toBe(true);
    const freshToken = jwtWithExp(Math.floor((now + ACCESS_TOKEN_REFRESH_LEAD_MS + 60_000) / 1000));
    expect(shouldRefreshAccessToken(freshToken, null, now)).toBe(false);
  });

  it("detects when session needs refresh", () => {
    const freshToken = jwtWithExp(Math.floor((Date.now() + 60 * 60 * 1000) / 1000));
    expect(
      needsAccessTokenRefresh({
        accessToken: freshToken,
        refreshToken: "r",
        accessTokenExpiresAt: Date.now() + 60 * 60 * 1000,
      }),
    ).toBe(false);
    expect(
      needsAccessTokenRefresh({
        accessToken: null,
        refreshToken: "r",
        accessTokenExpiresAt: null,
      }),
    ).toBe(true);
  });

  it("treats refresh token or profile as authenticated", () => {
    expect(isAuthenticatedSession({ refreshToken: "r" })).toBe(true);
    expect(isAuthenticatedSession({ profile: { userId: "1" } })).toBe(true);
    expect(isAuthenticatedSession({ accessToken: null, refreshToken: null, profile: null })).toBe(false);
  });

  it("detects rejected refresh tokens", () => {
    expect(isRefreshTokenRejected(new ApiError("Invalid refresh token", 401, "REFRESH_TOKEN_INVALID"))).toBe(true);
    expect(isRefreshTokenRejected(new ApiError("Server error", 500))).toBe(false);
    expect(isTransientRefreshError(new ApiError("Server error", 500))).toBe(true);
    expect(isTransientRefreshError(new TypeError("Failed to fetch"))).toBe(true);
  });
});
