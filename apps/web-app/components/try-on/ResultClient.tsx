"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, ShareCard } from "@wibestyle/ui";
import { ApiError } from "@wibestyle/api-client";
import type { GalleryPost, SeasonHitVideoStatus, TryOnResult, TryOnSessionRecord } from "@wibestyle/shared-types";
import TryOnReviewForm from "@/components/try-on/TryOnReviewForm";
import { TryOnBeforeAfter, TryOnResultVideo } from "@/components/try-on/TryOnResultImages";
import TryOnProductBanner from "@/components/try-on/TryOnProductBanner";
import TryOnFavoriteButton from "@/components/try-on/TryOnFavoriteButton";
import ApiImage from "@/components/media/ApiImage";
import AuthenticatedShareImage from "@/components/media/AuthenticatedShareImage";
import FeedbackActionButton from "@/components/try-on/FeedbackActionButton";
import OverlayModal from "@/components/ui/OverlayModal";
import { useAppSession } from "@/components/providers/AppSessionProvider";
import { formatTryOnError } from "@/lib/try-on-error-message";
import { appBaseUrl, brandDomain, landingSiteUrl } from "@/lib/api-media";
import { shareGalleryPost, buildSharePayloadFromPost } from "@/lib/share-post";
import { downloadProtectedFile } from "@/lib/try-on-download";
import {
  canFavoriteTryOnProduct,
  favoriteProductKey,
  shouldShowProductBanner,
} from "@/lib/try-on-product";
import { Clapperboard, Download, Maximize2, Plus } from "lucide-react";

const POLL_MS = 2000;
/** ~3 minutes — aligned with backend AI timeout */
const MAX_POLLS = 90;
const VIDEO_POLL_MS = 3000;
const VIDEO_MAX_POLLS = 60;

type FeedbackState = "idle" | "loading" | "success";

export default function ResultClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { api, accessToken, getAccessTokenForMedia } = useAppSession();
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [session, setSession] = useState<TryOnSessionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductLink, setShowProductLink] = useState(true);
  const [galleryPostSlug, setGalleryPostSlug] = useState<string | null>(null);
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([]);
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
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    void api.listMyGalleryPosts()
      .then(({ items }) => {
        if (!cancelled) {
          setGalleryPosts(items.filter((post) => post.tryOnSessionId === sessionId));
        }
      })
      .catch(() => {
        /* ignore — gallery button stays in initial state */
      });
    return () => {
      cancelled = true;
    };
  }, [api, sessionId]);

  const fallbackSlug = useMemo(() => sessionId.replace(/-/g, "").slice(0, 12), [sessionId]);
  const isHairstyle = session?.sourceType === "hairstyle";
  const isStylistIdea = session?.sourceType === "stylist_idea";
  const productTitle = isStylistIdea ? "Идея стилиста" : result?.product?.title ?? (isHairstyle ? "AI-причёска" : "Look из галереи");
  const productUrl = result?.product?.productUrl;
  const postSlug = galleryPostSlug ?? fallbackSlug;
  const hasVideo = !isHairstyle && !isStylistIdea && videoStatus === "ready" && afterVideoUrl;
  const landingUrl = landingSiteUrl();
  const siteBrand = brandDomain();
  const shareAppBase = appBaseUrl();
  const product = result?.product;
  const selectedSize = result?.selectedSize ?? session?.selectedSize;
  const favoriteKey = product && canFavoriteTryOnProduct(product) ? favoriteProductKey(product) : null;
  const galleryPostFor = (mediaType: "image" | "video") =>
    galleryPosts.find((post) => (post.mediaType ?? "image") === mediaType);
  const publicImageGalleryPost = galleryPostFor("image");

  useEffect(() => {
    if (!favoriteKey) {
      return;
    }
    let cancelled = false;
    void api.listFavorites().then(({ items }) => {
      if (cancelled) return;
      const found = items.some((item) => `${item.marketplace}:${item.externalProductId}` === favoriteKey);
      setIsFavorite(found);
    }).catch(() => {
      /* ignore — heart stays inactive */
    });
    return () => {
      cancelled = true;
    };
  }, [api, favoriteKey]);

  async function toggleFavorite() {
    if (!product || !canFavoriteTryOnProduct(product)) {
      return;
    }
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await api.removeFavorite(product.marketplace, product.id);
        setIsFavorite(false);
      } else {
        await api.addFavorite({
          marketplace: product.marketplace,
          externalProductId: product.id,
          title: product.title,
          brand: product.brand,
          priceRub: product.priceRub,
          imageUrl: product.imageUrl,
          productUrl: product.productUrl,
          tryOnSessionId: sessionId,
          sizes: product.sizes,
        });
        setIsFavorite(true);
      }
    } catch (err) {
      setShareError(err instanceof ApiError ? err.message : "Не удалось обновить избранное");
      window.setTimeout(() => setShareError(null), 4000);
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function saveToGallery(
    visibility: "public" | "unlisted",
    mediaType: "image" | "video" = "image",
  ) {
    const created = await api.createGalleryPost({
      tryOnSessionId: sessionId,
      visibility,
      productLinkVisible: isHairstyle || isStylistIdea ? false : showProductLink,
      productVisibility: isHairstyle || isStylistIdea || !showProductLink ? "HIDE_PRODUCT_LINK" : "SHOW_PRODUCT_LINK",
      eliteFrame: result?.eliteFrame,
      mediaType: hasVideo ? mediaType : "image",
    });
    setGalleryPostSlug(created.post.slug);
    setGalleryPosts((posts) => {
      const savedMediaType = created.post.mediaType ?? (hasVideo ? mediaType : "image");
      return [
        ...posts.filter((post) => (post.mediaType ?? "image") !== savedMediaType),
        created.post,
      ];
    });
    return created.post;
  }

  async function removeFromGallery(post: GalleryPost) {
    await api.deleteMyGalleryPost(post.id);
    setGalleryPosts((posts) => posts.filter((item) => item.id !== post.id));
    if (galleryPostSlug === post.slug) {
      setGalleryPostSlug(null);
    }
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
      const normalizedMediaType = hasVideo ? mediaType : "image";
      const existingPost = visibility === "public" ? galleryPostFor(normalizedMediaType) : undefined;
      if (existingPost) {
        await removeFromGallery(existingPost);
      } else {
        await saveToGallery(visibility, normalizedMediaType);
      }
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
        showProductLink: !isStylistIdea && showProductLink,
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
      if (
        err instanceof ApiError
        && (err.code === "VIDEO_ELITE_REQUIRED" || err.code === "VIDEO_TRIAL_EXHAUSTED")
      ) {
        router.push("/paywall?reason=elite_perk");
        return;
      }
      setVideoError(err instanceof ApiError ? err.message : "Не удалось запустить генерацию видео");
    }
  }

  async function onDownloadResult() {
    if (!result?.afterImageUrl || downloadBusy) {
      return;
    }
    setDownloadBusy(true);
    setShareError(null);
    try {
      await downloadProtectedFile({
        imageUrl: `/api/v1/try-on/sessions/${sessionId}/download?type=image`,
        accessToken,
        getAccessTokenForMedia,
        filename: `vibestyle-try-on-${sessionId.slice(0, 8)}.png`,
      });
    } catch {
      setShareError("Не удалось скачать фото. Попробуй ещё раз.");
    } finally {
      setDownloadBusy(false);
    }
  }

  async function onDownloadVideo() {
    if (!hasVideo || downloadBusy) return;
    setDownloadBusy(true);
    try { await downloadProtectedFile({ imageUrl: `/api/v1/try-on/sessions/${sessionId}/download?type=video`, accessToken, getAccessTokenForMedia, filename: `vibestyle-try-on-${sessionId.slice(0, 8)}.mp4` }); }
    catch { setShareError("Не удалось скачать видео. Попробуйте ещё раз."); }
    finally { setDownloadBusy(false); }
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <p className="text-eyebrow">{session?.status === "generating" ? "Генерируем look…" : "Загружаем результат…"}</p>
        <Card>
          <p className="text-body">Нейростилист собирает ваш образ…</p>
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
        <h1 className="text-display mt-2 text-4xl">
          {isHairstyle ? "Смотри причёску до и после" : isStylistIdea ? "Идея стилиста готова" : "Смотри, как смотрится на тебе"}
        </h1>
      </div>

      {result.styleCompliment ? (
        <Card className="border-[#ffd1ed]/80 bg-[#fff8fd]">
          <p className="text-eyebrow">Комментарий стилиста</p>
          <p className="mt-2 text-lg font-normal text-[#302637]">{result.styleCompliment}</p>
        </Card>
      ) : null}

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

      {!isHairstyle && !isStylistIdea && product && shouldShowProductBanner(product, selectedSize) ? (
        <TryOnProductBanner product={product} selectedSize={selectedSize} />
      ) : null}

      <div className={`mx-auto grid w-full gap-6 ${hasVideo ? "max-w-4xl md:grid-cols-2" : "max-w-md"}`}>
        <div>
          {isStylistIdea ? (
            <ResultSingleImage
              src={result.afterImageUrl}
              downloadBusy={downloadBusy}
              onDownloadClick={() => void onDownloadResult()}
              onExpandClick={() => setShowImageModal(true)}
            />
          ) : (
            <TryOnBeforeAfter
              afterSrc={result.afterImageUrl}
              beforeSrc={result.beforeImageUrl}
              downloadBusy={downloadBusy}
              onDownloadClick={() => void onDownloadResult()}
              onExpandClick={() => setShowImageModal(true)}
            />
          )}
          {isStylistIdea ? (
            <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7aa052]">
              Идея стилиста
            </p>
          ) : null}
        </div>

        {hasVideo && afterVideoUrl ? (
          <TryOnResultVideo eliteFrame={result.eliteFrame} src={afterVideoUrl} downloadBusy={downloadBusy} onDownloadClick={() => void onDownloadVideo()} />
        ) : null}
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-wrap justify-center gap-3" data-testid="try-on-download-actions">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#ffd1ed] bg-white px-5 py-2.5 text-sm font-medium text-[#302637] shadow-[0_6px_18px_rgba(58,12,82,0.05)] transition hover:border-[#ffb8e4] hover:text-[#ff1fa2] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          disabled={downloadBusy}
          onClick={() => void onDownloadResult()}
        >
          <Download size={17} aria-hidden />
          <span>{downloadBusy ? "Готовим файл…" : "Скачать фото"}</span>
        </button>
        {hasVideo && afterVideoUrl ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#ffd1ed] bg-white px-5 py-2.5 text-sm font-medium text-[#302637] shadow-[0_6px_18px_rgba(58,12,82,0.05)] transition hover:border-[#ffb8e4] hover:text-[#ff1fa2] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            disabled={downloadBusy}
            onClick={() => void onDownloadVideo()}
          >
            <Download size={17} aria-hidden />
            <span>{downloadBusy ? "Готовим файл…" : "Скачать видео"}</span>
          </button>
        ) : null}
      </div>

      <OverlayModal
        ariaLabel="Увеличенный результат примерки"
        className="max-w-2xl"
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
      >
        {isStylistIdea ? (
          <ResultSingleImage src={result.afterImageUrl} className="max-h-[82vh] shadow-none" />
        ) : (
          <TryOnBeforeAfter afterSrc={result.afterImageUrl} beforeSrc={result.beforeImageUrl} />
        )}
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
              showProductLink={!isStylistIdea && showProductLink}
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
        {!isHairstyle && !isStylistIdea ? (
          <label className="mb-4 flex items-center gap-3 font-normal text-[#302637]">
            <input
              checked={showProductLink}
              type="checkbox"
              onChange={(event) => setShowProductLink(event.target.checked)}
            />
            Показывать, где взяла одежду
          </label>
        ) : null}

        {!isStylistIdea && product && canFavoriteTryOnProduct(product) ? (
          <div className="mb-3">
            <TryOnFavoriteButton
              isFavorite={isFavorite}
              loading={favoriteLoading}
              product={product}
              onToggle={() => void toggleFavorite()}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {!isHairstyle && !isStylistIdea && !hasVideo && videoStatus !== "generating" ? (
            <button
              type="button"
              aria-label="Сделать видео из результата примерки"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#782cff] px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(120,44,255,0.3)] transition hover:bg-[#6420dc] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={videoGenerating}
              onClick={() => void onMakeVideo()}
            >
              <Clapperboard size={18} aria-hidden />
              <span>Сделать видео</span>
            </button>
          ) : null}
          <FeedbackActionButton
            feedbackState={saveFeedback}
            successLabel="Готово!"
            onClick={() => openSavePicker("public")}
          >
            {publicImageGalleryPost ? "Убрать из галереи" : "Показать в галерее"}
          </FeedbackActionButton>
          <FeedbackActionButton
            feedbackState={shareFeedback}
            successLabel="Отправлено!"
            variant="secondary"
            onClick={openShareModal}
          >
            Отправить подруге
          </FeedbackActionButton>
        </div>
        {!isHairstyle && !isStylistIdea && !hasVideo && videoStatus !== "generating" ? (
          <p className="text-body mt-3 text-sm">
            В trial доступно одно бесплатное видео. В Elite можно создавать видео к каждой примерке.
            Подходящая локация подбирается автоматически.
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
            <p className="text-body mt-2 text-sm">Выбери, что показать или убрать.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-[22px] border border-[#ffd1ed] bg-white p-4 text-left transition hover:border-[#ff1fa2] hover:shadow-[0_8px_24px_rgba(255,31,162,0.12)] active:scale-[0.98]"
                onClick={() => void performSave(pendingSaveVisibility, "image")}
              >
                <span className="text-2xl" aria-hidden>📷</span>
                <p className="mt-2 font-medium text-[#302637]">{galleryPostFor("image") ? "Убрать фото" : "Фото"}</p>
                <p className="mt-1 text-sm font-normal text-[#6d6273]">
                  {galleryPostFor("image") ? "Фото исчезнет из галереи" : "Look с плашкой и QR"}
                </p>
              </button>
              <button
                type="button"
                className="rounded-[22px] border border-[#ffd1ed] bg-white p-4 text-left transition hover:border-[#ff1fa2] hover:shadow-[0_8px_24px_rgba(255,31,162,0.12)] active:scale-[0.98]"
                onClick={() => void performSave(pendingSaveVisibility, "video")}
              >
                <span className="text-2xl" aria-hidden>🎬</span>
                <p className="mt-2 font-medium text-[#302637]">{galleryPostFor("video") ? "Убрать видео" : "Видео"}</p>
                <p className="mt-1 text-sm font-normal text-[#6d6273]">
                  {galleryPostFor("video") ? "Видео исчезнет из галереи" : "Видео с плашкой и QR"}
                </p>
              </button>
            </div>
          </Card>
        </OverlayModal>
      ) : null}

      <TryOnReviewForm api={api} sessionId={sessionId} />

      <Link
        href={isHairstyle ? "/hairstyles" : isStylistIdea ? "/stylist" : "/try-on"}
        data-testid="try-on-again"
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl border border-[#ffd1ed] bg-[#fff4fb]/75 px-5 py-2.5 text-sm font-medium text-[#782cff] shadow-[0_6px_18px_rgba(58,12,82,0.05)] transition hover:border-[#ffb8e4] hover:bg-[#fff0f8] active:scale-[0.98]"
      >
        <Plus size={18} aria-hidden />
        <span>{isHairstyle ? "Выбрать другую причёску" : isStylistIdea ? "Собрать другую идею" : "Примерить ещё одну вещь"}</span>
      </Link>
    </div>
  );
}

function ResultSingleImage({
  src,
  onExpandClick,
  onDownloadClick,
  downloadBusy = false,
  className,
}: {
  src: string;
  onExpandClick?: () => void;
  onDownloadClick?: () => void;
  downloadBusy?: boolean;
  className?: string;
}) {
  return (
    <div className={["relative aspect-[3/4] w-full overflow-hidden rounded-[28px] border border-[#f0dce8] bg-[#f5eef3] shadow-[0_20px_60px_rgba(58,12,82,0.12)]", className].filter(Boolean).join(" ")}>
      <ApiImage alt="Идея стилиста" className="absolute inset-0 h-full w-full object-contain object-center" src={src} />
      {onDownloadClick ? (
        <button
          aria-label="Скачать идею стилиста"
          className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-white/95 text-[#302637] shadow-md transition hover:bg-white hover:text-[#ff1fa2] disabled:cursor-wait disabled:opacity-70"
          disabled={downloadBusy}
          type="button"
          onClick={onDownloadClick}
        >
          <Download size={18} aria-hidden />
        </button>
      ) : null}
      {onExpandClick ? (
        <button
          aria-label="Увеличить идею стилиста"
          className={["absolute top-3 z-20 flex size-9 items-center justify-center rounded-full bg-white/95 text-[#302637] shadow-md transition hover:bg-white hover:text-[#ff1fa2]", onDownloadClick ? "right-14" : "right-3"].join(" ")}
          type="button"
          onClick={onExpandClick}
        >
          <Maximize2 size={18} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
