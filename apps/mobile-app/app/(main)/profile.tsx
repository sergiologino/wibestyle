import { ScrollView, StyleSheet, View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, Card, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const LINKS = [
  { label: "Настройки профиля", icon: "settings" as const, href: "/settings" },
  { label: "Избранное", icon: "heart" as const, href: "/favorites" },
  { label: "Тарифы Wibe / Elite", icon: "star" as const, href: "/paywall" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, phone, logout } = useSession();

  async function handleLogout() {
    Alert.alert("Выйти", "Завершить сессию на этом устройстве?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <BrandMark size={48} />
          <DisplayTitle>{profile?.displayName ?? "Профиль"}</DisplayTitle>
          {phone ? <BodyText>{phone}</BodyText> : null}
        </View>

        <Card>
          <Eyebrow>Подписка</Eyebrow>
          <Text style={styles.plan}>
            {profile?.plan === "elite" ? "Elite" : profile?.plan === "wibe" ? "Wibe" : "Trial"}
          </Text>
          <BodyText>
            {profile?.plan === "trial"
              ? `Бесплатных примерок: ${profile.trialGenerationsLeft}`
              : profile?.planGenerationsLeft != null
                ? `Генераций: ${profile.planGenerationsLeft}`
                : "Активная подписка"}
          </BodyText>
        </Card>

        <View style={styles.links}>
          {LINKS.map((link) => (
            <Pressable
              key={link.href}
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
              onPress={() => router.push(link.href as never)}
            >
              <Feather name={link.icon} size={18} color={colors.pink} />
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.eyebrow} />
            </Pressable>
          ))}
        </View>

        <Button label="Выйти" variant="ghost" onPress={handleLogout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  plan: {
    fontFamily: "Manrope_500Medium",
    fontSize: 22,
    color: colors.violet,
    marginTop: 8,
  },
  links: {
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  linkPressed: {
    backgroundColor: colors.pinkBg,
  },
  linkLabel: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: colors.black,
  },
});
