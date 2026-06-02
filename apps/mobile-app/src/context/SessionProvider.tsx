import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { WibeStyleApiClient } from "@wibestyle/api-client";
import type { UserProfile } from "@wibestyle/shared-types";
import { getApiBaseUrl } from "@/lib/config";
import {
  advanceOnboarding,
  syncOnboardingFromProfile,
  type OnboardingState,
} from "@/lib/onboarding-logic";
import {
  clearStoredSession,
  EMPTY_SESSION,
  persistSession,
  readStoredSession,
  type StoredSession,
} from "@/lib/session-storage";
import {
  computeAccessTokenExpiresAt,
  isAuthenticatedSession,
  isRefreshTokenRejected,
  isTransientRefreshError,
  shouldRefreshAccessToken,
  withRefreshLock,
} from "@/lib/session-auth";
import { createMobileUploadHelpers } from "@/lib/mobile-api";

type SessionContextValue = StoredSession & {
  api: WibeStyleApiClient;
  uploads: ReturnType<typeof createMobileUploadHelpers>;
  sessionReady: boolean;
  completeOnboardingStep: (step: OnboardingState["step"]) => void;
  setAuth: (
    accessToken: string,
    phone: string,
    profile: UserProfile,
    refreshToken?: string | null,
    expiresInSeconds?: number | null,
  ) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getAccessTokenForMedia: () => Promise<string | null>;
  ensureSession: () => Promise<boolean>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession>(EMPTY_SESSION);
  const [sessionReady, setSessionReady] = useState(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const current = sessionRef.current;
    if (!current.refreshToken) return false;
    try {
      const baseUrl = getApiBaseUrl();
      const tempClient = new WibeStyleApiClient({ baseUrl });
      const tokens = await tempClient.refreshToken(current.refreshToken);
      const meClient = new WibeStyleApiClient({
        baseUrl,
        getAccessToken: () => tokens.accessToken,
      });
      const me = await meClient.me();
      const next: StoredSession = {
        ...current,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? current.refreshToken,
        accessTokenExpiresAt: computeAccessTokenExpiresAt(tokens.expiresIn),
        phone: current.phone ?? me.user.phone ?? me.user.login ?? me.user.email ?? "",
        profile: me.profile,
        onboarding: syncOnboardingFromProfile(current.onboarding, me.profile),
      };
      sessionRef.current = next;
      setSession(next);
      await persistSession(next);
      return true;
    } catch (err) {
      if (isRefreshTokenRejected(err)) {
        if (isAuthenticatedSession(current)) {
          return true;
        }
        await clearStoredSession();
        sessionRef.current = EMPTY_SESSION;
        setSession(EMPTY_SESSION);
        return false;
      }
      if (isTransientRefreshError(err) && isAuthenticatedSession(current)) {
        return true;
      }
      return false;
    }
  }, []);

  const api = useMemo(
    () =>
      new WibeStyleApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken: () => sessionRef.current.accessToken,
        onUnauthorized: () => withRefreshLock(refreshAccessToken),
      }),
    [refreshAccessToken],
  );

  const uploads = useMemo(
    () =>
      createMobileUploadHelpers(
        getApiBaseUrl(),
        () => sessionRef.current.accessToken,
        () => withRefreshLock(refreshAccessToken),
      ),
    [refreshAccessToken],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await readStoredSession();
      if (!active) return;
      sessionRef.current = stored;
      setSession(stored);
      if (stored.refreshToken && shouldRefreshAccessToken(stored.accessToken, stored.accessTokenExpiresAt)) {
        await withRefreshLock(refreshAccessToken);
      }
      if (active) setSessionReady(true);
    })();
    return () => {
      active = false;
    };
  }, [refreshAccessToken]);

  useEffect(() => {
    if (!session.refreshToken) {
      return;
    }

    function refreshIfNeeded() {
      const current = sessionRef.current;
      if (!current.refreshToken) {
        return;
      }
      if (shouldRefreshAccessToken(current.accessToken, current.accessTokenExpiresAt)) {
        void withRefreshLock(refreshAccessToken);
      }
    }

    refreshIfNeeded();
    const intervalId = setInterval(refreshIfNeeded, 60_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshIfNeeded();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [refreshAccessToken, session.refreshToken]);

  const setAuth = useCallback(
    (
      accessToken: string,
      phone: string,
      profile: UserProfile,
      refreshToken?: string | null,
      expiresInSeconds?: number | null,
    ) => {
      const next: StoredSession = {
        accessToken,
        refreshToken: refreshToken ?? sessionRef.current.refreshToken,
        accessTokenExpiresAt: computeAccessTokenExpiresAt(expiresInSeconds),
        phone,
        profile,
        onboarding: syncOnboardingFromProfile(
          advanceOnboarding(sessionRef.current.onboarding, "auth"),
          profile,
        ),
      };
      sessionRef.current = next;
      setSession(next);
      void persistSession(next);
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = sessionRef.current.refreshToken;
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        /* ignore */
      }
    }
    await clearStoredSession();
    sessionRef.current = EMPTY_SESSION;
    setSession(EMPTY_SESSION);
  }, [api]);

  const refreshProfile = useCallback(async () => {
    const me = await api.me();
    const next: StoredSession = {
      ...sessionRef.current,
      profile: me.profile,
      onboarding: syncOnboardingFromProfile(sessionRef.current.onboarding, me.profile),
    };
    sessionRef.current = next;
    setSession(next);
    await persistSession(next);
  }, [api]);

  const ensureSession = useCallback(async (): Promise<boolean> => {
    const current = sessionRef.current;
    if (isAuthenticatedSession(current)) {
      if (!current.profile) {
        try {
          await refreshProfile();
        } catch (err) {
          return isTransientRefreshError(err);
        }
      }
      return true;
    }
    if (current.refreshToken) {
      return withRefreshLock(refreshAccessToken);
    }
    return false;
  }, [refreshAccessToken, refreshProfile]);

  const getAccessTokenForMedia = useCallback(async (): Promise<string | null> => {
    const ok = await ensureSession();
    return ok ? sessionRef.current.accessToken : null;
  }, [ensureSession]);

  const completeOnboardingStep = useCallback((step: OnboardingState["step"]) => {
    const next: StoredSession = {
      ...sessionRef.current,
      onboarding: advanceOnboarding(sessionRef.current.onboarding, step),
    };
    sessionRef.current = next;
    setSession(next);
    void persistSession(next);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...session,
      api,
      uploads,
      sessionReady,
      completeOnboardingStep,
      setAuth,
      logout,
      refreshProfile,
      getAccessTokenForMedia,
      ensureSession,
    }),
    [
      session,
      api,
      uploads,
      sessionReady,
      completeOnboardingStep,
      setAuth,
      logout,
      refreshProfile,
      getAccessTokenForMedia,
      ensureSession,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
