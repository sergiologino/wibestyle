import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  TRY_ON_SCENE_PRESETS,
  extractMarketplaceUrl,
  type ProductPreview,
  type SizeAdvice,
  type TryOnScenePreset,
  type UserProfile,
} from "@wibestyle/shared-types";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { canStartGeneration } from "@/lib/onboarding-flow";
import { HAIRSTYLES, HAIRSTYLE_LENGTH_LABELS, type HairstyleLength } from "@/lib/hairstyle-catalog";
import { HAIR_COLOR_ATTRIBUTION, type HairColor } from "@/lib/hair-color-catalog";
import { saveHairstyleHistory } from "@/lib/hairstyle-history";
import { formatMarketplaceLinkError, formatTryOnError } from "@/lib/mobile-api";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const BASE_STEPS = ["Ссылка", "Размер", "Генерация"];
const STYLIST_STEPS = ["Ссылка", "Размер", "Волосы"];
const HAIR_FILTERS: Array<HairstyleLength | "all"> = ["all", "short", "medium", "long", "styling"];
const hairstyleImagePath = (styleId: string) => `/api/v1/hairstyles/${styleId}/image`;
const STRIKE_POLL_MS = 2000;
const STRIKE_MAX_POLLS = 90;

const SIZE_WARNING_LABELS: Record<string, string> = {
  SIZE_MAY_BE_TIGHT: "Выбранный размер может быть маловат. Проверь размерную сетку или попробуй размер больше.",
  SIZE_NOT_AVAILABLE: "Выбранного размера нет в карточке товара.",
  RUNS_SMALL: "По отзывам вещь может маломерить. Проверь размерную сетку перед покупкой.",
};

function formatSizeAdvice(advice: SizeAdvice) {
  const readableReasons = advice.reasons.filter((reason) => !/^[A-Z0-9_]+$/.test(reason));
  if (readableReasons.length > 0) return readableReasons.join(" ");
  return advice.warnings.map((warning) => SIZE_WARNING_LABELS[warning] ?? warning).join(" ");
}

function hasEnoughGenerationsForStrike(profile: UserProfile | null | undefined) {
  if (!profile) return false;
  if (profile.plan === "wibe" || profile.plan === "elite") {
    return (profile.planGenerationsLeft ?? 2) + (profile.bonusGenerationsLeft ?? 0) >= 2;
  }
  return profile.trialGenerationsLeft + (profile.bonusGenerationsLeft ?? 0) >= 2;
}

function formatStrikeTryOnError(err: unknown) {
  if (err instanceof ApiError && err.status === 404) {
    return "Не удалось запустить примерку прически: сервер не нашёл маршрут combo-примерки. Обновите backend и попробуйте снова.";
  }
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Не удалось запустить примерку";
}

export default function TryOnLinkScreen() {
  const router = useRouter();
  const { api, profile, accessToken, ensureSession, refreshProfile } = useSession();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<ProductPreview | null>(null);
  const [size, setSize] = useState("M");
  const [scenePreset, setScenePreset] = useState<TryOnScenePreset>("auto");
  const [customScene, setCustomScene] = useState("");
  const [hairFilter, setHairFilter] = useState<HairstyleLength | "all">("all");
  const [styleId, setStyleId] = useState<string | null>(null);
  const [colorId, setColorId] = useState<string | null>(null);
  const [hairColors, setHairColors] = useState<HairColor[]>([]);
  const [sizeAdvice, setSizeAdvice] = useState<SizeAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stylistStrikeAvailable = Boolean(profile?.stylistAvailable);
  const steps = stylistStrikeAvailable ? STYLIST_STEPS : BASE_STEPS;
  const selectedHairChange = Boolean(styleId || colorId);
  const visibleHairstyles = useMemo(
    () => HAIRSTYLES.filter((item) => hairFilter === "all" || item.length === hairFilter),
    [hairFilter],
  );

  useEffect(() => {
    if (!stylistStrikeAvailable) return;
    let cancelled = false;
    void api.getHairColorCatalog()
      .then((result) => {
        if (!cancelled) setHairColors(result.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, stylistStrikeAvailable]);

  async function parseLink() {
    setError(null);
    setLoading(true);
    try {
      const ok = await ensureSession();
      if (!ok) {
        router.replace("/auth");
        return;
      }
      const normalizedUrl = extractMarketplaceUrl(url);
      setUrl(normalizedUrl);
      const payload = await api.parseLink(normalizedUrl);
      setProduct(payload.product);
      setSize(payload.product.suggestedSize ?? payload.product.sizes[0] ?? "");
      setStep(1);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? formatMarketplaceLinkError(err.code)
          : "Не удалось разобрать ссылку",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSizeAdvice(nextSize: string) {
    if (!product) return;
    try {
      const payload = await api.getSizeAdvice({
        marketplace: product.marketplace,
        productUrl: product.productUrl,
        selectedSize: nextSize,
        availableSizes: product.sizes,
      });
      setSizeAdvice(payload.advice);
    } catch {
      setSizeAdvice(null);
    }
  }

  async function generate() {
    if (!product) return;
    if (profile && !canStartGeneration(profile)) {
      router.push("/paywall");
      return;
    }
    if (selectedHairChange && !hasEnoughGenerationsForStrike(profile)) {
      router.push("/paywall");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sessionPayload = await api.createLinkTryOnSession(
        product.productUrl,
        product.sizes.length > 0 ? size : undefined,
        { scenePreset, customScene: scenePreset === "custom" ? customScene : undefined },
      );
      await api.generateTryOn(sessionPayload.session.id);
      if (selectedHairChange) {
        await waitForClothingResult(sessionPayload.session.id);
        const hairResult = await api.createHairstyleTryOnFromSession(sessionPayload.session.id, styleId, colorId);
        if (profile?.userId) {
          const styleTitle = HAIRSTYLES.find((item) => item.id === styleId)?.title;
          const colorTitle = hairColors.find((item) => item.id === colorId)?.title;
          await saveHairstyleHistory(profile.userId, {
            id: hairResult.session?.id ?? hairResult.id,
            styleId: styleId ?? "color-only",
            colorId: colorId ?? null,
            title: [styleTitle, colorTitle].filter(Boolean).join(" + ") || "Цвет волос",
            imagePath: hairResult.afterImageUrl,
            createdAt: new Date().toISOString(),
          });
        }
        await refreshProfile();
        router.replace(`/try-on/result/${hairResult.session?.id ?? hairResult.id}`);
        return;
      }
      await refreshProfile();
      router.replace(`/try-on/result/${sessionPayload.session.id}`);
    } catch (err) {
      setError(formatStrikeTryOnError(err));
    } finally {
      setLoading(false);
    }
  }

  async function waitForClothingResult(sessionId: string) {
    for (let poll = 0; poll < STRIKE_MAX_POLLS; poll += 1) {
      const payload = await api.getTryOnSession(sessionId);
      if (payload.result || payload.session.status === "ready") {
        return;
      }
      if (payload.session.status === "failed") {
        throw new Error(formatTryOnError(payload.session));
      }
      await new Promise((resolve) => setTimeout(resolve, STRIKE_POLL_MS));
    }
    throw new Error("Примерка вещи занимает больше времени, чем обычно. Откройте результат позднее.");
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.black} />
          </Pressable>

          <View style={styles.steps}>
            {steps.map((label, index) => (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, index <= step && styles.stepDotActive]} />
                <Text style={[styles.stepLabel, index <= step && styles.stepLabelActive]}>{label}</Text>
              </View>
            ))}
          </View>

          {step === 0 ? (
            <>
              <Eyebrow>Маркетплейс</Eyebrow>
              <DisplayTitle>Ссылка на товар</DisplayTitle>
              <BodyText>Вставь URL карточки Wildberries или Ozon.</BodyText>
              <TextField
                placeholder="https://www.wildberries.ru/..."
                value={url}
                onChangeText={(value) => setUrl(extractMarketplaceUrl(value))}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button label="Подтянуть вещь" loading={loading} onPress={parseLink} />
            </>
          ) : null}

          {step === 1 && product ? (
            <>
              <AuthenticatedImage
                path={product.imageUrl}
                accessToken={accessToken}
                style={styles.productImage}
                contentFit="cover"
              />
              <Text style={styles.productTitle}>{product.title}</Text>
              <Text style={styles.productMeta}>
                {product.brand} · {product.priceRub.toLocaleString("ru-RU")} ₽
              </Text>
              <Text style={styles.sizeLabel}>Размер</Text>
              <View style={styles.sizeRow}>
                {product.sizes.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.sizePill, size === item && styles.sizePillActive]}
                    onPress={() => {
                      setSize(item);
                      void loadSizeAdvice(item);
                    }}
                  >
                    <Text style={[styles.sizeText, size === item && styles.sizeTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              {product.sizes.length === 0 ? (
                <Text style={styles.advice}>Магазин не отдал список размеров. Примерку можно запустить без выбора размера.</Text>
              ) : null}
              {sizeAdvice?.warnings.length ? (
                <Text style={styles.advice}>{formatSizeAdvice(sizeAdvice)}</Text>
              ) : null}
              <Text style={styles.sizeLabel}>Сцена и поза</Text>
              <View style={styles.sizeRow}>
                {[...TRY_ON_SCENE_PRESETS, { id: "custom" as const, label: "Свой вариант", description: "Опишите сцену сами" }].map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.scenePill, scenePreset === item.id && styles.sizePillActive]}
                    onPress={() => setScenePreset(item.id)}
                  >
                    <Text style={[styles.sizeText, scenePreset === item.id && styles.sizeTextActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              {scenePreset === "custom" ? (
                <TextField
                  placeholder="Например: светлая студия, поза немного боком"
                  value={customScene}
                  onChangeText={setCustomScene}
                />
              ) : null}
              <Button
                label={stylistStrikeAvailable ? "Дальше: прическа" : "Запустить AI-примерку"}
                loading={loading}
                onPress={stylistStrikeAvailable ? () => setStep(2) : generate}
              />
              <Button label="Назад" variant="ghost" onPress={() => setStep(0)} />
            </>
          ) : null}

          {step === 2 && product && stylistStrikeAvailable ? (
            <>
              <Eyebrow>Фокус-группа стилиста</Eyebrow>
              <DisplayTitle>Прическа к образу</DisplayTitle>
              <BodyText>
                Можно оставить волосы как есть или сразу примерить вещь и обновить прическу. С прической спишем 2 примерки.
              </BodyText>

              <Text style={styles.sizeLabel}>Прическа</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {HAIR_FILTERS.map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.filterPill, hairFilter === item && styles.sizePillActive]}
                    onPress={() => setHairFilter(item)}
                  >
                    <Text style={[styles.sizeText, hairFilter === item && styles.sizeTextActive]}>{HAIRSTYLE_LENGTH_LABELS[item]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.hairGrid}>
                <ChoiceTile title="Не меняю" subtitle="Оставить форму" selected={!styleId} onPress={() => setStyleId(null)} />
                {visibleHairstyles.map((style) => (
                  <Pressable
                    key={style.id}
                    style={({ pressed }) => [styles.hairCard, styleId === style.id && styles.hairCardActive, pressed && styles.hairCardPressed]}
                    onPress={() => setStyleId(style.id)}
                  >
                    <AuthenticatedImage
                      path={hairstyleImagePath(style.id)}
                      accessToken={null}
                      style={styles.hairImage}
                      contentFit="cover"
                    />
                    <View style={styles.hairCopy}>
                      <Text style={styles.hairTitle} numberOfLines={2}>{style.title}</Text>
                      <Text style={styles.hairDescription} numberOfLines={2}>{style.description}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sizeLabel}>Цвет волос</Text>
              <View style={styles.hairGrid}>
                <ChoiceTile title="Не меняю" subtitle="Оставить цвет" selected={!colorId} onPress={() => setColorId(null)} />
                {hairColors.map((color) => (
                  <Pressable
                    key={color.id}
                    style={({ pressed }) => [styles.hairCard, colorId === color.id && styles.hairCardActive, pressed && styles.hairCardPressed]}
                    onPress={() => setColorId(color.id)}
                  >
                    <AuthenticatedImage
                      path={color.imageUrl}
                      accessToken={null}
                      style={styles.hairImage}
                      contentFit="cover"
                    />
                    <View style={styles.hairCopy}>
                      <Text style={styles.hairTitle} numberOfLines={2}>{color.title}</Text>
                      <Text style={styles.hairDescription} numberOfLines={2}>{color.family}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.attribution}>{HAIR_COLOR_ATTRIBUTION}</Text>
              <Button
                label={selectedHairChange ? "Примерить образ и прическу" : "Примерить только вещь"}
                loading={loading}
                onPress={generate}
              />
              <Button label="Изменить вещь" variant="ghost" onPress={() => setStep(1)} />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ChoiceTile({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.choiceTile, selected && styles.hairCardActive, pressed && styles.hairCardPressed]} onPress={onPress}>
      <Feather name="minus-circle" size={22} color={selected ? colors.pink : colors.muted} />
      <Text style={styles.hairTitle}>{title}</Text>
      <Text style={styles.hairDescription}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  stepDotActive: {
    backgroundColor: colors.pink,
  },
  stepLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    color: colors.eyebrow,
  },
  stepLabelActive: {
    color: colors.pink,
    fontFamily: "Manrope_500Medium",
  },
  productImage: {
    width: "100%",
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: colors.pinkBg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  productTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 17,
    color: colors.black,
    lineHeight: 22,
  },
  productMeta: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: colors.muted,
  },
  sizeLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.black,
    marginTop: spacing.sm,
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sizePill: {
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  scenePill: {
    minWidth: 76,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  sizePillActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  sizeText: {
    fontFamily: "Manrope_500Medium",
    color: colors.muted,
  },
  sizeTextActive: {
    color: colors.pink,
  },
  advice: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.violet,
    lineHeight: 18,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  hairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  hairCard: {
    width: "47%",
    overflow: "hidden",
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  choiceTile: {
    width: "47%",
    minHeight: 168,
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    padding: spacing.md,
    justifyContent: "flex-end",
    gap: 6,
  },
  hairCardActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  hairCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  hairImage: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: colors.pinkBg,
  },
  hairCopy: {
    padding: spacing.sm,
    gap: 5,
  },
  hairTitle: {
    color: colors.black,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    lineHeight: 19,
  },
  hairDescription: {
    color: colors.muted,
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  attribution: {
    color: colors.muted,
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
  },
});
