import { ApiError } from "@wibestyle/api-client";

export const SESSION_STORAGE_KEY = "wibestyle.app.session";

/** Refresh access token this many ms before JWT expiry. */
export const ACCESS_TOKEN_REFRESH_LEAD_MS = 5 * 60 * 1000;

export const DEFAULT_ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Clock skew tolerance when checking JWT expiry. */
export const ACCESS_TOKEN_EXPIRY_SKEW_MS = 30_000;

export type StoredAppSession = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt?: number | null;
  phone: string | null;
  profile: unknown | null;
  onboarding: unknown;
};

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

export function needsAccessTokenRefresh(session: {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt?: number | null;
}): boolean {
  if (!session.refreshToken) {
    return false;
  }
  if (!session.accessToken) {
    return true;
  }
  return shouldRefreshAccessToken(session.accessToken, session.accessTokenExpiresAt);
}

export function isAuthenticatedSession(session: {
  accessToken?: string | null;
  refreshToken?: string | null;
  profile?: unknown | null;
  accessTokenExpiresAt?: number | null;
}): boolean {
  if (session.refreshToken) return true;
  if (session.profile) return true;
  return isAccessTokenUsable(session.accessToken, session.accessTokenExpiresAt);
}

export function hasPersistedCredentials(): boolean {
  const raw = readStoredSessionRaw();
  return Boolean(raw?.refreshToken || raw?.accessToken || raw?.profile);
}

export function isRefreshTokenRejected(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export function isTransientRefreshError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status >= 500 || err.status === 408 || err.status === 429;
  }
  return err instanceof TypeError;
}

export async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request("wibestyle-auth-refresh", task);
  }
  return task();
}

export function readStoredSessionRaw(): StoredAppSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredAppSession;
  } catch {
    return null;
  }
}
