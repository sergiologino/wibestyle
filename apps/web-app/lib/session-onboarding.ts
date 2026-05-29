import type { OnboardingState } from "@/lib/onboarding-flow";
import type { UserProfile } from "@wibestyle/shared-types";

/** Keep local onboarding flags aligned with server profile and avatar state. */
export function syncOnboardingFromProfile(
  onboarding: OnboardingState,
  profile: UserProfile | null,
): OnboardingState {
  if (!profile?.userId) {
    return onboarding;
  }
  if (!profile.activeAvatarId) {
    return {
      ...onboarding,
      welcomeSeen: true,
      authComplete: true,
      step: "avatar",
    };
  }
  return {
    ...onboarding,
    welcomeSeen: true,
    authComplete: true,
    avatarComplete: true,
    step: "complete",
  };
}
