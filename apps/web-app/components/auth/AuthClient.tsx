"use client";

import { Suspense, useState } from "react";
import OtpForm from "@/components/auth/OtpForm";
import PasswordAuthForm from "@/components/auth/PasswordAuthForm";
import OAuthButtons from "@/components/auth/OAuthButtons";

type AuthTab = "phone" | "password";

export default function AuthClient() {
  const [tab, setTab] = useState<AuthTab>("phone");

  return (
    <div className="grid gap-6">
      <div className="inline-flex rounded-full border border-[#ffd1ed] bg-white p-1">
        <button
          type="button"
          className={`rounded-full px-5 py-2 text-sm font-black ${tab === "phone" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
          onClick={() => setTab("phone")}
        >
          Телефон
        </button>
        <button
          type="button"
          className={`rounded-full px-5 py-2 text-sm font-black ${tab === "password" ? "bg-[#ff1fa2] text-white" : "text-[#6d6273]"}`}
          onClick={() => setTab("password")}
        >
          Логин / пароль
        </button>
      </div>

      <Suspense fallback={null}>
        {tab === "phone" ? <OtpForm /> : <PasswordAuthForm />}
      </Suspense>
      <OAuthButtons />
    </div>
  );
}
