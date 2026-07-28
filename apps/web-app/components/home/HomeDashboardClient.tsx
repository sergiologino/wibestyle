"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@wibestyle/ui";
import type { GalleryPost, TryOnHistoryItem } from "@wibestyle/shared-types";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import TryOnHistoryGrid from "@/components/home/TryOnHistoryGrid";
import SubscriptionNudgeBanner from "@/components/billing/SubscriptionNudgeBanner";
import { isPaidSubscription, subscriptionNudgeLevel } from "@/lib/billing-plan";
import NotificationInboxBanner from "@/components/notifications/NotificationInboxBanner";
import { resolveGalleryImageUrl, resolveGalleryVideoUrl } from "@/lib/api-media";
import { ImageIcon, Link2 } from "lucide-react";

export default function HomeDashboardClient() {
  const searchParams = useSearchParams();
  const { api, profile } = useAppSession();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false);
  const [galleryCursor, setGalleryCursor] = useState<string | null>(null);
  const [galleryHasMore, setGalleryHasMore] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    const subscribed = searchParams.get("subscribed");
    if (subscribed === "wibe" || subscribed === "elite") {
      setCelebration(subscribed);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.listGalleryPosts({ limit: 24 }),
      api.listMyTryOnSessions({ limit: 24 }),
    ])
      .then(([galleryPayload, historyPayload]) => {
        if (active) {
          setGalleryPosts(galleryPayload.items);
          setGalleryCursor(galleryPayload.nextCursor ?? null);
          setGalleryHasMore(galleryPayload.hasMore);
          setHistory(historyPayload.items);
          setHistoryCursor(historyPayload.nextCursor ?? null);
          setHistoryHasMore(historyPayload.hasMore);
        }
      })
      .finally(() => {
        if (active) {
          setGalleryLoading(false);
          setHistoryLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [api]);

  async function loadMoreGallery() {
    if (!galleryCursor || galleryLoadingMore) return;
    setGalleryLoadingMore(true);
    try {
      const payload = await api.listGalleryPosts({ limit: 24, cursor: galleryCursor });
      setGalleryPosts((prev) => [...prev, ...payload.items]);
      setGalleryCursor(payload.nextCursor ?? null);
      setGalleryHasMore(payload.hasMore);
    } finally {
      setGalleryLoadingMore(false);
    }
  }

  async function loadMoreHistory() {
    if (!historyCursor || historyLoadingMore) return;
    setHistoryLoadingMore(true);
    try {
      const payload = await api.listMyTryOnSessions({ limit: 24, cursor: historyCursor });
      setHistory((prev) => [...prev, ...payload.items]);
      setHistoryCursor(payload.nextCursor ?? null);
      setHistoryHasMore(payload.hasMore);
    } finally {
      setHistoryLoadingMore(false);
    }
  }

  const nudgeLevel = subscriptionNudgeLevel(profile);
  const greetingName = profile?.displayName?.trim() || "пользователь";

  function renderGalleryMedia(post: GalleryPost) {
    const imageSrc = resolveGalleryImageUrl(post);
    const videoSrc = resolveGalleryVideoUrl(post);
    if (post.mediaType === "video" && videoSrc) {
      return (
        <video
          src={videoSrc}
          poster={imageSrc || undefined}
          className="h-full w-full object-cover transition group-hover:scale-[1.01]"
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
      );
    }
    if (imageSrc) {
      return <img src={imageSrc} alt={post.title} className="h-full w-full object-cover transition group-hover:scale-[1.01]" />;
    }
    return <div className="flex h-full items-center justify-center text-sm font-normal text-[#6d6273]">Нет фото</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
      <NotificationInboxBanner />
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
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/gallery"><Button size="md" variant="ghost">Галерея сообщества</Button></Link>
          {!isPaidSubscription(profile) ? (
            <Link href="/paywall"><Button size="md" variant="ghost">Тарифы</Button></Link>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-display-md text-3xl">Галерея сообщества</h2>
          <p className="text-body mt-2">
            Публичные образы всех пользователей, которые поделились результатами примерки.
          </p>
        </div>
        {galleryLoading ? (
          <Card>
            <p className="text-body">Загружаем галерею…</p>
          </Card>
        ) : galleryPosts.length === 0 ? (
          <Card>
            <p className="text-body">Пока нет публичных образов.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryPosts.map((post) => {
              const href = post.publicUrl ?? `/p/${post.slug}`;
              return (
                <Link
                  key={post.id}
                  href={href}
                  className="group overflow-hidden rounded-[24px] border border-[#ffd1ed] bg-white shadow-[0_8px_28px_rgba(58,12,82,0.05)] transition hover:border-[#ff1fa2]/40"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-[#fff4fb]">
                    {renderGalleryMedia(post)}
                  </div>
                  <div className="space-y-1 px-4 py-3">
                    <p className="line-clamp-2 font-normal text-[#302637]">{post.title}</p>
                    <p className="text-sm font-normal text-[#9a8f99]">{post.authorDisplayName ?? "Участник WibeStyle"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {!galleryLoading && galleryHasMore ? (
          <div className="flex justify-center">
            <Button size="md" variant="ghost" disabled={galleryLoadingMore} onClick={() => void loadMoreGallery()}>
              {galleryLoadingMore ? "Загружаем..." : "Показать ещё"}
            </Button>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-display-md text-3xl">Твои примерки</h2>
          <p className="text-body mt-2">
            Все образы, которые ты примеряла — даже если не публиковала в общей галерее.
          </p>
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
