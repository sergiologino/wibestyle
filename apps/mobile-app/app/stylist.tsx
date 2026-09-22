import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ApiError } from "@wibestyle/api-client";
import type { StylistLookResponse, StylistPreset, StylistProductCandidate, StylistVariant } from "@wibestyle/shared-types";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, Card, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { useSession } from "@/context/SessionProvider";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function StylistScreen() {
  const router = useRouter();
  const { api, profile, accessToken } = useSession();
  const [presets, setPresets] = useState<StylistPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customEventDescription, setCustomEventDescription] = useState("");
  const [eventPickerOpen, setEventPickerOpen] = useState(true);
  const [look, setLook] = useState<StylistLookResponse | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [removedProductIds, setRemovedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [regeneratingVariantId, setRegeneratingVariantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!profile?.stylistAvailable) return;
    let active = true;
    void api.listStylistPresets()
      .then((payload) => {
        if (!active) return;
        setPresets(payload.items);
        setSelectedPresetId((current) => current ?? payload.items[0]?.id ?? null);
      })
      .catch(() => {
        if (active) setError("Не удалось загрузить сценарии стилиста.");
      });
    return () => {
      active = false;
    };
  }, [api, profile?.stylistAvailable]);

  useEffect(() => {
    const sessionId = look?.sessionId;
    if (!sessionId) return;
    const pending = look.variants.some((variant) => variant.previewStatus === "queued" || variant.previewStatus === "generating");
    if (!pending) return;
    const timeout = setTimeout(() => {
      void api.getStylistLook(sessionId)
        .then((payload) => {
          setLook(payload);
          setSelectedVariantId((current) => current ?? payload.selectedVariantId ?? payload.variants[0]?.id ?? null);
        })
        .catch(() => undefined);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [api, look]);

  const selectedVariant = useMemo(
    () => look?.variants.find((variant) => variant.id === selectedVariantId) ?? look?.variants[0] ?? null,
    [look, selectedVariantId],
  );
  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) ?? null,
    [presets, selectedPresetId],
  );
  const canCreateLook = Boolean(selectedPresetId) && (selectedPresetId !== "custom" || customEventDescription.trim().length >= 6);

  async function createLook() {
    if (!selectedPresetId || !canCreateLook) return;
    setLoading(true);
    setError(null);
    setLook(null);
    setSelectedVariantId(null);
    setRemovedProductIds(new Set());
    setEventPickerOpen(false);
    try {
      const payload = await api.createStylistLook(
        selectedPresetId,
        selectedPresetId === "custom" ? customEventDescription.trim() : undefined,
      );
      setLook(payload);
      setSelectedVariantId(payload.selectedVariantId ?? payload.variants[0]?.id ?? null);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 190, animated: true }), 50);
    } catch (err) {
      setError(err instanceof ApiError && (err.code === "INSUFFICIENT_GENERATIONS" || err.status === 402)
        ? "Примерки закончились. Пополните лимит или оформите подписку."
        : err instanceof Error && err.message === "INVALID_CUSTOM_STYLIST_EVENT"
          ? "Опишите свое событие чуть подробнее."
        : "Не удалось собрать образ. Проверьте аватар или выберите другой сценарий.");
      setEventPickerOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts() {
    if (!look?.sessionId || !selectedVariant) return;
    setProductSearchLoading(true);
    setError(null);
    try {
      const payload = await api.searchStylistProducts(look.sessionId, selectedVariant.id);
      setLook(payload);
      setRemovedProductIds(new Set());
    } catch {
      setError("Не удалось подобрать товары Wildberries для этого варианта.");
    } finally {
      setProductSearchLoading(false);
    }
  }

  async function regenerateVariant() {
    if (!look?.sessionId || !selectedVariant) return;
    setRegeneratingVariantId(selectedVariant.id);
    setError(null);
    try {
      const payload = await api.regenerateStylistVariant(look.sessionId, selectedVariant.id);
      setLook(payload);
      setSelectedVariantId(selectedVariant.id);
      setRemovedProductIds(new Set());
    } catch (err) {
      setError(err instanceof ApiError && (err.code === "INSUFFICIENT_GENERATIONS" || err.status === 402)
        ? "Для повторной генерации закончились примерки. Пополните лимит или оформите подписку."
        : "Не удалось перегенерировать вариант. Попробуйте позже.");
    } finally {
      setRegeneratingVariantId(null);
    }
  }

  if (!profile?.stylistAvailable) {
    return (
      <Screen>
        <View style={styles.scroll}>
          <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Назад">
            <Feather name="arrow-left" size={22} color={colors.black} />
          </Pressable>
          <Card>
            <Eyebrow>AI-стилист</Eyebrow>
            <Text style={styles.title}>Стилист временно недоступен</Text>
            <BodyText>Попробуй вернуться позже.</BodyText>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Назад">
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>
        <Eyebrow>AI-стилист</Eyebrow>
        <DisplayTitle>Подбор образа под событие</DisplayTitle>
        <BodyText>Выберите сценарий. Стилист соберет классику, современный вариант и более смелый образ.</BodyText>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Card>
          <View style={styles.eventHeader}>
            <View style={styles.eventCopy}>
              <Text style={styles.sectionTitle}>Событие</Text>
              <Text style={styles.eventTitle}>
                {selectedPresetId === "custom"
                  ? customEventDescription.trim() || "Свое событие"
                  : selectedPreset?.title ?? "Выберите событие"}
              </Text>
            </View>
            {look || loading ? (
              <Pressable style={styles.changeEvent} onPress={() => setEventPickerOpen((value) => !value)}>
                <Text style={styles.changeEventText}>{eventPickerOpen ? "Скрыть" : "Изменить"}</Text>
              </Pressable>
            ) : null}
          </View>
          {eventPickerOpen ? (
            <>
              <View style={styles.grid}>
                {presets.map((preset) => {
                  const active = preset.id === selectedPresetId;
                  return (
                    <Pressable key={preset.id} style={[styles.preset, active && styles.selected]} onPress={() => setSelectedPresetId(preset.id)}>
                      <Text style={styles.presetTitle}>{preset.title}</Text>
                      <Text style={styles.presetDescription}>{preset.description}</Text>
                    </Pressable>
                  );
                })}
                <Pressable style={[styles.preset, selectedPresetId === "custom" && styles.selected]} onPress={() => setSelectedPresetId("custom")}>
                  <Text style={styles.presetTitle}>Свое событие</Text>
                  <Text style={styles.presetDescription}>Опишите повод, место, дресс-код или настроение.</Text>
                </Pressable>
              </View>
              {selectedPresetId === "custom" ? (
                <TextInput
                  value={customEventDescription}
                  onChangeText={setCustomEventDescription}
                  maxLength={240}
                  multiline
                  textAlignVertical="top"
                  placeholder="Например: ужин с друзьями в модном ресторане, хочу выглядеть заметно, но без вечернего платья"
                  placeholderTextColor={colors.muted}
                  style={styles.customEventInput}
                />
              ) : null}
            </>
          ) : null}
          <Button label={loading ? "Собираем..." : look ? "Собрать заново" : "Подобрать стиль"} loading={loading} disabled={loading || !canCreateLook} onPress={createLook} />
        </Card>

        {loading ? (
          <Card>
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.pink} />
              <View style={styles.loadingCopy}>
                <Text style={styles.loadingTitle}>Генерируем подбор стиля</Text>
                <BodyText>Анализируем аватар, учитываем сценарий и собираем три направления образа.</BodyText>
              </View>
            </View>
          </Card>
        ) : null}

        {look ? (
          <View style={styles.results}>
            <Card>
              <Text style={styles.sectionTitle}>Анализ аватара</Text>
              <BodyText>{plainTextForUi(look.avatarAnalysis)}</BodyText>
            </Card>
            <Card>
              <Text style={styles.sectionTitle}>Сезон и тренды</Text>
              <BodyText>{plainTextForUi(look.trendNote)}</BodyText>
            </Card>
            <View style={styles.variants}>
              {look.variants.map((variant) => (
                <VariantTile
                  key={variant.id}
                  variant={variant}
                  active={variant.id === selectedVariant?.id}
                  onPress={() => {
                    setSelectedVariantId(variant.id);
                    if (look.sessionId) {
                      void api.selectStylistVariant(look.sessionId, variant.id)
                        .then((payload) => setLook(payload))
                        .catch(() => undefined);
                    }
                  }}
                />
              ))}
            </View>
            {selectedVariant ? (
              <Card>
                {selectedVariant.tryOnPreviewUrl ? (
                  <PreviewImage src={selectedVariant.tryOnPreviewUrl} accessToken={accessToken} />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    {selectedVariant.previewStatus === "queued" || selectedVariant.previewStatus === "generating" ? (
                      <ActivityIndicator color={colors.pink} />
                    ) : (
                      <Feather name="star" size={24} color={colors.pink} />
                    )}
                    <Text style={styles.previewText}>{previewStatusText(selectedVariant.previewStatus)}</Text>
                  </View>
                )}
                <Text style={styles.title}>{selectedVariant.title}</Text>
                <BodyText>{plainTextForUi(selectedVariant.stylistComment)}</BodyText>
                <Button
                  label={productSearchLoading ? "Ищем..." : "Подобрать товары WB"}
                  loading={productSearchLoading}
                  disabled={productSearchLoading || !look.sessionId}
                  onPress={searchProducts}
                />
                <Button
                  label={selectedVariant.nextRegenerationFree ? "Перегенерировать бесплатно" : "Перегенерировать за примерку"}
                  variant="secondary"
                  loading={regeneratingVariantId === selectedVariant.id}
                  disabled={Boolean(regeneratingVariantId) || !look.sessionId}
                  onPress={regenerateVariant}
                />
                <Text style={styles.status}>{productSearchStatusText(selectedVariant.productSearchStatus)}</Text>
                {selectedVariant.productSearchQuery ? <Text style={styles.query}>Запрос: {selectedVariant.productSearchQuery}</Text> : null}
                <View style={styles.products}>
                  {selectedVariant.products.filter((product) => !removedProductIds.has(product.id)).map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onRemove={() => setRemovedProductIds((prev) => new Set(prev).add(product.id))}
                    />
                  ))}
                </View>
              </Card>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function PreviewImage({ src, accessToken }: { src: string; accessToken: string | null }) {
  if (/^https?:\/\//i.test(src)) {
    return <Image source={{ uri: src }} style={styles.preview} resizeMode="contain" />;
  }
  return <AuthenticatedImage path={src} accessToken={accessToken} style={styles.preview} contentFit="contain" />;
}

function plainTextForUi(text?: string | null) {
  return (text ?? "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function VariantTile({ variant, active, onPress }: { variant: StylistVariant; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.variant, active && styles.selected]} onPress={onPress}>
      <Text style={styles.presetTitle}>{variant.title}</Text>
      <Text style={styles.presetDescription}>{variant.summary}</Text>
      {variant.previewStatus ? <Text style={styles.status}>{previewStatusText(variant.previewStatus)}</Text> : null}
      {variant.previewStatus === "failed" && variant.errorMessage ? <Text style={styles.previewError}>{variant.errorMessage}</Text> : null}
    </Pressable>
  );
}

function previewStatusText(status?: string | null) {
  switch (status) {
    case "queued":
      return "Готовим запрос на генерацию превью";
    case "generating":
      return "Генерируем фото выбранного образа";
    case "ready":
      return "Превью готово";
    case "failed":
      return "Превью не удалось";
    case "skipped":
      return "Генерация не настроена";
    default:
      return "Превью готовится";
  }
}

function productSearchStatusText(status?: string | null) {
  switch (status) {
    case "ready":
      return "Товары подобраны";
    case "empty":
      return "Ничего не найдено";
    case "failed":
      return "Поиск не удался";
    case "demo":
      return "Пока справочные товары";
    default:
      return "Товары не подбирались";
  }
}

function ProductRow({ product, onRemove }: { product: StylistProductCandidate; onRemove: () => void }) {
  return (
    <View style={styles.product}>
      <Pressable style={styles.productCopy} onPress={() => void Linking.openURL(product.productUrl)}>
        <Text style={styles.productTitle}>{product.title}</Text>
        <Text style={styles.productMeta}>
          {product.marketplace === "wildberries" ? "Wildberries" : product.marketplace}
          {product.priceRub ? ` · ${product.priceRub.toLocaleString("ru-RU")} ₽` : ""}
        </Text>
      </Pressable>
      <Pressable style={styles.remove} onPress={onRemove} accessibilityLabel="Удалить товар">
        <Feather name="x" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  back: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  title: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 22, lineHeight: 29, marginBottom: spacing.sm },
  eventHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.sm },
  eventCopy: { flex: 1 },
  eventTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 15, lineHeight: 20 },
  changeEvent: { minHeight: 36, justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.pinkBg, paddingHorizontal: spacing.md },
  changeEventText: { color: colors.pink, fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  preset: { width: "48%", minHeight: 128, borderRadius: radius.xl, borderWidth: hairline, borderColor: colors.borderLight, backgroundColor: colors.white, padding: spacing.md, gap: 6 },
  selected: { borderColor: colors.pink, backgroundColor: colors.pinkBg },
  presetTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14, lineHeight: 19 },
  presetDescription: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 12, lineHeight: 17 },
  customEventInput: { minHeight: 104, borderRadius: radius.xl, borderWidth: hairline, borderColor: colors.borderLight, backgroundColor: colors.white, color: colors.black, fontFamily: "Manrope_400Regular", fontSize: 14, lineHeight: 20, padding: spacing.md, marginTop: spacing.sm, marginBottom: spacing.sm },
  error: { color: colors.pink, fontFamily: "Manrope_500Medium", fontSize: 13, lineHeight: 18 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  loadingCopy: { flex: 1 },
  loadingTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  results: { gap: spacing.md },
  sectionTitle: { color: colors.violet, fontFamily: "Manrope_600SemiBold", fontSize: 15, marginBottom: 6 },
  variants: { gap: spacing.sm },
  variant: { borderRadius: radius.xl, borderWidth: hairline, borderColor: colors.borderLight, backgroundColor: colors.white, padding: spacing.md, gap: 6 },
  status: { color: colors.pink, fontFamily: "Manrope_600SemiBold", fontSize: 11, textTransform: "uppercase" },
  previewError: { color: "#b42318", fontFamily: "Manrope_500Medium", fontSize: 11, lineHeight: 15 },
  query: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 11, lineHeight: 16 },
  preview: { width: "100%", height: 360, borderRadius: radius.xl, backgroundColor: colors.pinkBg, marginBottom: spacing.md },
  previewPlaceholder: { height: 260, borderRadius: radius.xl, borderWidth: hairline, borderColor: colors.borderLight, backgroundColor: colors.pinkBg, alignItems: "center", justifyContent: "center", gap: spacing.sm, marginBottom: spacing.md },
  previewText: { color: colors.muted, fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  products: { gap: spacing.sm, marginTop: spacing.md },
  product: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.lg, borderWidth: hairline, borderColor: colors.borderLight, padding: spacing.sm },
  productCopy: { flex: 1, gap: 4 },
  productTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  productMeta: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 12 },
  remove: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.pinkBg },
});
