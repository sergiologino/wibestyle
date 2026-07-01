import type { OnboardingStep, UserProfile } from "@wibestyle/shared-types";

export type OnboardingState = {
  step: OnboardingStep;
  welcomeSeen: boolean;
  authComplete: boolean;
  avatarComplete: boolean;
};

export const INITIAL_ONBOARDING: OnboardingState = {
  step: "welcome",
  welcomeSeen: false,
  authComplete: false,
  avatarComplete: false,
};

export function syncOnboardingFromProfile(
  onboarding: OnboardingState,
  profile: UserProfile | null,
): OnboardingState {
  if (!profile) return onboarding;
  const avatarComplete = Boolean(profile.activeAvatarId);
  if (avatarComplete) {
    return {
      welcomeSeen: true,
      authComplete: true,
      avatarComplete: true,
      step: "complete",
    };
  }
  if (onboarding.authComplete) {
    return { ...onboarding, avatarComplete: false, step: "avatar" };
  }
  return onboarding;
}

export function getInitialRoute(onboarding: OnboardingState): string {
  if (!onboarding.welcomeSeen) return "/welcome";
  if (!onboarding.authComplete) return "/auth";
  if (!onboarding.avatarComplete) return "/onboarding/avatar";
  return "/(main)/home";
}

export function advanceOnboarding(state: OnboardingState, completed: OnboardingStep): OnboardingState {
  if (completed === "welcome") {
    return { ...state, welcomeSeen: true, step: "auth" };
  }
  if (completed === "auth") {
    return { ...state, welcomeSeen: true, authComplete: true, step: "avatar" };
  }
  if (completed === "avatar") {
    return { ...state, avatarComplete: true, step: "complete" };
  }
  return state;
}

export function resolvePostAuthRoute(options: {
  newUser: boolean;
  hasActiveAvatar: boolean;
  nextParam?: string | null;
}): string {
  if (options.nextParam && options.nextParam.startsWith("/") && !options.nextParam.startsWith("//")) {
    return options.nextParam;
  }
  if (options.newUser || !options.hasActiveAvatar) {
    return "/onboarding/avatar";
  }
  return "/(main)/home";
}

export function canStartGeneration(profile: UserProfile): boolean {
  if (profile.plan === "wibe" || profile.plan === "elite") return true;
  return profile.trialGenerationsLeft + (profile.bonusGenerationsLeft ?? 0) > 0;
}
