import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "@wibestyle/shared-types";
import { SESSION_STORAGE_KEY } from "./config";
import {
  INITIAL_ONBOARDING,
  syncOnboardingFromProfile,
  type OnboardingState,
} from "./onboarding-logic";

export type StoredSession = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  phone: string | null;
  profile: UserProfile | null;
  onboarding: OnboardingState;
};

export const EMPTY_SESSION: StoredSession = {
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  phone: null,
  profile: null,
  onboarding: INITIAL_ONBOARDING,
};

export async function readStoredSession(): Promise<StoredSession> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return EMPTY_SESSION;
    const parsed = { ...EMPTY_SESSION, ...JSON.parse(raw) } as StoredSession;
    return {
      ...parsed,
      onboarding: syncOnboardingFromProfile(parsed.onboarding, parsed.profile),
    };
  } catch {
    return EMPTY_SESSION;
  }
}

export async function persistSession(session: StoredSession): Promise<void> {
  if (!session.accessToken && !session.refreshToken && !session.profile) {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}
