import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { getHairstyle } from "@/lib/hairstyle-catalog";
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
  const { styleId } = useLocalSearchParams<{ styleId: string }>();
  const style = getHairstyle(styleId);
  const { api, ensureSession, uploads, profile, accessToken } = useSession();
  const [portraitPath, setPortraitPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!style) return null;
  const selectedStyle = style;

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

  async function generate() {
    if (!await ensureSession()) return router.replace("/auth");
    if (!portraitPath) return setError("Сначала загрузите портрет для причёсок в профиле.");
    setLoading(true); setError(null);
    try {
      const result = await uploads.createHairstyleTryOn(null, selectedStyle.id);
      const sessionId = result.session?.id ?? result.id;
      if (profile?.userId) await saveHairstyleHistory(profile.userId, {
        id: sessionId,
        styleId: selectedStyle.id,
        title: selectedStyle.title,
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
    <DisplayTitle>{selectedStyle.title}</DisplayTitle>
    <BodyText>Для примерки используем портрет из профиля. На этом экране выбирается только причёска.</BodyText>
    <Image source={buildProductImageSource(getApiBaseUrl(), hairstyleImagePath(selectedStyle.id), null, getAppBaseUrl())} style={sheet.styleImage} contentFit="cover" />
    <View style={sheet.photoBox}>
      {portraitPath ? (
        <AuthenticatedImage path={portraitPath} accessToken={accessToken} style={sheet.photo} contentFit="cover" />
      ) : (
        <View style={sheet.photoHint}><Feather name="user" size={31} color={colors.pink} /><Text style={sheet.hintText}>Портрет не найден</Text></View>
      )}
    </View>
    {!portraitPath ? <Button label="Загрузить портрет в профиле" variant="secondary" onPress={() => router.push("/settings" as never)} /> : null}
    <View style={sheet.note}><Text style={sheet.noteTitle}>Что будет изменено</Text><Text style={sheet.noteText}>{selectedStyle.description}</Text><Text style={sheet.master}>Мастеру: {selectedStyle.masterNote}</Text></View>
    {error ? <Text style={sheet.error}>{error}</Text> : null}
    <Button label="Примерить на себе" loading={loading} onPress={() => void generate()} />
    <Text style={sheet.privacy}>Портрет хранится в профиле и не меняет аватар одежды.</Text>
  </ScrollView></Screen>;
}

const sheet = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  styleImage: { width: "100%", aspectRatio: 0.8, borderRadius: radius.xxl, backgroundColor: colors.pinkBg },
  photoBox: { height: 310, borderRadius: radius.xxl, borderWidth: hairline, borderColor: colors.borderLight, overflow: "hidden", backgroundColor: colors.pinkBg, alignItems: "center", justifyContent: "center" }, photo: { width: "100%", height: "100%" },
  photoHint: { alignItems: "center", gap: spacing.sm }, hintText: { color: colors.pink, fontFamily: "Manrope_500Medium", fontSize: 14 },
  note: { borderRadius: radius.xl, backgroundColor: colors.pinkBg, padding: spacing.md, gap: 5 }, noteTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14 }, noteText: { color: colors.black, fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 19 }, master: { color: colors.violet, fontFamily: "Manrope_500Medium", fontSize: 12, lineHeight: 18, marginTop: 3 },
  error: { color: colors.danger, fontFamily: "Manrope_400Regular" }, privacy: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center" },
});
