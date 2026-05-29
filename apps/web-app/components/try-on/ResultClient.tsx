"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, ShareCard } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { SeasonHitVideoStatus, TryOnResult, TryOnSessionRecord } from "@wibestyle/shared-types";
import TryOnReviewForm from "@/components/try-on/TryOnReviewForm";
import { TryOnBeforeAfter, TryOnResultVideo } from "@/components/try-on/TryOnResultImages";
import AuthenticatedShareImage from "@/components/media/AuthenticatedShareImage";
import FeedbackActionButton from "@/components/try-on/FeedbackActionButton";
import OverlayModal from "@/components/ui/OverlayModal";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { formatTryOnError } from "@/lib/try-on-error-message";
import { appBaseUrl, brandDomain, landingSiteUrl } from "@/lib/api-media";
import { shareGalleryPost, buildSharePayloadFromPost } from "@/lib/share-post";

const POLL_MS = 2000;
/** ~3 minutes — aligned with backend AI timeout */
const MAX_POLLS = 90;
const VIDEO_POLL_MS = 3000;
const VIDEO_MAX_POLLS = 60;

type FeedbackState = "idle" | "loading" | "success";

export default function ResultClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { api } = useAppSession();
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [session, setSession] = useState<TryOnSessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductLink, setShowProductLink] = useState(true);
  const [galleryPostSlug, setGalleryPostSlug] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<SeasonHitVideoStatus>("none");
  const [afterVideoUrl, setAfterVideoUrl] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<FeedbackState>("idle");
  const [shareFeedback, setShareFeedback] = useState<FeedbackState>("idle");
  const [showSavePicker, setShowSavePicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingSaveVisibility, setPendingSaveVisibility] = useState<"public" | "unlisted">("public");
  const [shareError, setShareError] = useState<string | null>(null);

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
  const landingUrl = landingSiteUrl();
  const siteBrand = brandDomain();
  const shareAppBase = appBaseUrl();

  async function saveToGallery(
    visibility: "public" | "unlisted",
    mediaType: "image" | "video" = "image",
  ) {
    const created = await api.createGalleryPost({
      tryOnSessionId: sessionId,
      visibility,
      productLinkVisible: showProductLink,
      productVisibility: showProductLink ? "SHOW_PRODUCT_LINK" : "HIDE_PRODUCT_LINK",
      eliteFrame: result?.eliteFrame,
      mediaType: hasVideo ? mediaType : "image",
    });
    setGalleryPostSlug(created.post.slug);
    return created.post;
  }

  function flashSuccess(setter: (state: FeedbackState) => void) {
    setter("success");
    window.setTimeout(() => setter("idle"), 2200);
  }

  function openSavePicker(visibility: "public" | "unlisted") {
    if (hasVideo) {
      setPendingSaveVisibility(visibility);
      setShowSavePicker(true);
      return;
    }
    void performSave(visibility, "image");
  }

  async function performSave(visibility: "public" | "unlisted", mediaType: "image" | "video") {
    setShowSavePicker(false);
    setSaveFeedback("loading");
    try {
      await saveToGallery(visibility, mediaType);
      flashSuccess(setSaveFeedback);
    } catch {
      setSaveFeedback("idle");
    }
  }

  async function onShare() {
    setShareError(null);
    setShareFeedback("loading");
    try {
      const post = await saveToGallery("unlisted", "image");
      const sharePayload = buildSharePayloadFromPost({
        slug: post.slug,
        appBaseUrl: shareAppBase,
        title: post.title,
        productTitle,
        showProductLink,
      });
      const outcome = await shareGalleryPost(sharePayload);
      setGalleryPostSlug(post.slug);
      setShowShareModal(false);
      flashSuccess(setShareFeedback);
      if (outcome === "copied") {
        setShareError("Ссылка скопирована — вставь в чат, появится превью с фото.");
        window.setTimeout(() => setShareError(null), 4000);
      }
    } catch (err) {
      setShareFeedback("idle");
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setShareError("Не удалось поделиться. Попробуй ещё раз или сохрани в галерею.");
    }
  }

  function openShareModal() {
    setShareError(null);
    setShowShareModal(true);
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

      <div className={`mx-auto grid w-full gap-6 ${hasVideo ? "max-w-4xl md:grid-cols-2" : "max-w-md"}`}>
        <TryOnBeforeAfter
          afterSrc={result.afterImageUrl}
          beforeSrc={result.beforeImageUrl}
          onExpandClick={() => setShowImageModal(true)}
        />

        {hasVideo && afterVideoUrl ? (
          <TryOnResultVideo eliteFrame={result.eliteFrame} src={afterVideoUrl} />
        ) : null}
      </div>

      <OverlayModal
        ariaLabel="Увеличенный результат примерки"
        className="max-w-2xl"
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
      >
        <TryOnBeforeAfter afterSrc={result.afterImageUrl} beforeSrc={result.beforeImageUrl} />
      </OverlayModal>

      <OverlayModal
        ariaLabel="Поделиться с подругой"
        className="max-w-lg"
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      >
        <div className="pt-2">
          <p className="text-eyebrow px-1">Отправить подруге</p>
          <p className="mt-2 px-1 text-sm font-normal text-[#6d6273]">
            Так будет выглядеть карточка в чате — с фото, QR и ссылкой на look.
          </p>
          <div className="mt-4">
            <ShareCard
              appBaseUrl={shareAppBase}
              brandDomain={siteBrand}
              eliteFrame={result.eliteFrame}
              imageElement={
                <AuthenticatedShareImage
                  alt="Share card"
                  className="aspect-[4/5] w-full object-cover"
                  src={result.afterImageUrl}
                />
              }
              landingUrl={landingUrl}
              postSlug={postSlug}
              productTitle={productTitle}
              showProductLink={showProductLink}
            />
          </div>
          <div className="mt-5 px-1">
            <FeedbackActionButton
              feedbackState={shareFeedback}
              successLabel="Отправлено!"
              onClick={() => void onShare()}
            >
              Отправить
            </FeedbackActionButton>
          </div>
        </div>
      </OverlayModal>

      {videoStatus === "generating" || videoGenerating ? (
        <Card className="border-[#782cff]/20 bg-[#fff4fb]">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-5 shrink-0 animate-spin rounded-full border-2 border-[#782cff] border-t-transparent"
            />
            <p className="font-normal text-[#302637]">Генерируем видео… Это может занять пару минут.</p>
          </div>
        </Card>
      ) : null}

      <Card>
        <label className="mb-4 flex items-center gap-3 font-normal text-[#302637]">
          <input
            checked={showProductLink}
            type="checkbox"
            onChange={(event) => setShowProductLink(event.target.checked)}
          />
          Показывать, где взяла одежду
        </label>

        <div className="flex flex-wrap gap-3">
          {!hasVideo && videoStatus !== "generating" ? (
            <Button
              className="animate-[attentionPulse_2.4s_ease-in-out_infinite]"
              disabled={videoGenerating}
              size="md"
              onClick={() => void onMakeVideo()}
            >
              Сделать видео
            </Button>
          ) : null}
          <FeedbackActionButton
            feedbackState={saveFeedback}
            successLabel="Сохранено!"
            onClick={() => openSavePicker("public")}
          >
            Сохранить в галерею
          </FeedbackActionButton>
          <FeedbackActionButton
            feedbackState={shareFeedback}
            successLabel="Отправлено!"
            variant="secondary"
            onClick={openShareModal}
          >
            Отправить подруге
          </FeedbackActionButton>
          {productUrl ? (
            <Link href={productUrl} target="_blank">
              <Button size="md" variant="ghost">
                Открыть товар
              </Button>
            </Link>
          ) : null}
        </div>
        {!hasVideo && videoStatus !== "generating" ? (
          <p className="text-body mt-3 text-sm">
            Кинематографичное видео с look — эксклюзив Elite. Подходящая локация подбирается автоматически.
          </p>
        ) : null}
        {videoError ? <p className="mt-3 font-normal text-[#c01278]">{videoError}</p> : null}
        {shareError ? <p className="mt-3 text-sm font-normal text-[#6d6273]">{shareError}</p> : null}
      </Card>

      {showSavePicker ? (
        <OverlayModal
          ariaLabel="Выбор формата сохранения"
          className="max-w-md"
          open={showSavePicker}
          onClose={() => setShowSavePicker(false)}
        >
          <Card className="animate-[fadeInUp_0.25s_ease-out]">
            <p className="text-eyebrow">Сохранение</p>
            <h2 className="text-display mt-2 text-2xl">Что сохранить в галерею?</h2>
            <p className="text-body mt-2 text-sm">Выбери одно — фото или видео.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-[22px] border border-[#ffd1ed] bg-white p-4 text-left transition hover:border-[#ff1fa2] hover:shadow-[0_8px_24px_rgba(255,31,162,0.12)] active:scale-[0.98]"
                onClick={() => void performSave(pendingSaveVisibility, "image")}
              >
                <span className="text-2xl" aria-hidden>📷</span>
                <p className="mt-2 font-medium text-[#302637]">Фото</p>
                <p className="mt-1 text-sm font-normal text-[#6d6273]">Look с плашкой и QR</p>
              </button>
              <button
                type="button"
                className="rounded-[22px] border border-[#ffd1ed] bg-white p-4 text-left transition hover:border-[#ff1fa2] hover:shadow-[0_8px_24px_rgba(255,31,162,0.12)] active:scale-[0.98]"
                onClick={() => void performSave(pendingSaveVisibility, "video")}
              >
                <span className="text-2xl" aria-hidden>🎬</span>
                <p className="mt-2 font-medium text-[#302637]">Видео</p>
                <p className="mt-1 text-sm font-normal text-[#6d6273]">Видео с плашкой и QR</p>
              </button>
            </div>
          </Card>
        </OverlayModal>
      ) : null}

      <TryOnReviewForm api={api} sessionId={sessionId} />

      <Link href="/try-on" className="text-link text-sm">
        Примерить ещё одну вещь
      </Link>
    </div>
  );
}
