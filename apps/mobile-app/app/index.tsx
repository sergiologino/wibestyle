import { Redirect } from "expo-router";
import { useSession } from "@/context/SessionProvider";
import { getInitialRoute } from "@/lib/onboarding-flow";
import { Screen } from "@/components/ui/Screen";

export default function Index() {
  const { sessionReady, onboarding } = useSession();

  if (!sessionReady) {
    return <Screen loading />;
  }

  return <Redirect href={getInitialRoute(onboarding) as never} />;
}
