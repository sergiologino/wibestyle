import { Suspense } from "react";
import WelcomeClient from "@/components/onboarding/WelcomeClient";

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeClient />
    </Suspense>
  );
}
