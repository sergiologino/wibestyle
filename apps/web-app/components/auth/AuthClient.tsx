"use client";

import { Suspense } from "react";
import OtpForm from "@/components/auth/OtpForm";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { legalLinks } from "@/lib/legal-links";

export default function AuthClient() {
  return (
    <div className="grid gap-6">
      <Suspense fallback={null}>
        <OtpForm />
      </Suspense>
      <OAuthButtons />
      <p className="text-center text-xs font-normal leading-5 text-[#9a8f99]">
        Продолжая, вы принимаете{" "}
        <a className="font-medium text-[#ff1fa2]" href={legalLinks.terms} target="_blank" rel="noreferrer">
          пользовательское соглашение
        </a>{" "}
        и{" "}
        <a className="font-medium text-[#ff1fa2]" href={legalLinks.privacy} target="_blank" rel="noreferrer">
          политику конфиденциальности
        </a>
        .
      </p>
    </div>
  );
}
