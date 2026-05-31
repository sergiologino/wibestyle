"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import type { TryOnHistoryItem } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import TryOnHistoryGrid from "@/components/home/TryOnHistoryGrid";
import SubscriptionNudgeBanner from "@/components/billing/SubscriptionNudgeBanner";
import { isPaidSubscription, subscriptionNudgeLevel } from "@/lib/billing-plan";

export default function HomeDashboardClient() {
  const searchParams = useSearchParams();
  const { api, profile, phone } = useAppSession();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    const subscribed = searchParams.get("subscribed");
    if (subscribed === "wibe" || subscribed === "elite") {
      setCelebration(subscribed);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    api.listMyTryOnSessions()
      .then((payload) => {
        if (active) setHistory(payload.items);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  const nudgeLevel = subscriptionNudgeLevel(profile);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
      {celebration ? (
        <section className="rounded-[28px] border border-[#782cff] bg-gradient-to-r from-[#faf7ff] to-[#fff0f9] p-6">
          <p className="text-eyebrow text-[#782cff]">Подписка активна</p>
          <h2 className="text-display-md mt-2 text-2xl">
            Добро пожаловать в {celebration === "elite" ? "Elite" : "Wibe"}!
          </h2>
          <p className="text-body mt-2">Примерки доступны — выбирай вещь и запускай AI-примерку.</p>
          <Button className="mt-4" size="sm" variant="ghost" onClick={() => setCelebration(null)}>Закрыть</Button>
        </section>
      ) : null}

      {!isPaidSubscription(profile) && profile ? (
        <SubscriptionNudgeBanner level={nudgeLevel} trialLeft={profile.trialGenerationsLeft} />
      ) : null}

      <section className="rounded-[28px] border border-[#ffd1ed] bg-white p-8 shadow-[0_16px_48px_rgba(58,12,82,0.06)]">
        <p className="text-eyebrow">Привет{phone ? `, ${phone}` : ""}</p>
        <h1 className="text-display mt-3 text-4xl">Готова примерить новый look?</h1>
        <p className="text-body mt-3">
          {profile?.plan === "trial"
            ? `Осталось бесплатных примерок: ${profile.trialGenerationsLeft}`
            : profile?.planGenerationsLeft != null
              ? `Генераций в подписке: ${profile.planGenerationsLeft}`
              : "Подписка активна — примеряй без ограничений trial."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/try-on/link"><Button size="md">Примерить по ссылке</Button></Link>
          <Link href="/try-on/photo"><Button size="md" variant="secondary">Примерить по фото</Button></Link>
          <Link href="/gallery"><Button size="md" variant="ghost">Галерея сообщества</Button></Link>
          {!isPaidSubscription(profile) ? (
            <Link href="/paywall"><Button size="md" variant="ghost">Тарифы</Button></Link>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-display-md text-3xl">Твои примерки</h2>
          <p className="text-body mt-2">
            Все образы, которые ты примеряла — даже если не публиковала в общей галерее.
          </p>
        </div>
        <TryOnHistoryGrid items={history} loading={historyLoading} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-display-md text-2xl">Поиск товаров</h2>
          <p className="text-body mt-2">Скоро: «найди модный пиджак на лето 2026» и сразу примерить.</p>
          <Link href="/search" className="text-link mt-4 inline-block text-sm">Открыть поиск →</Link>
        </Card>
        <Card>
          <h2 className="text-display-md text-2xl">Избранное</h2>
          <p className="text-body mt-2">Сердечко на карточке сохранит вещь для быстрой примерки.</p>
          <Link href="/favorites" className="text-link mt-4 inline-block text-sm">Открыть избранное →</Link>
        </Card>
      </div>
    </div>
  );
}
