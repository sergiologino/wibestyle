import { Suspense } from "react";
import LinkTryOnClient from "@/components/try-on/LinkTryOnClient";
import TryOnGateClient from "@/components/try-on/TryOnGateClient";

export default function TryOnLinkPage() {
  return (
    <TryOnGateClient>
      <Suspense fallback={null}>
        <LinkTryOnClient />
      </Suspense>
    </TryOnGateClient>
  );
}
