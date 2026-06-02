import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { Screen } from "@/components/ui/Screen";

export default function SettingsScreen() {
  return (
    <Screen>
      <ProfileEditor showBackButton showQuickLinks={false} />
    </Screen>
  );
}
