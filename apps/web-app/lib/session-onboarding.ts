import type { OnboardingState } from "@/lib/onboarding-flow";
import type { UserProfile } from "@wibestyle/shared-types";

/** Keep local onboarding flags aligned with server active avatar. */
export function syncOnboardingFromProfile(
  onboarding: OnboardingState,
  profile: UserProfile | null,
): OnboardingState {
  if (!profile?.activeAvatarId) {
    return onboarding;
  }
  return {
    ...onboarding,
    welcomeSeen: true,
    authComplete: true,
    avatarComplete: true,
    step: "complete",
  };
}
