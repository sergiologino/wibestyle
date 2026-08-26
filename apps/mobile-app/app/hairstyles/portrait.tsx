import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { getHairstyle } from "@/lib/hairstyle-catalog";
import type { HairColor } from "@/lib/hair-color-catalog";
import { useSession } from "@/context/SessionProvider";
import { saveHairstyleHistory } from "@/lib/hairstyle-history";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { getApiBaseUrl, getAppBaseUrl } from "@/lib/config";
import { buildProductImageSource } from "@/lib/mobile-api";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const PORTRAIT_URL = "/api/v1/profile/hairstyle-portrait/image";
const hairstyleImagePath = (styleId: string) => `/api/v1/hairstyles/${styleId}/image`;

export default function HairstylePortraitScreen() {
  const router = useRouter();
  const { styleId, colorId } = useLocalSearchParams<{ styleId?: string; colorId?: string }>();
  const style = getHairstyle(styleId);
  const { api, ensureSession, uploads, profile, accessToken } = useSession();
  const [color, setColor] = useState<HairColor | null>(null);
  const [portraitPath, setPortraitPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!style && !colorId) return null;

  useEffect(() => {
    if (!profile?.userId) return;
    let cancelled = false;
    void api.getHairstylePortrait()
      .then((result) => {
        if (!cancelled) setPortraitPath(result.exists ? `${result.imageUrl ?? PORTRAIT_URL}?v=${Date.now()}` : null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, profile?.userId]);

  useEffect(() => {
    if (!colorId) {
      setColor(null);
      return;
    }
    let cancelled = false;
    void api.getHairColorCatalog()
      .then((result) => {
        if (!cancelled) setColor(result.items.find((item) => item.id === colorId) ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, colorId]);

  async function generate() {
    if (!await ensureSession()) return router.replace("/auth");
    if (!portraitPath) return setError("Сначала загрузите портрет для причёсок в профиле.");
    setLoading(true); setError(null);
    try {
      const result = await uploads.createHairstyleTryOn(null, style?.id ?? null, colorId ?? null);
      const sessionId = result.session?.id ?? result.id;
      if (profile?.userId) await saveHairstyleHistory(profile.userId, {
        id: sessionId,
        styleId: style?.id ?? "color-only",
        colorId: colorId ?? null,
        title: [style?.title, color?.title].filter(Boolean).join(" + ") || "Цвет волос",
        imagePath: result.afterImageUrl,
        createdAt: new Date().toISOString(),
      });
      router.replace(`/try-on/result/${sessionId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось примерить причёску");
    } finally { setLoading(false); }
  }

  return <Screen><ScrollView contentContainerStyle={sheet.scroll} showsVerticalScrollIndicator={false}>
    <Pressable style={sheet.back} onPress={() => router.back()}><Feather name="arrow-left" size={22} color={colors.black} /></Pressable>
    <Eyebrow>Стилист по прическам</Eyebrow>
    <DisplayTitle>{[style?.title, color?.title].filter(Boolean).join(" + ")}</DisplayTitle>
    <BodyText>Для примерки используем портрет из профиля. Меняем только выбранные параметры волос.</BodyText>
    <View style={sheet.selectionGrid}>
      {style ? <Image source={buildProductImageSource(getApiBaseUrl(), hairstyleImagePath(style.id), null, getAppBaseUrl())} style={sheet.styleImage} contentFit="cover" /> : <View style={sheet.keepBox}><Text style={sheet.keepText}>Прическу не меняем</Text></View>}
      {color ? <Image source={buildProductImageSource(getApiBaseUrl(), color.imageUrl, null, getAppBaseUrl())} style={sheet.styleImage} contentFit="cover" /> : <View style={sheet.keepBox}><Text style={sheet.keepText}>{colorId ? "Загружаем цвет" : "Цвет не меняем"}</Text></View>}
    </View>
    <View style={sheet.photoBox}>
      {portraitPath ? (
        <AuthenticatedImage path={portraitPath} accessToken={accessToken} style={sheet.photo} contentFit="cover" />
      ) : (
        <View style={sheet.photoHint}><Feather name="user" size={31} color={colors.pink} /><Text style={sheet.hintText}>Портрет не найден</Text></View>
      )}
    </View>
    {!portraitPath ? <Button label="Загрузить портрет в профиле" variant="secondary" onPress={() => router.push("/settings" as never)} /> : null}
    <View style={sheet.note}><Text style={sheet.noteTitle}>Что будет изменено</Text><Text style={sheet.noteText}>{style?.description ?? "Форма волос останется как на портрете."} {color?.description ?? "Цвет волос останется исходным."}</Text>{style ? <Text style={sheet.master}>Мастеру: {style.masterNote}</Text> : null}</View>
    {error ? <Text style={sheet.error}>{error}</Text> : null}
    <Button label="Примерить на себе" loading={loading} onPress={() => void generate()} />
    <Text style={sheet.privacy}>Портрет хранится в профиле и не меняет аватар одежды.</Text>
  </ScrollView></Screen>;
}

const sheet = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  selectionGrid: { flexDirection: "row", gap: spacing.md },
  styleImage: { flex: 1, aspectRatio: 0.8, borderRadius: radius.xxl, backgroundColor: colors.pinkBg },
  keepBox: { flex: 1, aspectRatio: 0.8, borderRadius: radius.xxl, backgroundColor: colors.pinkBg, borderWidth: hairline, borderColor: colors.borderLight, alignItems: "center", justifyContent: "center", padding: spacing.md },
  keepText: { color: colors.muted, fontFamily: "Manrope_600SemiBold", fontSize: 13, textAlign: "center" },
  photoBox: { height: 310, borderRadius: radius.xxl, borderWidth: hairline, borderColor: colors.borderLight, overflow: "hidden", backgroundColor: colors.pinkBg, alignItems: "center", justifyContent: "center" }, photo: { width: "100%", height: "100%" },
  photoHint: { alignItems: "center", gap: spacing.sm }, hintText: { color: colors.pink, fontFamily: "Manrope_500Medium", fontSize: 14 },
  note: { borderRadius: radius.xl, backgroundColor: colors.pinkBg, padding: spacing.md, gap: 5 }, noteTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14 }, noteText: { color: colors.black, fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 19 }, master: { color: colors.violet, fontFamily: "Manrope_500Medium", fontSize: 12, lineHeight: 18, marginTop: 3 },
  error: { color: colors.danger, fontFamily: "Manrope_400Regular" }, privacy: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center" },
});
