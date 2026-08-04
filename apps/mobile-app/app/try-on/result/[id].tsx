import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type ErrorBoundaryProps } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { ApiError } from "@wibestyle/api-client";
import type { SeasonHitVideoStatus, TryOnResult } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle } from "@/components/ui/Button";
import { BeforeAfterSlider } from "@/components/try-on/BeforeAfterSlider";
import { AppVideoPlayer } from "@/components/media/VideoPlayer";
import { formatTryOnError, resolveApiPath } from "@/lib/mobile-api";
import { getApiBaseUrl, getAppBaseUrl } from "@/lib/config";
import { buildPublicPostUrl, formatProductMeta } from "@/lib/result-display";
import {
  RUSTORE_REVIEW_URL,
  completeReviewPrompt,
  deferReviewPrompt,
  neverShowReviewPrompt,
  recordNegativeReviewFeedback,
  recordSuccessfulTryOnAndResolvePrompt,
  type ReviewFeedbackReason,
} from "@/lib/rustore-review-prompt";
import { trackMobileMarketingEvent } from "@/lib/marketing-visitor";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const POLL_MS = 2000;
const MAX_POLLS = 90;
const VIDEO_POLL_MS = 3000;
const VIDEO_MAX_POLLS = 60;

type ReviewPromptStep = "gate" | "rustore" | "feedback" | "thanks" | null;

const FEEDBACK_REASONS: Array<{ id: ReviewFeedbackReason; label: string }> = [
  { id: "bad_fit", label: "Плохо села одежда" },
  { id: "wrong_item", label: "Не та вещь" },
  { id: "slow_generation", label: "Долго генерируется" },
  { id: "photo_problem", label: "Проблема с фото" },
  { id: "other", label: "Другое" },
];

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.center}>
        <DisplayTitle>Не удалось открыть примерку</DisplayTitle>
        <BodyText>{error.message || "Произошла ошибка при отображении результата"}</BodyText>
        <Button label="Повторить" onPress={retry} />
        <Button label="На главную" variant="secondary" onPress={() => router.replace("/(main)/home")} />
      </View>
    </Screen>
  );
}

export default function TryOnResultScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { api, accessToken, getAccessTokenForMedia, profile } = useSession();
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(accessToken);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<"image" | "video" | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<SeasonHitVideoStatus>("none");
  const [afterVideoUrl, setAfterVideoUrl] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reviewPromptStep, setReviewPromptStep] = useState<ReviewPromptStep>(null);
  const [feedbackReason, setFeedbackReason] = useState<ReviewFeedbackReason>("bad_fit");

  useEffect(() => {
    void getAccessTokenForMedia().then(setToken);
  }, [getAccessTokenForMedia]);

  useEffect(() => {
    if (!sessionId) {
      setError("Некорректный идентификатор примерки");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let polls = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const payload = await api.getTryOnSession(sessionId);
        if (cancelled) return;

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
        polls += 1;
        if (polls >= MAX_POLLS) {
          setError("Примерка занимает больше времени, чем обычно. Попробуйте открыть её позже.");
          setLoading(false);
          return;
        }
        timer = setTimeout(poll, POLL_MS);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Не удалось загрузить результат");
          setLoading(false);
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [api, sessionId]);

  useEffect(() => {
    if (!sessionId || videoStatus !== "generating") return;

    let cancelled = false;
    let polls = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function pollVideo() {
      try {
        const payload = await api.getTryOnSession(sessionId);
        if (cancelled) return;
        const nextStatus = payload.result?.videoStatus ?? payload.session.videoStatus ?? "none";

        if (nextStatus === "ready") {
          setAfterVideoUrl(payload.result?.afterVideoUrl ?? payload.session.afterVideoUrl ?? null);
          setVideoStatus("ready");
          setVideoGenerating(false);
          setVideoError(null);
          if (payload.result) setResult(payload.result);
          return;
        }
        if (nextStatus === "failed") {
          setVideoStatus("failed");
          setVideoGenerating(false);
          setVideoError(payload.session.videoErrorMessage ?? "Не удалось создать видео");
          return;
        }
        polls += 1;
        if (polls >= VIDEO_MAX_POLLS) {
          setVideoGenerating(false);
          setVideoError("Видео создаётся дольше обычного. Откройте примерку позднее.");
          return;
        }
        timer = setTimeout(pollVideo, VIDEO_POLL_MS);
      } catch {
        if (!cancelled) {
          setVideoGenerating(false);
          setVideoError("Не удалось проверить статус видео");
        }
      }
    }

    void pollVideo();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [api, sessionId, videoStatus]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!sessionId || !result) return;
    let active = true;
    void recordSuccessfulTryOnAndResolvePrompt(sessionId, profile?.plan).then(({ shouldShowGate }) => {
      if (!active || !shouldShowGate) return;
      setReviewPromptStep("gate");
      void trackMobileMarketingEvent("review_gate_shown", {
        try_on_count_source: "successful_result",
        subscription_status: profile?.plan ?? "trial",
        trigger_source: "successful_try_on_count",
      });
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [profile?.plan, result, sessionId]);

  useEffect(() => {
    const product = result?.product;
    if (!product?.marketplace || !product.id) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    void api.listFavorites().then(({ items }) => {
      if (cancelled) return;
      setIsFavorite(items.some((item) => item.marketplace === product.marketplace && item.externalProductId === product.id));
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, result?.product]);

  const imageUris = useMemo(() => {
    if (!result || !token) return { before: null, after: null };
    const base = getApiBaseUrl();
    const headers = { Authorization: `Bearer ${token}` };
    return {
      before: result.beforeImageUrl ? { uri: resolveApiPath(base, result.beforeImageUrl), headers } : null,
      after: result.afterImageUrl ? { uri: resolveApiPath(base, result.afterImageUrl), headers } : null,
    };
  }, [result, token]);

  const productMeta = useMemo(() => {
    if (!result?.product) return "";
    return formatProductMeta({
      brand: result.product.brand,
      priceRub: result.product.priceRub,
      selectedSize: result.selectedSize,
    });
  }, [result]);

  async function saveToGallery(mediaType: "image" | "video" = "image") {
    if (!sessionId) return;
    setSaving(true);
    try {
      await api.createGalleryPost({
        tryOnSessionId: sessionId,
        visibility: "public",
        productLinkVisible: true,
        mediaType,
      });
    } finally {
      setSaving(false);
    }
  }

  async function shareResult() {
    if (!result || !sessionId || sharing) return;
    setSharing(true);
    setShareError(null);
    try {
      const { post } = await api.createGalleryPost({
        tryOnSessionId: sessionId,
        visibility: "unlisted",
        productLinkVisible: true,
        productVisibility: "SHOW_PRODUCT_LINK",
        mediaType: "image",
      });
      const postUrl = buildPublicPostUrl({
        appBaseUrl: getAppBaseUrl(),
        publicUrl: post.publicUrl,
        slug: post.slug,
      });
      await Share.share({
        title: "Моя примерка в VibeStyle",
        message: postUrl,
        url: postUrl,
      });
    } catch (err) {
      setShareError(err instanceof ApiError ? err.message : "Не удалось подготовить ссылку на примерку");
    } finally {
      setSharing(false);
    }
  }

  async function makeVideo() {
    if (!sessionId || videoGenerating) return;
    setVideoError(null);
    try {
      const { entitlements } = await api.getEntitlements();
      if (!entitlements.videoTryOn) {
        router.push("/paywall?reason=elite_perk" as never);
        return;
      }
    } catch {
      router.push("/paywall?reason=elite_perk" as never);
      return;
    }

    setVideoGenerating(true);
    setVideoStatus("generating");
    try {
      const response = await api.generateSeasonHitVideo(sessionId);
      setVideoStatus(response.videoStatus);
      if (response.afterVideoUrl) setAfterVideoUrl(response.afterVideoUrl);
      if (response.videoStatus === "ready") setVideoGenerating(false);
    } catch (err) {
      setVideoGenerating(false);
      setVideoStatus("none");
      if (
        err instanceof ApiError
        && (err.code === "VIDEO_ELITE_REQUIRED" || err.code === "VIDEO_TRIAL_EXHAUSTED")
      ) {
        router.push("/paywall?reason=elite_perk" as never);
        return;
      }
      setVideoError(err instanceof ApiError ? err.message : "Не удалось запустить создание видео");
    }
  }

  async function toggleFavorite() {
    const product = result?.product;
    if (!product?.marketplace || !product.id || !sessionId) {
      return;
    }
    setFavoriteLoading(true);
    setShareError(null);
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
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function openProductCard() {
    const productUrl = result?.product?.productUrl;
    if (!productUrl) return;
    try {
      await Linking.openURL(productUrl);
    } catch {
      setShareError("Не удалось открыть карточку товара");
    }
  }

  async function downloadBranded(type: "image" | "video") {
    if (!sessionId || !token) return;
    setDownloading(type); setShareError(null); setDownloadNotice(null);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) throw new Error("MEDIA_PERMISSION_DENIED");
      const extension = type === "video" ? "mp4" : "png";
      const target = `${FileSystem.cacheDirectory}vibestyle-${sessionId}.${extension}`;
      const response = await FileSystem.downloadAsync(
        `${getApiBaseUrl()}/api/v1/try-on/sessions/${sessionId}/download?type=${type}`,
        target,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await MediaLibrary.saveToLibraryAsync(response.uri);
      setDownloadNotice(type === "video" ? "Видео сохранено на устройство" : "Фото сохранено на устройство");
    } catch {
      setShareError(type === "video" ? "Не удалось скачать видео." : "Не удалось скачать фото.");
    } finally { setDownloading(null); }
  }

  function closeReviewPrompt() {
    setReviewPromptStep(null);
  }

  async function postponeReviewPrompt() {
    await deferReviewPrompt();
    void trackMobileMarketingEvent("review_prompt_later", {
      subscription_status: profile?.plan ?? "trial",
    });
    closeReviewPrompt();
  }

  async function dismissReviewPromptForever() {
    await neverShowReviewPrompt();
    void trackMobileMarketingEvent("review_prompt_never", {
      subscription_status: profile?.plan ?? "trial",
    });
    closeReviewPrompt();
  }

  async function openRuStoreReview() {
    await completeReviewPrompt();
    void trackMobileMarketingEvent("review_prompt_open_rustore", {
      subscription_status: profile?.plan ?? "trial",
      trigger_source: "successful_try_on_count",
    });
    closeReviewPrompt();
    try {
      await Linking.openURL(RUSTORE_REVIEW_URL);
    } catch {
      setShareError("Не удалось открыть RuStore. Откройте страницу приложения вручную.");
    }
  }

  function choosePositiveReviewGate() {
    setReviewPromptStep("rustore");
    void trackMobileMarketingEvent("review_gate_positive", {
      subscription_status: profile?.plan ?? "trial",
    });
    void trackMobileMarketingEvent("review_prompt_shown", {
      subscription_status: profile?.plan ?? "trial",
      trigger_source: "successful_try_on_count",
    });
  }

  function chooseNegativeReviewGate() {
    setReviewPromptStep("feedback");
    void trackMobileMarketingEvent("review_gate_negative", {
      subscription_status: profile?.plan ?? "trial",
    });
  }

  async function submitReviewFeedback() {
    await recordNegativeReviewFeedback(feedbackReason);
    void trackMobileMarketingEvent("review_feedback_submitted", {
      reason: feedbackReason,
      subscription_status: profile?.plan ?? "trial",
    });
    setReviewPromptStep("thanks");
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
          <Text style={styles.loadingText}>Нейростилист собирает ваш образ…</Text>
          <BodyText>Обычно это занимает до минуты.</BodyText>
        </View>
      </Screen>
    );
  }

  if (error || !result) {
    return (
      <Screen>
        <View style={styles.center}>
          <DisplayTitle>Не получилось</DisplayTitle>
          <BodyText>{error ?? "Результат примерки недоступен"}</BodyText>
          <Button label="На главную" onPress={() => router.replace("/(main)/home")} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>

        {result.product ? (
          <Pressable
            accessibilityRole={result.product.productUrl ? "link" : "button"}
            accessibilityLabel="Открыть карточку товара"
            style={({ pressed }) => [styles.banner, pressed && result.product?.productUrl ? styles.bannerPressed : null]}
            onPress={openProductCard}
          >
            <Text style={styles.bannerTitle} numberOfLines={2}>{result.product.title || "Мой look"}</Text>
            {productMeta ? <Text style={styles.bannerMeta}>{productMeta}</Text> : null}
          </Pressable>
        ) : null}

        <BeforeAfterSlider beforeSource={imageUris.before} afterSource={imageUris.after} height={480} />
        <Button label="Скачать фото" variant="secondary" loading={downloading === "image"} onPress={() => void downloadBranded("image")} />

        {videoStatus === "ready" && afterVideoUrl ? (
          <View style={styles.videoSection}>
            <Text style={styles.videoTitle}>Видео «Хит сезона»</Text>
            <AppVideoPlayer path={afterVideoUrl} accessToken={token} />
            <Button label="Скачать видео" variant="secondary" loading={downloading === "video"} onPress={() => void downloadBranded("video")} />
          </View>
        ) : null}

        {videoStatus === "generating" || videoGenerating ? (
          <View style={styles.videoStatusCard}>
            <ActivityIndicator color={colors.violet} />
            <View style={styles.videoStatusCopy}>
              <Text style={styles.videoTitle}>Создаём видео</Text>
              <BodyText>Подбираем движение и локацию. Это может занять несколько минут.</BodyText>
            </View>
          </View>
        ) : null}

        {videoError ? <Text style={styles.videoError}>{videoError}</Text> : null}
        {downloadNotice ? <Text style={styles.downloadNotice}>{downloadNotice}</Text> : null}
        {shareError ? <Text style={styles.videoError}>{shareError}</Text> : null}

        {result.styleCompliment ? (
          <View style={styles.complimentCard}>
            <Text style={styles.complimentLabel}>Комментарий стилиста</Text>
            <Text style={styles.complimentText}>{result.styleCompliment}</Text>
          </View>
        ) : null}

        {result.sizeFitMessage ? <Text style={styles.fit}>{result.sizeFitMessage}</Text> : null}

        <View style={styles.actions}>
          {videoStatus !== "ready" && videoStatus !== "generating" ? (
            <View style={styles.primaryActionRow}>
              {result.product ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                  disabled={favoriteLoading}
                  style={({ pressed }) => [
                    styles.heartButton,
                    pressed && styles.heartButtonPressed,
                    favoriteLoading && styles.disabledAction,
                  ]}
                  onPress={toggleFavorite}
                >
                  <Text style={styles.heartIcon}>{isFavorite ? "♥" : "♡"}</Text>
                </Pressable>
              ) : null}
              <Button
                label="Создать видео"
                icon={<Feather name="video" size={18} color={colors.white} />}
                loading={videoGenerating}
                onPress={makeVideo}
                style={styles.videoButton}
              />
            </View>
          ) : null}
          {videoStatus !== "ready" && videoStatus !== "generating" ? (
            <BodyText>В trial доступно одно бесплатное видео. В Elite — видео к каждой примерке.</BodyText>
          ) : null}
          {videoStatus === "ready" && afterVideoUrl ? (
            <Button label="Видео в галерею" loading={saving} onPress={() => saveToGallery("video")} />
          ) : null}
          <Button label="Поделиться в галерее" variant="secondary" loading={saving} onPress={() => saveToGallery("image")} />
          <Button label="Поделиться" variant="secondary" loading={sharing} onPress={shareResult} />
          <Button label="Ещё примерка" onPress={() => router.push("/(main)/try-on")} />
        </View>
      </ScrollView>
      <ReviewPromptModal
        step={reviewPromptStep}
        feedbackReason={feedbackReason}
        onFeedbackReasonChange={setFeedbackReason}
        onClose={closeReviewPrompt}
        onPositive={choosePositiveReviewGate}
        onNegative={chooseNegativeReviewGate}
        onOpenRuStore={openRuStoreReview}
        onLater={postponeReviewPrompt}
        onNever={dismissReviewPromptForever}
        onSubmitFeedback={submitReviewFeedback}
      />
    </Screen>
  );
}

function ReviewPromptModal({
  step,
  feedbackReason,
  onFeedbackReasonChange,
  onClose,
  onPositive,
  onNegative,
  onOpenRuStore,
  onLater,
  onNever,
  onSubmitFeedback,
}: {
  step: ReviewPromptStep;
  feedbackReason: ReviewFeedbackReason;
  onFeedbackReasonChange: (reason: ReviewFeedbackReason) => void;
  onClose: () => void;
  onPositive: () => void;
  onNegative: () => void;
  onOpenRuStore: () => void;
  onLater: () => void;
  onNever: () => void;
  onSubmitFeedback: () => void;
}) {
  return (
    <Modal visible={step !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {step === "gate" ? (
            <>
              <Text style={styles.modalTitle}>Как тебе результат примерки?</Text>
              <Text style={styles.modalText}>
                Нам важно понимать, получился ли образ полезным перед тем, как просить публичный отзыв.
              </Text>
              <View style={styles.modalActions}>
                <Button label="Выглядит хорошо" onPress={onPositive} />
                <Button label="Есть проблема" variant="secondary" onPress={onNegative} />
              </View>
            </>
          ) : null}

          {step === "rustore" ? (
            <>
              <Text style={styles.modalTitle}>Твой опыт может помочь другим</Text>
              <Text style={styles.modalText}>
                Ты уже попробовала Vibe — теперь твой опыт может помочь другим выбрать приложение.
              </Text>
              <Text style={styles.modalText}>
                Оставь честный отзыв в RuStore: что понравилось, что удивило или что стоит улучшить.
              </Text>
              <View style={styles.modalActions}>
                <Button label="Оставить отзыв" onPress={onOpenRuStore} />
                <Button label="Позже" variant="secondary" onPress={onLater} />
                <Pressable accessibilityRole="button" onPress={onNever} style={styles.textButton}>
                  <Text style={styles.textButtonLabel}>Больше не показывать</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {step === "feedback" ? (
            <>
              <Text style={styles.modalTitle}>Что пошло не так?</Text>
              <Text style={styles.modalText}>Выбери основную причину — мы учтём это в следующих обновлениях.</Text>
              <View style={styles.feedbackOptions}>
                {FEEDBACK_REASONS.map((reason) => (
                  <Pressable
                    key={reason.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: feedbackReason === reason.id }}
                    style={[
                      styles.feedbackOption,
                      feedbackReason === reason.id && styles.feedbackOptionActive,
                    ]}
                    onPress={() => onFeedbackReasonChange(reason.id)}
                  >
                    <Text
                      style={[
                        styles.feedbackOptionText,
                        feedbackReason === reason.id && styles.feedbackOptionTextActive,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.modalActions}>
                <Button label="Отправить" onPress={onSubmitFeedback} />
                <Button label="Закрыть" variant="secondary" onPress={onClose} />
              </View>
            </>
          ) : null}

          {step === "thanks" ? (
            <>
              <Text style={styles.modalTitle}>Спасибо</Text>
              <Text style={styles.modalText}>Мы сохранили обратную связь и не будем отправлять тебя в RuStore после этого результата.</Text>
              <Button label="Понятно" onPress={onClose} />
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 18,
    color: colors.black,
    marginTop: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  bannerPressed: {
    opacity: 0.82,
  },
  bannerTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: colors.black,
    lineHeight: 22,
  },
  bannerMeta: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  fit: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: colors.violet,
    lineHeight: 20,
  },
  complimentCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  complimentLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.eyebrow,
  },
  complimentText: {
    marginTop: spacing.sm,
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: colors.black,
  },
  videoSection: {
    gap: spacing.sm,
  },
  videoStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  videoStatusCopy: {
    flex: 1,
  },
  videoTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: colors.black,
  },
  videoError: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.pink,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heartButton: {
    width: 54,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.danger,
    backgroundColor: colors.white,
  },
  heartButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  heartIcon: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 28,
    lineHeight: 30,
    color: colors.danger,
  },
  disabledAction: {
    opacity: 0.55,
  },
  videoButton: {
    flex: 1,
  },
  downloadNotice: { fontFamily: "Manrope_500Medium", fontSize: 14, color: colors.violet, backgroundColor: colors.pinkBg, padding: spacing.sm, borderRadius: radius.lg },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 14, 22, 0.42)",
  },
  modalCard: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.white,
  },
  modalTitle: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    color: colors.black,
  },
  modalText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  modalActions: {
    gap: spacing.sm,
  },
  textButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonLabel: {
    fontFamily: "Manrope_500Medium",
    color: colors.muted,
  },
  feedbackOptions: {
    gap: spacing.sm,
  },
  feedbackOption: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  feedbackOptionActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  feedbackOptionText: {
    fontFamily: "Manrope_500Medium",
    color: colors.black,
  },
  feedbackOptionTextActive: {
    color: colors.pink,
  },
});
