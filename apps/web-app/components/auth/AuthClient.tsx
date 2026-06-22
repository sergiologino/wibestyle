"use client";

import { Suspense, useState } from "react";
import OtpForm from "@/components/auth/OtpForm";
import EmailOtpForm from "@/components/auth/EmailOtpForm";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { legalLinks } from "@/lib/legal-links";

type AuthTab = "phone" | "email";

export default function AuthClient() {
  const [tab, setTab] = useState<AuthTab>("phone");

  return (
    <div className="grid gap-6">
      <div className="inline-flex rounded-full border border-[#ffd1ed] bg-white p-1">
        <button
          type="button"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "phone" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
          onClick={() => setTab("phone")}
        >
          Телефон
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "email" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
          onClick={() => setTab("email")}
        >
          Email
        </button>
      </div>

      <Suspense fallback={null}>
        {tab === "phone" ? <OtpForm /> : <EmailOtpForm />}
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
