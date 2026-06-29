"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ReferralOverview } from "@wibestyle/shared-types";
import { Button, Card } from "@wibestyle/ui";
import { useAppSession } from "@/components/providers/AppSessionProvider";

export default function ReferralClient() {
  const { api } = useAppSession();
  const [data, setData] = useState<ReferralOverview | null>(null);
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => data
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/welcome?ref=${encodeURIComponent(data.referralCode)}`
    : "", [data]);

  useEffect(() => {
    void api.getReferrals().then(setData);
  }, [api]);

  async function share() {
    if (!data?.eligible) return;
    if (navigator.share) {
      await navigator.share({ title: "Я на стиле", text: "Попробуй виртуальную примерочную", url: link });
    } else {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10">
      <Link href="/settings" className="text-sm font-medium text-[var(--pink)]">← Профиль</Link>
      <Card>
        <p className="text-eyebrow">Приглашай друзей</p>
        <h1 className="mt-3 text-4xl">Больше образов вместе</h1>
        <p className="mt-3 text-[var(--muted)]">
          Друг оформляет месячную подписку — тебе 3 примерки. Выбирает год — получаешь 15.
        </p>
        <p className="mt-4 font-medium">Бонусных примерок доступно: {data?.bonusGenerationsLeft ?? "…"}</p>
        {!data?.eligible ? (
          <p className="mt-3 rounded-2xl bg-[var(--pink-bg)] p-3 text-sm text-[var(--muted)]">
            Реферальные бонусы доступны при активной подписке Wibe или Elite.
          </p>
        ) : null}
        <div className="mt-5 rounded-2xl border border-[var(--pink-soft)] bg-white p-3 text-sm break-all">{link || "Загружаем ссылку…"}</div>
        <Button className="mt-4" disabled={!data?.eligible} onClick={() => void share()}>
          {copied ? "Ссылка скопирована" : "Поделиться ссылкой"}
        </Button>
      </Card>
      <Card>
        <h2 className="text-2xl">История начислений</h2>
        <div className="mt-4 grid gap-3">
          {data?.rewards.length ? data.rewards.map((reward) => (
            <div key={reward.id} className="rounded-2xl border border-[var(--pink-soft)] p-4">
              <p className="font-medium">{reward.friend}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                +{reward.generations} примерок · {reward.billingPeriod === "annual" ? "годовой тариф" : "месячный тариф"}
              </p>
              <p className="mt-1 text-xs text-[var(--eyebrow)]">{new Date(reward.rewardedAt).toLocaleString("ru-RU")}</p>
            </div>
          )) : <p className="text-sm text-[var(--muted)]">Начислений пока нет.</p>}
        </div>
      </Card>
    </div>
  );
}
