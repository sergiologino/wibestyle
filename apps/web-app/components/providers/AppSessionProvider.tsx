"use client";



import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { OnboardingState } from "@/lib/onboarding-flow";

import { INITIAL_ONBOARDING, advanceOnboarding } from "@/lib/onboarding-flow";

import { syncOnboardingFromProfile } from "@/lib/session-onboarding";

import { fetchAuthenticatedBlobUrl } from "@/lib/api-media";

import { resolveApiPath } from "@/lib/api-media";

import {
  computeAccessTokenExpiresAt,
  hasPersistedCredentials,
  isAccessTokenUsable,
  isAuthenticatedSession,
  isRefreshTokenRejected,
  isTransientRefreshError,
  needsAccessTokenRefresh,
  readStoredSessionRaw,
  SESSION_STORAGE_KEY,
  shouldRefreshAccessToken,
  withRefreshLock,
} from "@/lib/session-auth";

import type { UserProfile } from "@wibestyle/shared-types";

import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";



const STORAGE_KEY = SESSION_STORAGE_KEY;



type AppSession = {

  accessToken: string | null;

  refreshToken: string | null;

  accessTokenExpiresAt: number | null;

  phone: string | null;

  profile: UserProfile | null;

  onboarding: OnboardingState;

};



type AppSessionContextValue = AppSession & {

  api: WibeStyleApiClient;

  sessionReady: boolean;

  completeOnboardingStep: (step: OnboardingState["step"]) => void;

  setAuth: (
    accessToken: string,
    phone: string,
    profile: UserProfile,
    refreshToken?: string | null,
    expiresInSeconds?: number | null,
  ) => void;

  logout: () => void;

  refreshProfile: () => Promise<void>;

  /** Refetch avatar/media after access token refresh (401). */

  getAccessTokenForMedia: () => Promise<string | null>;

  /** Restore session from storage and refresh access token if needed. */
  ensureSession: () => Promise<boolean>;

};



const defaultSession: AppSession = {

  accessToken: null,

  refreshToken: null,

  accessTokenExpiresAt: null,

  phone: null,

  profile: null,

  onboarding: INITIAL_ONBOARDING,

};



const AppSessionContext = createContext<AppSessionContextValue | null>(null);



function readStoredSession(): AppSession {

  if (typeof window === "undefined") return defaultSession;

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return defaultSession;

    const parsed = { ...defaultSession, ...JSON.parse(raw) } as AppSession;

    return {

      ...parsed,

      onboarding: syncOnboardingFromProfile(parsed.onboarding, parsed.profile),

    };

  } catch {

    return defaultSession;

  }

}



function persistSession(session: AppSession) {

  if (typeof window === "undefined") return;

  if (!session.accessToken && !session.refreshToken && !session.profile) {

    localStorage.removeItem(STORAGE_KEY);

    return;

  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

}



function isAuthFailure(err: unknown): boolean {

  return err instanceof ApiError && err.status === 401;

}



function mergeSessionWithStorage(session: AppSession): AppSession {
  const latest = readStoredSessionRaw();
  if (!latest) {
    return session;
  }
  return {
    ...session,
    accessToken: latest.accessToken ?? session.accessToken,
    refreshToken: latest.refreshToken ?? session.refreshToken,
    accessTokenExpiresAt: latest.accessTokenExpiresAt ?? session.accessTokenExpiresAt,
    phone: session.phone ?? latest.phone ?? null,
    profile: session.profile ?? (latest.profile as UserProfile | null),
  };
}

function withSyncedOnboarding(session: AppSession): AppSession {
  return {
    ...session,
    onboarding: syncOnboardingFromProfile(session.onboarding, session.profile),
  };
}



export function AppSessionProvider({ children }: { children: React.ReactNode }) {

  const [session, setSession] = useState<AppSession>(defaultSession);

  const [sessionReady, setSessionReady] = useState(false);

  const sessionRef = useRef(session);

  sessionRef.current = session;



  const logoutEpochRef = useRef(0);

  const refreshInFlightRef = useRef<Promise<boolean> | null>(null);



  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";



  const applySession = useCallback((next: AppSession) => {

    const synced = withSyncedOnboarding(next);

    sessionRef.current = synced;

    setSession(synced);

    persistSession(synced);

    return synced;

  }, []);



  const refreshAccessToken = useCallback(async (): Promise<boolean> => {

    if (refreshInFlightRef.current) {

      return refreshInFlightRef.current;

    }



    const run = async (): Promise<boolean> => withRefreshLock(async () => {

      const epochAtStart = logoutEpochRef.current;

      let stored = withSyncedOnboarding(mergeSessionWithStorage(sessionRef.current));

      if (!stored.refreshToken) {

        return false;

      }

      if (
        stored.accessToken
        && isAccessTokenUsable(stored.accessToken, stored.accessTokenExpiresAt)
        && !shouldRefreshAccessToken(stored.accessToken, stored.accessTokenExpiresAt)
      ) {

        applySession(stored);

        return true;

      }



      const refreshClient = new WibeStyleApiClient({ baseUrl });

      try {

        const refreshed = await refreshClient.refreshToken(stored.refreshToken);

        if (logoutEpochRef.current !== epochAtStart) {

          return false;

        }

        applySession({

          ...stored,

          accessToken: refreshed.accessToken,

          refreshToken: refreshed.refreshToken ?? stored.refreshToken,

          accessTokenExpiresAt: computeAccessTokenExpiresAt(refreshed.expiresIn),

        });

        return true;

      } catch (err) {

        const latest = readStoredSessionRaw();

        if (
          latest?.refreshToken
          && latest.refreshToken !== stored.refreshToken
          && latest.accessToken
        ) {
          applySession({
            ...stored,
            accessToken: latest.accessToken,
            refreshToken: latest.refreshToken,
            accessTokenExpiresAt: latest.accessTokenExpiresAt ?? stored.accessTokenExpiresAt,
            phone: stored.phone,
            profile: stored.profile,
          });
          return true;
        }

        if (isRefreshTokenRejected(err)) {
          if (isAccessTokenUsable(stored.accessToken, stored.accessTokenExpiresAt)) {
            applySession(stored);
            return true;
          }
          return false;
        }

        if (isAccessTokenUsable(stored.accessToken, stored.accessTokenExpiresAt)) {
          applySession(stored);
          return true;
        }

        return false;

      }

    });



    refreshInFlightRef.current = run().finally(() => {

      refreshInFlightRef.current = null;

    });

    return refreshInFlightRef.current;

  }, [applySession, baseUrl]);



  useEffect(() => {

    let cancelled = false;



    async function tryRefresh(stored: AppSession): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: number } | "rejected"> {

      if (!stored.refreshToken) return "rejected";

      return withRefreshLock(async () => {

        const synced = withSyncedOnboarding(mergeSessionWithStorage(stored));

        if (
          synced.accessToken
          && isAccessTokenUsable(synced.accessToken, synced.accessTokenExpiresAt)
          && !shouldRefreshAccessToken(synced.accessToken, synced.accessTokenExpiresAt)
        ) {
          return {
            accessToken: synced.accessToken,
            refreshToken: synced.refreshToken,
            expiresAt: synced.accessTokenExpiresAt ?? computeAccessTokenExpiresAt(null),
          };
        }

        const refreshClient = new WibeStyleApiClient({ baseUrl });

        try {

          const refreshed = await refreshClient.refreshToken(synced.refreshToken!);

          return {

            accessToken: refreshed.accessToken,

            refreshToken: refreshed.refreshToken ?? synced.refreshToken,

            expiresAt: computeAccessTokenExpiresAt(refreshed.expiresIn),

          };

        } catch (err) {

          const latest = readStoredSessionRaw();

          if (
            latest?.refreshToken
            && latest.refreshToken !== synced.refreshToken
            && latest.accessToken
          ) {
            return {
              accessToken: latest.accessToken,
              refreshToken: latest.refreshToken,
              expiresAt: latest.accessTokenExpiresAt ?? computeAccessTokenExpiresAt(null),
            };
          }

          if (isRefreshTokenRejected(err)) {
            return "rejected";
          }

          if (isTransientRefreshError(err)) {
            throw err;
          }

          throw err;

        }

      });

    }



    async function applyMe(

      storedSession: AppSession,

      accessToken: string,

      refreshToken: string | null,

      accessTokenExpiresAt: number | null,

      epochAtStart: number,

    ) {

      const meClient = new WibeStyleApiClient({

        baseUrl,

        getAccessToken: () => accessToken,

      });

      const me = await meClient.me();

      if (cancelled || logoutEpochRef.current !== epochAtStart) {

        return;

      }



      applySession({

        ...storedSession,

        accessToken,

        refreshToken,

        accessTokenExpiresAt,

        profile: me.profile,

        phone: me.user.phone ?? me.user.login ?? me.user.email ?? storedSession.phone,

      });

    }



    async function bootstrap() {

      const epochAtStart = logoutEpochRef.current;

      const stored = withSyncedOnboarding(readStoredSession());

      if (cancelled) return;



      if (!stored.accessToken && !stored.refreshToken) {

        setSession(stored);

        setSessionReady(true);

        return;

      }



      setSession(stored);

      sessionRef.current = stored;



      let accessToken = stored.accessToken;

      let refreshToken = stored.refreshToken;

      let accessTokenExpiresAt = stored.accessTokenExpiresAt;



      const needsRefresh = needsAccessTokenRefresh(stored);



      if (needsRefresh) {

        try {

          const refreshed = await tryRefresh(stored);

          if (cancelled || logoutEpochRef.current !== epochAtStart) return;

          if (refreshed === "rejected") {

            if (!isAccessTokenUsable(stored.accessToken, stored.accessTokenExpiresAt)) {

              if (!cancelled && logoutEpochRef.current === epochAtStart) {

                applySession(defaultSession);

              }

              if (!cancelled) setSessionReady(true);

              return;

            }

          } else {

            accessToken = refreshed.accessToken;

            refreshToken = refreshed.refreshToken;

            accessTokenExpiresAt = refreshed.expiresAt;

          }

        } catch {

          if (!cancelled) {
            applySession(stored);
            setSessionReady(true);
          }

          return;

        }

      }



      if (accessToken) {

        try {

          await applyMe(stored, accessToken, refreshToken, accessTokenExpiresAt, epochAtStart);

          if (!cancelled) setSessionReady(true);

          return;

        } catch (err) {

          if (!isAuthFailure(err) || !refreshToken) {

            if (!isAuthFailure(err)) {

              if (!cancelled) setSessionReady(true);

              return;

            }

            if (!cancelled && logoutEpochRef.current === epochAtStart) {

              applySession(defaultSession);

            }

            if (!cancelled) setSessionReady(true);

            return;

          }

        }

      }



      try {

        const refreshed = await tryRefresh(stored);

        if (cancelled || logoutEpochRef.current !== epochAtStart) return;

        if (refreshed !== "rejected") {

          try {

            await applyMe(
              stored,
              refreshed.accessToken,
              refreshed.refreshToken,
              refreshed.expiresAt,
              epochAtStart,
            );

            if (!cancelled) setSessionReady(true);

            return;

          } catch (err) {

            if (!isAuthFailure(err)) {

              if (!cancelled) setSessionReady(true);

              return;

            }

          }

        }

      } catch {

        if (!cancelled) {
          applySession(stored);
          setSessionReady(true);
        }

        return;

      }



      if (!cancelled && logoutEpochRef.current === epochAtStart && stored.refreshToken) {

        applySession(stored);

        setSessionReady(true);

        return;

      }

      if (!cancelled && logoutEpochRef.current === epochAtStart) {

        applySession(defaultSession);

        setSessionReady(true);

      }

    }



    void bootstrap();

    return () => {

      cancelled = true;

    };

  }, [applySession, baseUrl]);



  useEffect(() => {

    if (!session.refreshToken) {

      return;

    }



    function scheduleRefresh() {

      const current = withSyncedOnboarding(mergeSessionWithStorage(sessionRef.current));

      if (!current.refreshToken) {

        return;

      }

      if (needsAccessTokenRefresh(current)) {

        void refreshAccessToken();

      }

    }



    scheduleRefresh();

    const intervalId = window.setInterval(scheduleRefresh, 60_000);

    function onVisible() {

      if (document.visibilityState === "visible") {

        scheduleRefresh();

      }

    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {

      window.clearInterval(intervalId);

      document.removeEventListener("visibilitychange", onVisible);

    };

  }, [refreshAccessToken, session.refreshToken]);



  useEffect(() => {

    if (!sessionReady) return;

    if (isAuthenticatedSession(sessionRef.current)) return;

    if (!hasPersistedCredentials()) return;

    const stored = withSyncedOnboarding(readStoredSession());

    if (!isAuthenticatedSession(stored)) return;

    applySession(stored);

    void refreshAccessToken();

  }, [applySession, refreshAccessToken, session.accessToken, session.profile, session.refreshToken, sessionReady]);



  useEffect(() => {

    function onStorage(event: StorageEvent) {

      if (event.key !== STORAGE_KEY || !event.newValue) return;

      try {

        const parsed = withSyncedOnboarding({ ...defaultSession, ...JSON.parse(event.newValue) } as AppSession);

        if (parsed.accessToken || parsed.refreshToken) {

          sessionRef.current = parsed;

          setSession(parsed);

        } else if (!parsed.accessToken && !parsed.refreshToken) {

          sessionRef.current = defaultSession;

          setSession(defaultSession);

        }

      } catch {

        // ignore corrupt storage payloads

      }

    }

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);

  }, []);



  const api = useMemo(

    () =>

      new WibeStyleApiClient({

        baseUrl,

        getAccessToken: () => sessionRef.current.accessToken,

        onUnauthorized: refreshAccessToken,

      }),

    [baseUrl, refreshAccessToken],

  );



  const getAccessTokenForMedia = useCallback(async (): Promise<string | null> => {

    const current = mergeSessionWithStorage(sessionRef.current);

    if (isAccessTokenUsable(current.accessToken, current.accessTokenExpiresAt)) {

      return current.accessToken;

    }

    const ok = await refreshAccessToken();

    const next = sessionRef.current.accessToken;

    return ok && next ? next : null;

  }, [refreshAccessToken]);



  const ensureSession = useCallback(async (): Promise<boolean> => {

    let current = withSyncedOnboarding(mergeSessionWithStorage(sessionRef.current));

    if (!isAuthenticatedSession(current)) {

      const stored = withSyncedOnboarding(readStoredSession());

      if (isAuthenticatedSession(stored)) {

        current = applySession(stored);

      }

    }

    if (!isAuthenticatedSession(current)) {

      return false;

    }

    if (isAccessTokenUsable(current.accessToken, current.accessTokenExpiresAt)) {

      return true;

    }

    if (!current.refreshToken) {

      return false;

    }

    return refreshAccessToken();

  }, [applySession, refreshAccessToken]);



  const completeOnboardingStep = useCallback((step: OnboardingState["step"]) => {

    setSession((prev) => {

      const next = withSyncedOnboarding({

        ...prev,

        onboarding: advanceOnboarding(prev.onboarding, step),

      });

      persistSession(next);

      sessionRef.current = next;

      return next;

    });

  }, []);



  const setAuth = useCallback(

    (
      accessToken: string,
      phone: string,
      profile: UserProfile,
      refreshToken?: string | null,
      expiresInSeconds?: number | null,
    ) => {

      applySession({

        ...sessionRef.current,

        accessToken,

        refreshToken: refreshToken ?? sessionRef.current.refreshToken,

        accessTokenExpiresAt: computeAccessTokenExpiresAt(expiresInSeconds),

        phone,

        profile,

        onboarding: syncOnboardingFromProfile(

          {

            ...advanceOnboarding(sessionRef.current.onboarding, "auth"),

            welcomeSeen: true,

          },

          profile,

        ),

      });

      setSessionReady(true);

    },

    [applySession],

  );



  const logout = useCallback(() => {

    logoutEpochRef.current += 1;

    const refreshToken = sessionRef.current.refreshToken;

    if (refreshToken) {

      const client = new WibeStyleApiClient({ baseUrl });

      void client.logout(refreshToken).catch(() => undefined);

    }

    sessionRef.current = defaultSession;

    setSession(defaultSession);

    persistSession(defaultSession);

    setSessionReady(true);

  }, [baseUrl]);



  const refreshProfile = useCallback(async () => {

    const me = await api.me();

    applySession({

      ...sessionRef.current,

      profile: me.profile,

      phone: me.user.phone ?? sessionRef.current.phone,

    });

  }, [api, applySession]);



  const value = useMemo(

    () => ({

      ...session,

      api,

      sessionReady,

      completeOnboardingStep,

      setAuth,

      logout,

      refreshProfile,

      getAccessTokenForMedia,

      ensureSession,

    }),

    [session, api, sessionReady, completeOnboardingStep, setAuth, logout, refreshProfile, getAccessTokenForMedia, ensureSession],

  );



  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;

}



export function useAppSession() {

  const ctx = useContext(AppSessionContext);

  if (!ctx) {

    throw new Error("useAppSession must be used within AppSessionProvider");

  }

  return ctx;

}



/** Hook for protected avatar images with automatic token refresh. */

export function useAuthenticatedBlob(path: string | null | undefined) {

  const { accessToken, getAccessTokenForMedia } = useAppSession();

  const [blobUrl, setBlobUrl] = useState<string | null>(null);



  useEffect(() => {

    if (!path) {

      setBlobUrl(null);

      return;

    }

    const fullUrl = resolveApiPath(path);

    if (!fullUrl) {

      setBlobUrl(null);

      return;

    }

    const mediaUrl = fullUrl;

    let revoked: string | null = null;
    let cancelled = false;



    async function load() {

      const token = accessToken ?? (await getAccessTokenForMedia());

      if (!token) {

        setBlobUrl(null);

        return;

      }

      const url = await fetchAuthenticatedBlobUrl(mediaUrl, token, {

        onUnauthorized: async () => {

          const next = await getAccessTokenForMedia();

          return next;

        },

      });

      if (cancelled) {

        if (url) URL.revokeObjectURL(url);

        return;

      }

      if (revoked) URL.revokeObjectURL(revoked);

      revoked = url;

      setBlobUrl(url);

    }



    void load();

    return () => {

      cancelled = true;

      if (revoked) URL.revokeObjectURL(revoked);

    };

  }, [accessToken, getAccessTokenForMedia, path]);



  return blobUrl;

}


