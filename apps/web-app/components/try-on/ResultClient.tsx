"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, ShareCard } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { SeasonHitVideoStatus, TryOnResult, TryOnSessionRecord } from "@wibestyle/shared-types";
import TryOnReviewForm from "@/components/try-on/TryOnReviewForm";
import { TryOnBeforeAfter } from "@/components/try-on/TryOnResultImages";
import AuthenticatedShareImage from "@/components/media/AuthenticatedShareImage";
import AuthenticatedVideo from "@/components/media/AuthenticatedVideo";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { formatTryOnError } from "@/lib/try-on-error-message";

const POLL_MS = 2000;
/** ~3 minutes — aligned with backend AI timeout */
const MAX_POLLS = 90;
const VIDEO_POLL_MS = 3000;
const VIDEO_MAX_POLLS = 60;

export default function ResultClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { api } = useAppSession();
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [session, setSession] = useState<TryOnSessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductLink, setShowProductLink] = useState(true);
  const [shared, setShared] = useState(false);
  const [galleryPostSlug, setGalleryPostSlug] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<SeasonHitVideoStatus>("none");
  const [afterVideoUrl, setAfterVideoUrl] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | undefined;
    let polls = 0;

    async function pollOnce() {
      try {
        const payload = await api.getTryOnSession(sessionId);
        if (cancelled) return;

        setSession(payload.session);

        if (payload.result) {
          setResult(payload.result);
          setVideoStatus(payload.result.videoStatus ?? payload.session.videoStatus ?? "none");
          setAfterVideoUrl(payload.result.afterVideoUrl ?? payload.session.afterVideoUrl ?? null);
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

  useEffect(() => {
    if (videoStatus !== "generating") {
      return;
    }

    let cancelled = false;
    let pollTimer: number | undefined;
    let polls = 0;

    async function pollVideo() {
      try {
        const payload = await api.getTryOnSession(sessionId);
        if (cancelled) return;

        const status = payload.result?.videoStatus ?? payload.session.videoStatus ?? "none";

        if (status === "ready") {
          const url = payload.result?.afterVideoUrl ?? payload.session.afterVideoUrl ?? null;
          setAfterVideoUrl(url);
          setVideoGenerating(false);
          setVideoError(null);
          setVideoStatus("ready");
          if (payload.result) {
            setResult(payload.result);
          }
          return;
        }

        if (status === "failed") {
          setVideoGenerating(false);
          setVideoError(payload.session.videoErrorMessage ?? "Не удалось создать видео");
          setVideoStatus("failed");
          return;
        }

        if (polls < VIDEO_MAX_POLLS) {
          polls += 1;
          pollTimer = window.setTimeout(() => {
            void pollVideo();
          }, VIDEO_POLL_MS);
        } else {
          setVideoGenerating(false);
          setVideoError("Генерация видео занимает дольше обычного. Обнови страницу через минуту.");
          setVideoStatus("failed");
        }
      } catch {
        if (!cancelled) {
          setVideoGenerating(false);
          setVideoError("Не удалось проверить статус видео");
          setVideoStatus("failed");
        }
      }
    }

    void pollVideo();

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [api, sessionId, videoStatus]);

  const fallbackSlug = useMemo(() => sessionId.replace(/-/g, "").slice(0, 12), [sessionId]);
  const productTitle = result?.product?.title ?? "Look из галереи";
  const productUrl = result?.product?.productUrl;
  const postSlug = galleryPostSlug ?? fallbackSlug;
  const hasVideo = videoStatus === "ready" && afterVideoUrl;

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

  async function onMakeVideo() {
    setVideoError(null);
    try {
      const { entitlements } = await api.getEntitlements();
      if (!entitlements.videoTryOn) {
        router.push("/paywall?reason=elite_perk");
        return;
      }
    } catch {
      router.push("/paywall?reason=elite_perk");
      return;
    }

    setVideoGenerating(true);
    setVideoStatus("generating");
    try {
      const response = await api.generateSeasonHitVideo(sessionId);
      setVideoStatus(response.videoStatus);
      if (response.afterVideoUrl) {
        setAfterVideoUrl(response.afterVideoUrl);
      }
    } catch (err) {
      setVideoGenerating(false);
      setVideoStatus("none");
      if (err instanceof ApiError && err.code === "VIDEO_ELITE_REQUIRED") {
        router.push("/paywall?reason=elite_perk");
        return;
      }
      setVideoError(err instanceof ApiError ? err.message : "Не удалось запустить генерацию видео");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <p className="text-eyebrow">{session?.status === "generating" ? "Генерируем look…" : "Загружаем результат…"}</p>
        <Card>
          <p className="text-body">Нейростилист надевает вещь на твой образ…</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#ffe4f5]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#ff1fa2]" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <p className="text-eyebrow">Ошибка</p>
        <Card>
          <p className="font-normal text-[#c01278]">{error ?? "Результат недоступен"}</p>
          {session?.errorCode ? (
            <p className="mt-2 text-sm text-[#6d6273]">Код: {session.errorCode}</p>
          ) : null}
          <Link href="/try-on" className="text-link mt-4 inline-block text-sm">
            ← Попробовать снова
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div>
        <p className="text-eyebrow">Готово</p>
        <h1 className="text-display mt-2 text-4xl">Смотри, как смотрится на тебе</h1>
      </div>

      {result.sizeFitMessage && result.recommendedSize ? (
        <Card className="border-[#ffb347] bg-[#fffaf3]">
          <p className="font-normal text-[#302637]">{result.sizeFitMessage}</p>
          <p className="mt-2 text-sm font-normal text-[#6d6273]">
            Выбран {result.selectedSize ?? "—"} · рекомендуем {result.recommendedSize}
          </p>
          {productUrl ? (
            <Link
              href={`/try-on/link?url=${encodeURIComponent(productUrl)}&size=${encodeURIComponent(result.recommendedSize)}`}
              className="text-link mt-4 inline-block text-sm"
            >
              Примерить размер {result.recommendedSize} →
            </Link>
          ) : null}
        </Card>
      ) : null}

      <div className={`grid gap-6 ${hasVideo ? "lg:grid-cols-2" : ""}`}>
        <TryOnBeforeAfter afterSrc={result.afterImageUrl} beforeSrc={result.beforeImageUrl} />

        {hasVideo && afterVideoUrl ? (
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[28px] border border-[#f0dce8] bg-[#f5eef3] shadow-[0_20px_60px_rgba(58,12,82,0.12)]">
            <AuthenticatedVideo
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              loop
              muted
              src={afterVideoUrl}
            />
            <span className="absolute left-4 top-4 rounded-full bg-[#782cff] px-3 py-1 text-xs font-medium text-white">
              Хит сезона
            </span>
          </div>
        ) : null}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3">
          {!hasVideo && videoStatus !== "generating" ? (
            <Button disabled={videoGenerating} size="md" variant="secondary" onClick={() => void onMakeVideo()}>
              Сделать видео
            </Button>
          ) : null}
          {videoStatus === "generating" || videoGenerating ? (
            <Button disabled size="md" variant="secondary">
              Генерируем видео…
            </Button>
          ) : null}
          <Button size="md" onClick={() => saveToGallery("public")}>
            Сохранить в галерею
          </Button>
          <Button size="md" variant="secondary" onClick={onShare}>
            Отправить подруге
          </Button>
          {productUrl ? (
            <Link href={productUrl} target="_blank">
              <Button size="md" variant="ghost">
                Открыть товар
              </Button>
            </Link>
          ) : null}
        </div>
        {videoError ? <p className="mt-3 font-normal text-[#c01278]">{videoError}</p> : null}
        {!hasVideo && videoStatus !== "generating" ? (
          <p className="text-body mt-3 text-sm">
            Кинематографичное видео с look — эксклюзив Elite. Подходящая локация подбирается автоматически.
          </p>
        ) : null}
      </Card>

      {shared ? (
        <div className="grid gap-4">
          <label className="flex items-center gap-3 font-normal text-[#302637]">
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
            <Link href={`/p/${galleryPostSlug}`} className="text-link text-sm">
              Открыть пост · app.wibestyle.ru/p/{galleryPostSlug}
            </Link>
          ) : null}
        </div>
      ) : null}

      <TryOnReviewForm api={api} sessionId={sessionId} />

      <Link href="/try-on" className="text-link text-sm">
        Примерить ещё одну вещь
      </Link>
    </div>
  );
}
