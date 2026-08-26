import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { getApiBaseUrl, getAppBaseUrl } from "@/lib/config";
import { buildProductImageSource } from "@/lib/mobile-api";
import { HAIRSTYLES, HAIRSTYLE_LENGTH_LABELS, type HairstyleLength } from "@/lib/hairstyle-catalog";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

type Filter = HairstyleLength | "all";
const filters: Filter[] = ["all", "short", "medium", "long", "styling"];
const hairstyleImagePath = (styleId: string) => `/api/v1/hairstyles/${styleId}/image`;

export default function HairstyleCatalogScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const styles = useMemo(() => HAIRSTYLES.filter((item) => filter === "all" || item.length === filter), [filter]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={sheet.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={sheet.back} onPress={() => router.back()} accessibilityLabel="Назад">
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>
        <Eyebrow>Стилист по прическам</Eyebrow>
        <DisplayTitle>Какой образ примерим?</DisplayTitle>
        <BodyText>Выбери идею. Для примерки используем портрет из профиля, аватар для одежды останется прежним.</BodyText>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheet.filters}>
          {filters.map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[sheet.filter, filter === item && sheet.filterActive]}>
              <Text style={[sheet.filterText, filter === item && sheet.filterTextActive]}>{HAIRSTYLE_LENGTH_LABELS[item]}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={sheet.grid}>
          {styles.map((style) => (
            <Pressable key={style.id} style={({ pressed }) => [sheet.card, pressed && sheet.cardPressed]} onPress={() => router.push(`/hairstyles/portrait?styleId=${style.id}` as never)}>
              <Image source={buildProductImageSource(getApiBaseUrl(), hairstyleImagePath(style.id), null, getAppBaseUrl())} style={sheet.image} contentFit="cover" transition={120} />
              <View style={sheet.cardCopy}>
                <Text style={sheet.title}>{style.title}</Text>
                <Text style={sheet.description} numberOfLines={3}>{style.description}</Text>
                <Text style={sheet.cta}>Примерить <Feather name="arrow-up-right" size={13} /></Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const sheet = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  back: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  filters: { gap: spacing.sm, paddingVertical: spacing.sm },
  filter: { borderWidth: hairline, borderColor: colors.borderLight, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.white },
  filterActive: { borderColor: colors.pink, backgroundColor: colors.pinkBg },
  filterText: { color: colors.muted, fontFamily: "Manrope_500Medium", fontSize: 13 },
  filterTextActive: { color: colors.pink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: "47%", overflow: "hidden", borderRadius: radius.xl, borderWidth: hairline, borderColor: colors.borderLight, backgroundColor: colors.white },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  image: { width: "100%", aspectRatio: 0.8, backgroundColor: colors.pinkBg },
  cardCopy: { padding: spacing.sm, gap: 5 },
  title: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14, lineHeight: 19 },
  description: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 11, lineHeight: 16 },
  cta: { color: colors.pink, fontFamily: "Manrope_600SemiBold", fontSize: 12, marginTop: 2 },
});
