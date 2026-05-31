"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { clearCheckoutId, readCheckoutId } from "@/lib/billing-plan";

const POLL_MS = 2000;
const MAX_ATTEMPTS = 30;

export default function PaywallReturnClient() {
  const router = useRouter();
  const { api, refreshProfile } = useAppSession();
  const [message, setMessage] = useState("Проверяем оплату…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const checkoutId = readCheckoutId();
    if (!checkoutId) {
      router.replace("/paywall");
      return;
    }

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      attempts += 1;
      try {
        const result = await api.getCheckout(checkoutId!);
        if (result.status === "completed") {
          clearCheckoutId();
          await refreshProfile();
          router.replace(`/home?subscribed=${result.plan}`);
          return;
        }
        if (result.status === "canceled") {
          clearCheckoutId();
          router.replace("/paywall/cancel");
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          setFailed(true);
          setMessage("Оплата ещё обрабатывается. Обнови страницу через минуту или проверь профиль.");
          return;
        }
        setMessage("Ждём подтверждение от YooKassa…");
        timer = setTimeout(() => void poll(), POLL_MS);
      } catch (err) {
        setFailed(true);
        setMessage(err instanceof ApiError ? err.message : "Не удалось проверить оплату");
      }
    }

    void poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [api, refreshProfile, router]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <Card>
        <p className="text-eyebrow">Оплата</p>
        <h1 className="text-display mt-4 text-3xl">Почти готово</h1>
        <p className="text-body mt-3">{message}</p>
        {!failed ? (
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#ffe8f6]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#ff1fa2]" />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="md" onClick={() => window.location.reload()}>Обновить</Button>
            <Link href="/home"><Button size="md" variant="secondary">На главную</Button></Link>
          </div>
        )}
      </Card>
    </div>
  );
}
