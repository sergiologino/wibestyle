import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_REFRESH_LEAD_MS,
  CLOTHING_SIZES,
  DEFAULT_FEATURE_FLAGS,
  computeAccessTokenExpiresAt,
  isAccessTokenUsable,
  isFeatureEnabled,
  shouldRefreshAccessToken,
} from "./index";

describe("DEFAULT_FEATURE_FLAGS", () => {
  it("keeps future modules disabled in MVP foundation", () => {
    expect(DEFAULT_FEATURE_FLAGS.futureMakeup).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.futureStylist).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.search).toBe(false);
  });
});

describe("isFeatureEnabled", () => {
  it("returns flag value", () => {
    expect(isFeatureEnabled(DEFAULT_FEATURE_FLAGS, "eliteFrame")).toBe(false);
    expect(isFeatureEnabled({ ...DEFAULT_FEATURE_FLAGS, eliteFrame: true }, "eliteFrame")).toBe(true);
  });
});

describe("shared fashion constants", () => {
  it("keeps clothing sizes in one shared order", () => {
    expect(CLOTHING_SIZES).toEqual(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);
  });
});

describe("session token helpers", () => {
  function jwtWithExp(expSeconds: number) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ sub: "user-1", exp: expSeconds }));
    return `${header}.${payload}.signature`;
  }

  it("computes fallback access expiry from expiresIn", () => {
    const before = Date.now();
    const expiresAt = computeAccessTokenExpiresAt(3600);
    expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000 - 5);
    expect(expiresAt).toBeLessThanOrEqual(before + 3600 * 1000 + 5);
  });

  it("uses JWT exp and refresh lead consistently across clients", () => {
    const now = 1_000_000;
    const freshToken = jwtWithExp(Math.floor((now + ACCESS_TOKEN_REFRESH_LEAD_MS + 60_000) / 1000));
    const expiringToken = jwtWithExp(Math.floor((now + ACCESS_TOKEN_REFRESH_LEAD_MS) / 1000));

    expect(isAccessTokenUsable(freshToken, null, now)).toBe(true);
    expect(shouldRefreshAccessToken(freshToken, null, now)).toBe(false);
    expect(shouldRefreshAccessToken(expiringToken, null, now)).toBe(true);
  });
});
