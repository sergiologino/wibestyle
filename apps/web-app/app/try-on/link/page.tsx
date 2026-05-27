import { Suspense } from "react";
import LinkTryOnClient from "@/components/try-on/LinkTryOnClient";

export default function TryOnLinkPage() {
  return (
    <Suspense fallback={null}>
      <LinkTryOnClient />
    </Suspense>
  );
}
