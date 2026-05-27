import { Suspense } from "react";
import PaywallClient from "@/components/billing/PaywallClient";

export default function PaywallPage() {
  return (
    <Suspense fallback={null}>
      <PaywallClient />
    </Suspense>
  );
}
