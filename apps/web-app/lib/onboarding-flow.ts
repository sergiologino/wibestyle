import type { OnboardingStep, PaywallTrigger, UserProfile } from "@wibestyle/shared-types";

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

export function getNextOnboardingRoute(state: OnboardingState): string {
  if (!state.authComplete) {
    if (!state.welcomeSeen) return "/welcome";
    return "/auth";
  }
  if (!state.avatarComplete) return "/onboarding/avatar";
  return "/home";
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

/** Куда отправить после OTP: новые пользователи всегда на onboarding, даже с ?next= */
export function resolvePostAuthRoute(options: {
  newUser: boolean;
  hasActiveAvatar: boolean;
  nextParam: string | null;
}): string {
  const needsOnboarding = options.newUser || !options.hasActiveAvatar;
  if (needsOnboarding) {
    return "/onboarding/avatar";
  }
  const next = options.nextParam;
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/home";
}

export function shouldShowPaywall(profile: UserProfile, trigger: PaywallTrigger): boolean {
  if (profile.plan === "wibe" || profile.plan === "elite") {
    return trigger === "elite_perk" && profile.plan !== "elite";
  }
  if (trigger === "trial_exhausted") {
    return profile.trialGenerationsLeft <= 0;
  }
  if (trigger === "multi_item") {
    return true;
  }
  return false;
}

export function canStartGeneration(profile: UserProfile): boolean {
  if (profile.plan === "wibe" || profile.plan === "elite") return true;
  return profile.trialGenerationsLeft > 0;
}
