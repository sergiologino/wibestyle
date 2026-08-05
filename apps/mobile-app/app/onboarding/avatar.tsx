import { Redirect } from "expo-router";

/**
 * Avatar setup is intentionally shared with the Profile tab. Keeping a single
 * screen prevents the first-avatar flow from diverging from profile uploads.
 */
export default function AvatarOnboardingScreen() {
  return <Redirect href="/(main)/profile" />;
}
