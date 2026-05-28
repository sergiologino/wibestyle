"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Pill } from "@wibestyle/ui";
import type { TryOnHistoryItem } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import TryOnHistoryGrid from "@/components/home/TryOnHistoryGrid";

export default function HomeDashboardClient() {
  const { api, profile, phone } = useAppSession();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
      <section className="rounded-[32px] border border-[#ffd1ed] bg-white p-8 shadow-[0_20px_60px_rgba(58,12,82,0.12)]">
        <Pill>Привет{phone ? `, ${phone}` : ""}</Pill>
        <h1 className="mt-4 text-4xl font-black tracking-tight">Готова примерить новый look?</h1>
        <p className="mt-3 font-bold text-[#6d6273]">
          {profile?.plan === "trial"
            ? `Осталось бесплатных примерок: ${profile.trialGenerationsLeft}`
            : "Подписка активна — примеряй без ограничений trial."}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/try-on/link"><Button size="lg">Примерить по ссылке</Button></Link>
          <Link href="/try-on/photo"><Button size="lg" variant="secondary">Примерить по фото</Button></Link>
          <Link href="/gallery"><Button size="lg" variant="ghost">Галерея сообщества</Button></Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Pill tone="soft">Твои примерки</Pill>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Все образы, которые ты примеряла</h2>
            <p className="mt-2 font-bold text-[#6d6273]">
              Даже если не публиковала в общей галерее — здесь всё сохраняется только для тебя.
            </p>
          </div>
        </div>
        <TryOnHistoryGrid items={history} loading={historyLoading} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black">Поиск товаров</h2>
          <p className="mt-2 font-bold text-[#6d6273]">Скоро: «найди модный пиджак на лето 2026» и сразу примерить.</p>
          <Link href="/search" className="mt-4 inline-block font-bold text-[#ff1fa2]">Открыть поиск →</Link>
        </Card>
        <Card>
          <h2 className="text-2xl font-black">Избранное</h2>
          <p className="mt-2 font-bold text-[#6d6273]">Сердечко на карточке сохранит вещь в корзинку для быстрой примерки.</p>
          <Link href="/favorites" className="mt-4 inline-block font-bold text-[#ff1fa2]">Открыть избранное →</Link>
        </Card>
      </div>
    </div>
  );
}
