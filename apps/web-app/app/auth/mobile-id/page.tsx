import { Suspense } from "react";
import MobileIdBridge from "@/components/auth/MobileIdBridge";

export default function MobileIdPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <Suspense fallback={<p>Подключаем вход по телефону…</p>}>
        <MobileIdBridge />
      </Suspense>
    </main>
  );
}
