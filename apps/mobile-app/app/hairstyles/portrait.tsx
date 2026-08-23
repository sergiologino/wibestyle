import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { getHairstyle } from "@/lib/hairstyle-catalog";
import { preparePickedImageForUpload } from "@/lib/image-upload";
import type { RNFile } from "@/lib/mobile-api";
import { useSession } from "@/context/SessionProvider";
import { readHairstylePortrait, saveHairstylePortrait } from "@/lib/hairstyle-portrait";
import { saveHairstyleHistory } from "@/lib/hairstyle-history";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function HairstylePortraitScreen() {
  const router = useRouter();
  const { styleId } = useLocalSearchParams<{ styleId: string }>();
  const style = getHairstyle(styleId);
  const { ensureSession, uploads, profile } = useSession();
  const [portrait, setPortrait] = useState<RNFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!style) return null;
  const selectedStyle = style;

  useEffect(() => {
    if (!profile?.userId) return;
    void readHairstylePortrait(profile.userId).then((saved) => saved && setPortrait(saved));
  }, [profile?.userId]);

  async function pick(source: "camera" | "library") {
    const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Нужен доступ", "Разреши доступ к камере или галерее.");
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true, aspect: [1, 1], cameraType: ImagePicker.CameraType.front })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || !result.assets[0]) return;
    const file = await preparePickedImageForUpload(result.assets[0], "hair-portrait.jpg", 1200);
    setPortrait(file);
    if (profile?.userId) void saveHairstylePortrait(profile.userId, file);
  }

  async function generate() {
    if (!portrait) return setError("Добавь портрет крупным планом");
    if (!await ensureSession()) return router.replace("/auth");
    setLoading(true); setError(null);
    try {
      const result = await uploads.createHairstyleTryOn(portrait, selectedStyle.id);
      if (profile?.userId) await saveHairstyleHistory(profile.userId, {
        id: result.afterImageUrl,
        styleId: selectedStyle.id,
        title: selectedStyle.title,
        imagePath: result.afterImageUrl,
        createdAt: new Date().toISOString(),
      });
      router.replace(`/hairstyles/result?styleId=${selectedStyle.id}&imagePath=${encodeURIComponent(result.afterImageUrl)}` as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось примерить причёску");
    } finally { setLoading(false); }
  }

  return <Screen><ScrollView contentContainerStyle={sheet.scroll} showsVerticalScrollIndicator={false}>
    <Pressable style={sheet.back} onPress={() => router.back()}><Feather name="arrow-left" size={22} color={colors.black} /></Pressable>
    <Eyebrow>Портрет для волос</Eyebrow>
    <DisplayTitle>{selectedStyle.title}</DisplayTitle>
    <BodyText>Нужен отдельный снимок: лицо прямо, от макушки до плеч, без очков и фильтров, при хорошем свете. Его можно заменить в любой момент.</BodyText>
    <Pressable style={sheet.photoBox} onPress={() => pick("library")}>
      {portrait ? <Image source={{ uri: portrait.uri }} style={sheet.photo} contentFit="cover" /> : <View style={sheet.photoHint}><Feather name="user" size={31} color={colors.pink} /><Text style={sheet.hintText}>Добавить портрет</Text></View>}
    </Pressable>
    <View style={sheet.actions}><Button label="Камера" variant="secondary" onPress={() => pick("camera")} /><Button label="Галерея" variant="secondary" onPress={() => pick("library")} /></View>
    <View style={sheet.note}><Text style={sheet.noteTitle}>Что будет изменено</Text><Text style={sheet.noteText}>{selectedStyle.description}</Text><Text style={sheet.master}>Мастеру: {selectedStyle.masterNote}</Text></View>
    {error ? <Text style={sheet.error}>{error}</Text> : null}
    <Button label="Примерить на себе" loading={loading} onPress={() => void generate()} />
    <Text style={sheet.privacy}>Портрет сохраняется только на этом устройстве для следующих примерок и не меняет аватар одежды.</Text>
  </ScrollView></Screen>;
}

const sheet = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }, back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  photoBox: { height: 310, borderRadius: radius.xxl, borderWidth: hairline, borderColor: colors.borderLight, overflow: "hidden", backgroundColor: colors.pinkBg, alignItems: "center", justifyContent: "center" }, photo: { width: "100%", height: "100%" },
  photoHint: { alignItems: "center", gap: spacing.sm }, hintText: { color: colors.pink, fontFamily: "Manrope_500Medium", fontSize: 14 }, actions: { flexDirection: "row", gap: spacing.sm },
  note: { borderRadius: radius.xl, backgroundColor: colors.pinkBg, padding: spacing.md, gap: 5 }, noteTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14 }, noteText: { color: colors.black, fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 19 }, master: { color: colors.violet, fontFamily: "Manrope_500Medium", fontSize: 12, lineHeight: 18, marginTop: 3 },
  error: { color: colors.danger, fontFamily: "Manrope_400Regular" }, privacy: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center" },
});
