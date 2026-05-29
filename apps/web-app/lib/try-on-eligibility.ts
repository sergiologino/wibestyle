import type { UserProfile } from "@wibestyle/shared-types";
import { isAuthenticatedSession } from "@/lib/session-auth";
import { buildAuthRedirectPath } from "@/lib/auth-redirect";

export type TryOnSetupIssue = "auth" | "gender" | "anthropometry" | "avatar";

export function hasRequiredAnthropometry(profile: UserProfile): boolean {
  const a = profile.anthropometry;
  return Boolean(a?.heightCm && a?.bustCm && a?.waistCm && a?.hipsCm);
}

export function isProfileReadyForTryOn(profile: UserProfile | null | undefined): boolean {
  if (!profile?.userId) return false;
  if (!profile.gender) return false;
  if (!hasRequiredAnthropometry(profile)) return false;
  if (!profile.activeAvatarId) return false;
  return true;
}

export function resolveTryOnSetupIssue(
  session: {
    accessToken?: string | null;
    refreshToken?: string | null;
    profile?: UserProfile | null;
    accessTokenExpiresAt?: number | null;
  },
): TryOnSetupIssue | null {
  if (!isAuthenticatedSession(session)) {
    return "auth";
  }
  const profile = session.profile;
  if (!profile?.userId) {
    return "auth";
  }
  if (!profile.gender) {
    return "gender";
  }
  if (!hasRequiredAnthropometry(profile)) {
    return "anthropometry";
  }
  if (!profile.activeAvatarId) {
    return "avatar";
  }
  return null;
}

export function tryOnSetupRedirect(
  issue: TryOnSetupIssue,
  returnPath = "/try-on",
): string {
  switch (issue) {
    case "auth":
      return buildAuthRedirectPath(returnPath);
    case "gender":
    case "anthropometry":
      return `/settings?setup=try-on&return=${encodeURIComponent(returnPath)}`;
    case "avatar":
      return `/onboarding/avatar?return=${encodeURIComponent(returnPath)}`;
  }
}

export function tryOnSetupMessage(issue: TryOnSetupIssue): string {
  switch (issue) {
    case "auth":
      return "Войди в аккаунт, чтобы запустить примерку.";
    case "gender":
      return "Укажи пол в профиле — без этого примерка недоступна.";
    case "anthropometry":
      return "Заполни рост и основные мерки (грудь, талия, бёдра) в профиле.";
    case "avatar":
      return "Загрузи и активируй фото аватара в полный рост.";
  }
}
