import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { getHairstyle } from "@/lib/hairstyle-catalog";
import { useSession } from "@/context/SessionProvider";
import { colors, radius, spacing } from "@/theme/tokens";

export default function HairstyleResultScreen() {
  const router = useRouter(); const { styleId, colorId, imagePath } = useLocalSearchParams<{ styleId?: string; colorId?: string; imagePath: string }>();
  const { accessToken } = useSession(); const style = getHairstyle(styleId);
  if (!imagePath) return null;
  const title = [style?.title, colorId ? "цвет волос" : null].filter(Boolean).join(" + ") || "Цвет волос";
  return <Screen><ScrollView contentContainerStyle={sheet.scroll} showsVerticalScrollIndicator={false}>
    <Pressable style={sheet.back} onPress={() => router.replace("/(main)/try-on")}><Feather name="x" size={22} color={colors.black} /></Pressable>
    <Eyebrow>Готово</Eyebrow><DisplayTitle>{title}</DisplayTitle><BodyText>Это визуализация: финальную форму, окрашивание и уход лучше обсудить с мастером.</BodyText>
    <AuthenticatedImage path={imagePath} accessToken={accessToken} style={sheet.image} contentFit="cover" />
    <View style={sheet.note}><Text style={sheet.noteTitle}>Что сказать мастеру</Text><Text style={sheet.noteText}>{style?.masterNote ?? "Форму не меняли."} {colorId ? "Цвет выбран из каталога оттенков." : ""}</Text></View>
    <Button label="Примерить ещё" variant="secondary" onPress={() => router.replace("/hairstyles" as never)} />
  </ScrollView></Screen>;
}
const sheet = StyleSheet.create({ scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl }, back: { width: 40, height: 40, justifyContent: "center", alignItems: "center" }, image: { width: "100%", aspectRatio: 1, borderRadius: radius.xxl }, note: { backgroundColor: colors.pinkBg, padding: spacing.md, borderRadius: radius.xl, gap: 4 }, noteTitle: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14 }, noteText: { color: colors.violet, fontFamily: "Manrope_400Regular", fontSize: 13, lineHeight: 19 } });
