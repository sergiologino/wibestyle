import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, Card, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { Pressable, Text } from "react-native";

const OPTIONS = [
  {
    id: "link",
    title: "По ссылке маркетплейса",
    subtitle: "Wildberries или Ozon — вставь URL карточки",
    icon: "link" as const,
    href: "/try-on/link",
  },
  {
    id: "photo",
    title: "По фото вещи",
    subtitle: "Сфотографируй или выбери из галереи",
    icon: "camera" as const,
    href: "/try-on/photo",
  },
];

export default function TryOnHubScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Eyebrow>AI-примерка</Eyebrow>
        <DisplayTitle>Как примерить вещь?</DisplayTitle>
        <BodyText>Выбери способ — мы наденем образ на твоё фото в полный рост.</BodyText>

        <View style={styles.list}>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => router.push(option.href as never)}
            >
              <View style={styles.iconWrap}>
                <Feather name={option.icon} size={22} color={colors.pink} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.eyebrow} />
            </Pressable>
          ))}
        </View>

        <Card style={styles.tip}>
          <Text style={styles.tipTitle}>Совет</Text>
          <BodyText>
            Для лучшего результата используй фото в облегающей одежде и хорошем освещении.
          </BodyText>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  optionPressed: {
    backgroundColor: colors.pinkBg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.pinkBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: colors.black,
  },
  optionSubtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  tip: {
    marginTop: spacing.md,
  },
  tipTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: colors.violet,
    marginBottom: 4,
  },
});
