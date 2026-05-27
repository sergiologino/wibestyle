import { ApiError } from "@wibestyle/api-client";

export const SESSION_STORAGE_KEY = "wibestyle.app.session";

/** Refresh access token this many ms before JWT expiry. */
export const ACCESS_TOKEN_REFRESH_LEAD_MS = 5 * 60 * 1000;

export const DEFAULT_ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

export type StoredAppSession = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt?: number | null;
  phone: string | null;
  profile: unknown | null;
  onboarding: unknown;
};

export function computeAccessTokenExpiresAt(expiresInSeconds?: number | null): number {
  const ttlMs =
    expiresInSeconds && expiresInSeconds > 0
      ? expiresInSeconds * 1000
      : DEFAULT_ACCESS_TOKEN_TTL_MS;
  return Date.now() + ttlMs;
}

export function shouldRefreshAccessToken(
  accessTokenExpiresAt: number | null | undefined,
  now = Date.now(),
): boolean {
  if (!accessTokenExpiresAt) {
    return false;
  }
  return now >= accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_LEAD_MS;
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
