"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import type { PublishedReview, TryOnHistoryItem } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import TryOnHistoryGrid from "@/components/home/TryOnHistoryGrid";
import SubscriptionNudgeBanner from "@/components/billing/SubscriptionNudgeBanner";
import { isPaidSubscription, subscriptionNudgeLevel } from "@/lib/billing-plan";
import { readFeedCache, writeFeedCache } from "@/lib/feed-cache";
import { ImageIcon, Link2, Scissors, WandSparkles } from "lucide-react";

const INITIAL_HISTORY_LIMIT = 6;
const HISTORY_PAGE_SIZE = 12;
type HistoryFilter = "all" | "clothing" | "hairstyle" | "stylist";
const HISTORY_FILTERS: Array<{ id: HistoryFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "clothing", label: "Одежда" },
  { id: "hairstyle", label: "Прически" },
  { id: "stylist", label: "Идеи стилиста" },
];
const homeHistoryCacheKey = (userId: string, filter: HistoryFilter) => `wibestyle:web:home-history:${userId}:${filter}:v1`;

export default function HomeDashboardClient() {
  const searchParams = useSearchParams();
  const { api, profile } = useAppSession();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [celebration, setCelebration] = useState<string | null>(null);
  const [reviews, setReviews] = useState<PublishedReview[]>([]);

  useEffect(() => {
    const subscribed = searchParams.get("subscribed");
    if (subscribed === "wibe" || subscribed === "elite") {
      setCelebration(subscribed);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const userId = profile?.userId;
    if (userId) {
      const cached = readFeedCache<{
        items: TryOnHistoryItem[];
        nextCursor?: string | null;
        hasMore: boolean;
      }>(homeHistoryCacheKey(userId, historyFilter));
      if (cached) {
        setHistory(cached.items);
        setHistoryCursor(cached.nextCursor ?? null);
        setHistoryHasMore(cached.hasMore);
        setHistoryLoading(false);
      }
    }
    api.listMyTryOnSessions({ limit: INITIAL_HISTORY_LIMIT, type: historyFilter })
      .then((historyPayload) => {
        if (active) {
          setHistory(historyPayload.items);
          setHistoryCursor(historyPayload.nextCursor ?? null);
          setHistoryHasMore(historyPayload.hasMore);
          if (userId) {
            writeFeedCache(homeHistoryCacheKey(userId, historyFilter), historyPayload);
          }
        }
      })
      .finally(() => {
        if (active) {
          setHistoryLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [api, profile?.userId, historyFilter]);

  useEffect(() => {
    let active = true;
    api.listPublishedReviews()
      .then((payload) => {
        if (active) {
          setReviews(payload.items.slice(0, 3));
        }
      })
      .catch(() => {
        if (active) {
          setReviews([]);
        }
      });
    return () => {
      active = false;
    };
  }, [api]);

  async function loadMoreHistory() {
    if (!historyCursor || historyLoadingMore) return;
    setHistoryLoadingMore(true);
    try {
      const payload = await api.listMyTryOnSessions({ limit: HISTORY_PAGE_SIZE, cursor: historyCursor, type: historyFilter });
      setHistory((prev) => [...prev, ...payload.items]);
      setHistoryCursor(payload.nextCursor ?? null);
      setHistoryHasMore(payload.hasMore);
    } finally {
      setHistoryLoadingMore(false);
    }
  }

  const nudgeLevel = subscriptionNudgeLevel(profile);
  const greetingName = profile?.displayName?.trim() || "пользователь";

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
        <SubscriptionNudgeBanner
          level={nudgeLevel}
          trialLeft={profile.trialGenerationsLeft + (profile.bonusGenerationsLeft ?? 0)}
        />
      ) : null}

      <section className="rounded-[28px] border border-[#ffd1ed] bg-white p-8 shadow-[0_16px_48px_rgba(58,12,82,0.06)]">
        <p className="text-eyebrow">Привет, {greetingName}</p>
        <h1 className="text-display mt-3 text-4xl">Готова примерить новый look?</h1>
        <p className="text-body mt-3">
          {profile?.plan === "trial"
            ? `Осталось бесплатных примерок: ${profile.trialGenerationsLeft + (profile.bonusGenerationsLeft ?? 0)}`
            : profile?.planGenerationsLeft != null
              ? `Генераций в подписке: ${profile.planGenerationsLeft}`
              : "Подписка активна — примеряй без ограничений trial."}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {profile?.stylistAvailable ? (
            <Link
              href="/stylist"
              data-testid="stylist-primary"
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--pink-soft)] bg-[var(--pink-bg)] px-4 py-3 font-medium text-[var(--pink-dark)] shadow-[0_6px_18px_var(--shadow-accent)] transition hover:-translate-y-0.5 hover:border-[var(--pink)] sm:col-span-2"
            >
              <WandSparkles size={19} aria-hidden />
              <span>Подобрать образ под событие</span>
            </Link>
          ) : null}
          <Link
            href="/try-on/link"
            data-testid="marketplace-try-on-primary"
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--pink-soft)] bg-[var(--pink-bg)] px-4 py-3 font-medium text-[var(--pink-dark)] shadow-[0_6px_18px_var(--shadow-accent)] transition hover:-translate-y-0.5 hover:border-[var(--pink)]"
          >
            <Link2 size={19} aria-hidden />
            <span>Примерить по ссылке WB / Ozon</span>
          </Link>
          <Link
            href="/try-on/photo"
            data-testid="photo-try-on-primary"
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--pink-soft)] bg-white px-4 py-3 font-medium text-[var(--muted)] transition hover:-translate-y-0.5 hover:bg-[var(--pink-bg)]"
          >
            <ImageIcon size={19} aria-hidden />
            <span>Примерить по фото</span>
          </Link>
        </div>
        <Link href="/hairstyles" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--pink-soft)] bg-[var(--pink-bg)] px-4 py-3 text-sm font-medium text-[var(--pink-dark)]"><Scissors size={18} aria-hidden />Примерить стрижку или причёску</Link>
        <div className="mt-4 flex flex-wrap gap-3">
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
        <div className="flex flex-wrap gap-2">
          {HISTORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={[
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                historyFilter === filter.id
                  ? "border-[var(--pink)] bg-[var(--pink)] text-[#14101a]"
                  : "border-[#ffd1ed] bg-white text-[#6d6273] hover:bg-[#fff4fb]",
              ].join(" ")}
              onClick={() => {
                setHistoryFilter(filter.id);
                setHistory([]);
                setHistoryCursor(null);
                setHistoryHasMore(false);
                setHistoryLoading(true);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <TryOnHistoryGrid items={history} loading={historyLoading} />
        {!historyLoading && historyHasMore ? (
          <div className="flex justify-center">
            <Button size="md" variant="ghost" disabled={historyLoadingMore} onClick={() => void loadMoreHistory()}>
              {historyLoadingMore ? "Загружаем..." : "Показать ещё"}
            </Button>
          </div>
        ) : null}
      </section>

      {reviews.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-display-md text-3xl">Отзывы</h2>
            <p className="text-body mt-2">Что пишут пользователи после примерок.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <Card key={review.id} className="flex h-full flex-col gap-3">
                <p className="text-xl text-[#ff1fa2]" aria-label={`Оценка ${review.rating} из 5`}>
                  {"★".repeat(review.rating)}
                </p>
                <p className="text-body flex-1 text-sm">{review.body}</p>
                <p className="text-sm font-black text-[#302637]">{review.displayName}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

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
