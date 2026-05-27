"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Pill, ShareCard } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { TryOnResult, TryOnSessionRecord } from "@wibestyle/shared-types";
import TryOnReviewForm from "@/components/try-on/TryOnReviewForm";
import { TryOnBeforeAfter, TryOnResultHero } from "@/components/try-on/TryOnResultImages";
import AuthenticatedShareImage from "@/components/media/AuthenticatedShareImage";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { formatTryOnError } from "@/lib/try-on-error-message";

const POLL_MS = 2000;
/** ~3 minutes — aligned with backend AI timeout */
const MAX_POLLS = 90;

export default function ResultClient({ sessionId }: { sessionId: string }) {
  const { api } = useAppSession();
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [session, setSession] = useState<TryOnSessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductLink, setShowProductLink] = useState(true);
  const [shared, setShared] = useState(false);
  const [galleryPostSlug, setGalleryPostSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;

    async function pollOnce() {
      try {
        const payload = await api.getTryOnSession(sessionId);
        if (cancelled) return;

        setSession(payload.session);

        if (payload.result) {
          setResult(payload.result);
          setLoading(false);
          return;
        }

        if (payload.session.status === "failed") {
          setError(formatTryOnError(payload.session));
          setLoading(false);
          return;
        }

        if (payload.session.status === "generating" && polls < MAX_POLLS) {
          polls += 1;
          pollTimer = window.setTimeout(() => {
            void pollOnce();
          }, POLL_MS);
          return;
        }

        if (payload.session.status === "generating") {
          setError("Генерация занимает дольше обычного. Обнови страницу через минуту или попробуй снова.");
        } else {
          setError("Результат ещё не готов");
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Не удалось загрузить результат");
        setLoading(false);
      }
    }

    void pollOnce();

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [api, sessionId]);

  const fallbackSlug = useMemo(() => sessionId.replace(/-/g, "").slice(0, 12), [sessionId]);
  const productTitle = result?.product?.title ?? "Look из галереи";
  const productUrl = result?.product?.productUrl;
  const postSlug = galleryPostSlug ?? fallbackSlug;

  async function saveToGallery(visibility: "public" | "unlisted") {
    const created = await api.createGalleryPost({
      tryOnSessionId: sessionId,
      visibility,
      productLinkVisible: showProductLink,
      productVisibility: showProductLink ? "SHOW_PRODUCT_LINK" : "HIDE_PRODUCT_LINK",
      eliteFrame: result?.eliteFrame,
    });
    setGalleryPostSlug(created.post.slug);
    return created.post;
  }

  async function onShare() {
    try {
      const post = await saveToGallery("unlisted");
      setGalleryPostSlug(post.slug);
      setShared(true);
    } catch {
      setShared(true);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <Pill>{session?.status === "generating" ? "Генерируем look…" : "Загружаем результат…"}</Pill>
        <Card>
          <p className="font-normal text-[#6d6273]">Нейростилист надевает вещь на твой образ…</p>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#ffe4f5]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(135deg,#ff1fa2,#b100ff)]" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <Pill>Ошибка</Pill>
        <Card>
          <p className="font-bold text-[#c01278]">{error ?? "Результат недоступен"}</p>
          {session?.errorCode ? (
            <p className="mt-2 text-sm text-[#6d6273]">Код: {session.errorCode}</p>
          ) : null}
          <Link href="/try-on" className="mt-4 inline-block font-bold text-[#ff1fa2]">
            ← Попробовать снова
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <Pill>Готово ✦</Pill>
      <h1 className="text-4xl font-black tracking-tight">Смотри, как смотрится на тебе</h1>

      {result.sizeFitMessage && result.recommendedSize ? (
        <Card className="border-[#ffb347] bg-[#fffaf3]">
          <p className="font-bold text-[#302637]">{result.sizeFitMessage}</p>
          <p className="mt-2 text-sm font-bold text-[#6d6273]">
            Выбран {result.selectedSize ?? "—"} · рекомендуем {result.recommendedSize}
          </p>
          {productUrl ? (
            <Link
              href={`/try-on/link?url=${encodeURIComponent(productUrl)}&size=${encodeURIComponent(result.recommendedSize)}`}
              className="mt-4 inline-block font-black text-[#ff1fa2]"
            >
              Примерить размер {result.recommendedSize} →
            </Link>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <TryOnResultHero imageSrc={result.afterImageUrl} />
        <TryOnBeforeAfter afterSrc={result.afterImageUrl} beforeSrc={result.beforeImageUrl} />
      </div>

      <Card>
        <div className="flex flex-wrap gap-4">
          <Button size="lg" onClick={() => saveToGallery("public")}>
            Сохранить в галерею
          </Button>
          <Button size="lg" variant="secondary" onClick={onShare}>
            Отправить подруге
          </Button>
          {productUrl ? (
            <Link href={productUrl} target="_blank">
              <Button size="lg" variant="ghost">
                Открыть товар
              </Button>
            </Link>
          ) : null}
        </div>
      </Card>

      {shared ? (
        <div className="grid gap-4">
          <label className="flex items-center gap-3 font-bold text-[#302637]">
            <input
              checked={showProductLink}
              type="checkbox"
              onChange={(event) => setShowProductLink(event.target.checked)}
            />
            Показывать, где взяла одежду
          </label>
          <ShareCard
            appBaseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}
            eliteFrame={result.eliteFrame}
            imageElement={
              <AuthenticatedShareImage
                alt="Share card"
                className="aspect-[4/5] w-full object-cover"
                src={result.afterImageUrl}
              />
            }
            postSlug={postSlug}
            productTitle={productTitle}
            showProductLink={showProductLink}
          />
          {galleryPostSlug ? (
            <Link href={`/p/${galleryPostSlug}`} className="font-bold text-[#ff1fa2]">
              Открыть пост · app.wibestyle.ru/p/{galleryPostSlug}
            </Link>
          ) : null}
        </div>
      ) : null}

      <TryOnReviewForm api={api} sessionId={sessionId} />

      <Link href="/try-on" className="font-bold text-[#ff1fa2]">
        Примерить ещё одну вещь
      </Link>
    </div>
  );
}
