"use client";

import { Suspense, useState } from "react";
import OtpForm from "@/components/auth/OtpForm";
import EmailOtpForm from "@/components/auth/EmailOtpForm";
import OAuthButtons from "@/components/auth/OAuthButtons";

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
    </div>
  );
}
