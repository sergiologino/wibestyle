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
