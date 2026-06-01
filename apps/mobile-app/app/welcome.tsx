import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";
import { useSession } from "@/context/SessionProvider";
import { spacing } from "@/theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();
  const { completeOnboardingStep } = useSession();

  function continueFlow() {
    completeOnboardingStep("welcome");
    router.replace("/auth");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <BrandMark size={56} />
          <Eyebrow>Я на стиле</Eyebrow>
          <DisplayTitle>Примерь одежду с маркетплейса на себе</DisplayTitle>
          <BodyText>
            Загрузи фото в полный рост, вставь ссылку на WB или Ozon — AI покажет образ до покупки.
          </BodyText>
        </View>
        <Button label="Начать" size="lg" onPress={continueFlow} />
        <Button
          label="Уже есть аккаунт"
          variant="ghost"
          onPress={() => {
            completeOnboardingStep("welcome");
            router.replace("/auth");
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: "center",
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
});
