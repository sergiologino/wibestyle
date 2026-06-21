import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type ErrorBoundaryProps } from "expo-router";
import { Feather } from "@expo/vector-icons";
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
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const POLL_MS = 2000;
const MAX_POLLS = 90;
const VIDEO_POLL_MS = 3000;
const VIDEO_MAX_POLLS = 60;

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
  const { api, accessToken, getAccessTokenForMedia } = useSession();
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(accessToken);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<SeasonHitVideoStatus>("none");
  const [afterVideoUrl, setAfterVideoUrl] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

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
        message: `Посмотри, как выглядит мой образ в VibeStyle: ${postUrl}`,
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
      if (err instanceof ApiError && err.code === "VIDEO_ELITE_REQUIRED") {
        router.push("/paywall?reason=elite_perk" as never);
        return;
      }
      setVideoError(err instanceof ApiError ? err.message : "Не удалось запустить создание видео");
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
          <Text style={styles.loadingText}>AI примеряет образ…</Text>
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
          <View style={styles.banner}>
            <Text style={styles.bannerTitle} numberOfLines={2}>{result.product.title || "Мой look"}</Text>
            {productMeta ? <Text style={styles.bannerMeta}>{productMeta}</Text> : null}
          </View>
        ) : null}

        <BeforeAfterSlider beforeSource={imageUris.before} afterSource={imageUris.after} height={480} />

        {videoStatus === "ready" && afterVideoUrl ? (
          <View style={styles.videoSection}>
            <Text style={styles.videoTitle}>Видео «Хит сезона»</Text>
            <AppVideoPlayer path={afterVideoUrl} accessToken={token} />
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
            <Button
              label="Создать видео"
              icon={<Feather name="video" size={18} color={colors.white} />}
              loading={videoGenerating}
              onPress={makeVideo}
            />
          ) : null}
          {videoStatus === "ready" && afterVideoUrl ? (
            <Button label="Видео в галерею" loading={saving} onPress={() => saveToGallery("video")} />
          ) : null}
          <Button label="Фото в галерею" variant="secondary" loading={saving} onPress={() => saveToGallery("image")} />
          <Button label="Поделиться" variant="secondary" loading={sharing} onPress={shareResult} />
          <Button label="Ещё примерка" onPress={() => router.push("/(main)/try-on")} />
        </View>
      </ScrollView>
    </Screen>
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
});
