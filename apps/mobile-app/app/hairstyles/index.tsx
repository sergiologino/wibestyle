import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { getApiBaseUrl, getAppBaseUrl } from "@/lib/config";
import { buildProductImageSource } from "@/lib/mobile-api";
import { HAIRSTYLES, HAIRSTYLE_LENGTH_LABELS, type HairstyleLength } from "@/lib/hairstyle-catalog";
import { HAIR_COLOR_ATTRIBUTION, type HairColor } from "@/lib/hair-color-catalog";
import { useSession } from "@/context/SessionProvider";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

type Filter = HairstyleLength | "all";
const filters: Filter[] = ["all", "short", "medium", "long", "styling"];
const hairstyleImagePath = (styleId: string) => `/api/v1/hairstyles/${styleId}/image`;

export default function HairstyleCatalogScreen() {
  const router = useRouter();
  const { api } = useSession();
  const [filter, setFilter] = useState<Filter>("all");
  const [styleId, setStyleId] = useState<string | null>(null);
  const [colorId, setColorId] = useState<string | null>(null);
  const [hairColors, setHairColors] = useState<HairColor[]>([]);
  const styles = useMemo(() => HAIRSTYLES.filter((item) => filter === "all" || item.length === filter), [filter]);
  const canStart = Boolean(styleId || colorId);

  useEffect(() => {
    let cancelled = false;
    void api.getHairColorCatalog()
      .then((result) => {
        if (!cancelled) setHairColors(result.items);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api]);

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams();
    if (styleId) params.set("styleId", styleId);
    if (colorId) params.set("colorId", colorId);
    router.push(`/hairstyles/portrait?${params.toString()}` as never);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={sheet.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={sheet.back} onPress={() => router.back()} accessibilityLabel="Назад">
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>
        <Eyebrow>Стилист по прическам</Eyebrow>
        <DisplayTitle>Причёска и цвет волос</DisplayTitle>
        <BodyText>Выбери причёску, цвет или оба пункта. Если менять что-то не нужно, оставь «не менять».</BodyText>

        <SectionTitle step="1" title="Причёска" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheet.filters}>
          {filters.map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[sheet.filter, filter === item && sheet.filterActive]}>
              <Text style={[sheet.filterText, filter === item && sheet.filterTextActive]}>{HAIRSTYLE_LENGTH_LABELS[item]}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={sheet.grid}>
          <ChoiceTile title="Не менять" subtitle="Оставить форму" selected={!styleId} onPress={() => setStyleId(null)} />
          {styles.map((style) => (
            <Pressable key={style.id} style={({ pressed }) => [sheet.card, styleId === style.id && sheet.cardSelected, pressed && sheet.cardPressed]} onPress={() => setStyleId(style.id)}>
              <Image source={buildProductImageSource(getApiBaseUrl(), hairstyleImagePath(style.id), null, getAppBaseUrl())} style={sheet.image} contentFit="cover" transition={120} cachePolicy="disk" />
              <View style={sheet.cardCopy}>
                <Text style={sheet.title}>{style.title}</Text>
                <Text style={sheet.description} numberOfLines={2}>{style.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionTitle step="2" title="Цвет волос" />
        <View style={sheet.grid}>
          <ChoiceTile title="Не менять" subtitle="Оставить цвет" selected={!colorId} onPress={() => setColorId(null)} />
          {hairColors.map((color) => (
            <Pressable key={color.id} style={({ pressed }) => [sheet.card, colorId === color.id && sheet.cardSelected, pressed && sheet.cardPressed]} onPress={() => setColorId(color.id)}>
              <Image source={buildProductImageSource(getApiBaseUrl(), color.imageUrl, null, getAppBaseUrl())} style={sheet.image} contentFit="cover" transition={120} cachePolicy="disk" />
              <View style={sheet.cardCopy}>
                <Text style={sheet.title}>{color.title}</Text>
                <Text style={sheet.description} numberOfLines={2}>{color.family}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={sheet.attribution}>{HAIR_COLOR_ATTRIBUTION}</Text>

        <View style={sheet.stickyAction}>
          <Button label="Запустить примерку" disabled={!canStart} onPress={start} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  return <View style={sheet.sectionTitle}><Text style={sheet.step}>Шаг {step}</Text><Text style={sheet.sectionHeading}>{title}</Text></View>;
}

function ChoiceTile({ title, subtitle, selected, onPress }: { title: string; subtitle: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [sheet.choice, selected && sheet.cardSelected, pressed && sheet.cardPressed]} onPress={onPress}>
      <Feather name="minus-circle" size={22} color={selected ? colors.pink : colors.muted} />
      <Text style={sheet.title}>{title}</Text>
      <Text style={sheet.description}>{subtitle}</Text>
    </Pressable>
  );
}

const sheet = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  back: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  sectionTitle: { gap: 4, marginTop: spacing.md },
  step: { color: colors.pink, fontFamily: "Manrope_700Bold", fontSize: 11, textTransform: "uppercase" },
  sectionHeading: { color: colors.black, fontFamily: "Manrope_700Bold", fontSize: 22 },
  filters: { gap: spacing.sm, paddingVertical: spacing.sm },
  filter: { borderWidth: hairline, borderColor: colors.borderLight, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.white },
  filterActive: { borderColor: colors.pink, backgroundColor: colors.pinkBg },
  filterText: { color: colors.muted, fontFamily: "Manrope_500Medium", fontSize: 13 },
  filterTextActive: { color: colors.pink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: "47%", overflow: "hidden", borderRadius: radius.xl, borderWidth: hairline, borderColor: colors.borderLight, backgroundColor: colors.white },
  choice: { width: "47%", minHeight: 168, borderRadius: radius.xl, borderWidth: hairline, borderColor: colors.borderLight, backgroundColor: colors.white, padding: spacing.md, justifyContent: "flex-end", gap: 6 },
  cardSelected: { borderColor: colors.pink, backgroundColor: colors.pinkBg },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  image: { width: "100%", aspectRatio: 0.8, backgroundColor: colors.pinkBg },
  cardCopy: { padding: spacing.sm, gap: 5 },
  title: { color: colors.black, fontFamily: "Manrope_600SemiBold", fontSize: 14, lineHeight: 19 },
  description: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 11, lineHeight: 16 },
  attribution: { color: colors.muted, fontFamily: "Manrope_400Regular", fontSize: 11, lineHeight: 16 },
  stickyAction: { paddingTop: spacing.sm },
});
