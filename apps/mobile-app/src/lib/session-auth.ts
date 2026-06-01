import { ApiError } from "@wibestyle/api-client";

export const ACCESS_TOKEN_REFRESH_LEAD_MS = 5 * 60 * 1000;
export const DEFAULT_ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_EXPIRY_SKEW_MS = 30_000;

export function decodeJwtExpMs(accessToken: string): number | null {
  try {
    const segment = accessToken.split(".")[1];
    if (!segment) return null;
    const payload = JSON.parse(atob(segment.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function resolveAccessTokenExpiresAtMs(
  accessToken: string | null | undefined,
  accessTokenExpiresAt?: number | null,
): number | null {
  if (accessToken) {
    const jwtExp = decodeJwtExpMs(accessToken);
    if (jwtExp) return jwtExp;
  }
  return accessTokenExpiresAt ?? null;
}

export function isAccessTokenUsable(
  accessToken: string | null | undefined,
  accessTokenExpiresAt?: number | null,
  now = Date.now(),
): boolean {
  if (!accessToken) return false;
  const exp = resolveAccessTokenExpiresAtMs(accessToken, accessTokenExpiresAt);
  if (!exp) return true;
  return now + ACCESS_TOKEN_EXPIRY_SKEW_MS < exp;
}

export function computeAccessTokenExpiresAt(expiresInSeconds?: number | null): number {
  const ttlMs =
    expiresInSeconds && expiresInSeconds > 0
      ? expiresInSeconds * 1000
      : DEFAULT_ACCESS_TOKEN_TTL_MS;
  return Date.now() + ttlMs;
}

export function shouldRefreshAccessToken(
  accessToken: string | null | undefined,
  accessTokenExpiresAt: number | null | undefined,
  now = Date.now(),
): boolean {
  if (!accessToken) return true;
  const exp = resolveAccessTokenExpiresAtMs(accessToken, accessTokenExpiresAt);
  if (!exp) return true;
  return now >= exp - ACCESS_TOKEN_REFRESH_LEAD_MS;
}

export function isAuthenticatedSession(session: {
  accessToken?: string | null;
  accessTokenExpiresAt?: number | null;
}): boolean {
  return isAccessTokenUsable(session.accessToken, session.accessTokenExpiresAt);
}

export function isRefreshTokenRejected(err: unknown): boolean {
  return err instanceof ApiError && err.code === "REFRESH_TOKEN_INVALID";
}

export function isTransientRefreshError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status >= 500 || err.status === 408 || err.status === 429;
  }
  return err instanceof TypeError;
}

let refreshInFlight: Promise<boolean> | null = null;

export async function withRefreshLock(task: () => Promise<boolean>): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = task().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}
