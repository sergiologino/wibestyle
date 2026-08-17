import { useState } from "react";
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
} from "@wibestyle/shared-types";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { canStartGeneration } from "@/lib/onboarding-flow";
import { formatMarketplaceLinkError } from "@/lib/mobile-api";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const STEPS = ["Ссылка", "Размер", "Генерация"];

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

export default function TryOnLinkScreen() {
  const router = useRouter();
  const { api, profile, accessToken, ensureSession, refreshProfile } = useSession();
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<ProductPreview | null>(null);
  const [size, setSize] = useState("M");
  const [scenePreset, setScenePreset] = useState<TryOnScenePreset>("auto");
  const [customScene, setCustomScene] = useState("");
  const [sizeAdvice, setSizeAdvice] = useState<SizeAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    try {
      const sessionPayload = await api.createLinkTryOnSession(
        product.productUrl,
        product.sizes.length > 0 ? size : undefined,
        { scenePreset, customScene: scenePreset === "custom" ? customScene : undefined },
      );
      await api.generateTryOn(sessionPayload.session.id);
      await refreshProfile();
      router.replace(`/try-on/result/${sessionPayload.session.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось запустить примерку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.black} />
          </Pressable>

          <View style={styles.steps}>
            {STEPS.map((label, index) => (
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
              <Button label="Запустить AI-примерку" loading={loading} onPress={() => setStep(2)} />
              <Button label="Назад" variant="ghost" onPress={() => setStep(0)} />
            </>
          ) : null}

          {step === 2 && product ? (
            <>
              <DisplayTitle>Готовы?</DisplayTitle>
              <BodyText>{`Примерим «${product.title}» размер ${size}. Это займёт около минуты.`}</BodyText>
              <Button label="Примерить" loading={loading} onPress={generate} />
              <Button label="Изменить размер" variant="ghost" onPress={() => setStep(1)} />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
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
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
  },
});
