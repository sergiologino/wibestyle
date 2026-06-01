import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { TryOnResult } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle } from "@/components/ui/Button";
import { BeforeAfterSlider } from "@/components/try-on/BeforeAfterSlider";
import { formatTryOnError, resolveApiPath } from "@/lib/mobile-api";
import { getApiBaseUrl } from "@/lib/config";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const POLL_MS = 2000;
const MAX_POLLS = 90;

export default function TryOnResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { api, accessToken, getAccessTokenForMedia } = useSession();
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(accessToken);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getAccessTokenForMedia().then(setToken);
  }, [getAccessTokenForMedia]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let polls = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const payload = await api.getTryOnSession(id);
        if (cancelled) return;

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
        polls += 1;
        if (polls >= MAX_POLLS) {
          setError("Примерка занимает больше времени, чем обычно. Попробуй обновить позже.");
          setLoading(false);
          return;
        }
        timer = setTimeout(poll, POLL_MS);
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить результат");
          setLoading(false);
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [api, id]);

  const imageUris = useMemo(() => {
    if (!result || !token) return { before: null, after: null };
    const base = getApiBaseUrl();
    const headers = { Authorization: `Bearer ${token}` };
    return {
      before: { uri: resolveApiPath(base, result.beforeImageUrl), headers },
      after: { uri: resolveApiPath(base, result.afterImageUrl), headers },
    };
  }, [result, token]);

  async function saveToGallery() {
    if (!id) return;
    setSaving(true);
    try {
      await api.createGalleryPost({
        tryOnSessionId: id,
        visibility: "public",
        productLinkVisible: true,
      });
    } finally {
      setSaving(false);
    }
  }

  async function shareResult() {
    if (!result) return;
    await Share.share({
      message: `Мой образ в WibeStyle — примерь и ты! ${result.product?.productUrl ?? ""}`,
    });
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

  if (error) {
    return (
      <Screen>
        <View style={styles.center}>
          <DisplayTitle>Не получилось</DisplayTitle>
          <BodyText>{error}</BodyText>
          <Button label="На главную" onPress={() => router.replace("/(main)/home")} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>

        {result?.product ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {result.product.title}
            </Text>
            <Text style={styles.bannerMeta}>
              {result.product.brand} · {result.product.priceRub.toLocaleString("ru-RU")} ₽
              {result.selectedSize ? ` · ${result.selectedSize}` : ""}
            </Text>
          </View>
        ) : null}

        <BeforeAfterSlider
          beforeSource={imageUris.before}
          afterSource={imageUris.after}
          height={480}
        />

        {result?.sizeFitMessage ? <Text style={styles.fit}>{result.sizeFitMessage}</Text> : null}

        <View style={styles.actions}>
          <Button label="В галерею" variant="secondary" loading={saving} onPress={saveToGallery} />
          <Button label="Поделиться" variant="secondary" onPress={shareResult} />
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
  actions: {
    gap: spacing.sm,
  },
});
