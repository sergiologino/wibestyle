import { Suspense } from "react";
import ResultClient from "@/components/try-on/ResultClient";

type Props = { params: Promise<{ sessionId: string }> };

export default async function TryOnResultPage({ params }: Props) {
  const { sessionId } = await params;
  return (
    <Suspense fallback={null}>
      <ResultClient sessionId={sessionId} />
    </Suspense>
  );
}
