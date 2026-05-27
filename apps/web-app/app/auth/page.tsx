import { Suspense } from "react";
import Link from "next/link";
import AuthClient from "@/components/auth/AuthClient";

export default function AuthPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <Suspense fallback={null}>
        <AuthClient />
      </Suspense>
      <Link href="/welcome" className="font-bold text-[#ff1fa2]">← Назад</Link>
    </div>
  );
}
