import { ApiError } from "@wibestyle/api-client";
export {
  ACCESS_TOKEN_EXPIRY_SKEW_MS,
  ACCESS_TOKEN_REFRESH_LEAD_MS,
  DEFAULT_ACCESS_TOKEN_TTL_MS,
  computeAccessTokenExpiresAt,
  decodeJwtExpMs,
  hasStoredCredentials,
  isAccessTokenUsable,
  isAuthenticatedSession,
  needsAccessTokenRefresh,
  resolveAccessTokenExpiresAtMs,
  shouldRefreshAccessToken,
} from "@wibestyle/shared-types";

export const SESSION_STORAGE_KEY = "wibestyle.app.session";

export type StoredAppSession = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt?: number | null;
  phone: string | null;
  profile: unknown | null;
  onboarding: unknown;
};

export function isRefreshTokenRejected(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.code === "REFRESH_TOKEN_INVALID";
  }
  return false;
}

export function hasPersistedCredentials(): boolean {
  const raw = readStoredSessionRaw();
  return Boolean(raw?.refreshToken || raw?.accessToken);
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
