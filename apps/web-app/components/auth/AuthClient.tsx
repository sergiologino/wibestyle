"use client";

import { Suspense, useCallback, useState } from "react";
import OtpForm from "@/components/auth/OtpForm";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { legalLinks } from "@/lib/legal-links";

export default function AuthClient() {
  const [oauthReady, setOauthReady] = useState(false);
  const markOauthReady = useCallback(() => setOauthReady(true), []);

  return (
    <div className="grid gap-6">
      {!oauthReady ? (
        <div className="grid gap-4" aria-live="polite" aria-label="Загружаем способы входа">
          <div className="h-14 animate-pulse rounded-2xl bg-[#f4eaf1]" />
          <div className="h-14 animate-pulse rounded-2xl bg-[#f4eaf1]" />
          <div className="mx-auto size-6 animate-spin rounded-full border-2 border-[#ffb7df] border-t-[#ff1fa2]" />
        </div>
      ) : <Suspense fallback={null}><OtpForm /></Suspense>}
      <OAuthButtons visible={oauthReady} onProvidersResolved={markOauthReady} />
      {oauthReady ? <p className="text-center text-xs font-normal leading-5 text-[#9a8f99]">
        Продолжая, вы принимаете{" "}
        <a className="font-medium text-[#ff1fa2]" href={legalLinks.terms} target="_blank" rel="noreferrer">
          пользовательское соглашение
        </a>{" "}
        и{" "}
        <a className="font-medium text-[#ff1fa2]" href={legalLinks.privacy} target="_blank" rel="noreferrer">
          политику конфиденциальности
        </a>
        .
      </p> : null}
    </div>
  );
}
