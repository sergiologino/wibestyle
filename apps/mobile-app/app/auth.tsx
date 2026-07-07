import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams } from "expo-router";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { getAppBaseUrl } from "@/lib/config";
import { legalLinks } from "@/lib/legal-links";
import { colors, spacing } from "@/theme/tokens";
import { readVisitorId, trackMobileMarketingEvent } from "@/lib/marketing-visitor";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const searchParams = useLocalSearchParams<{ ref?: string }>();
  const { api } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startMobileId() {
    setLoading(true);
    setError(null);
    try {
      const status = await api.getMobileIdStatus();
      if (!status.enabled) throw new Error("Вход по телефону временно не настроен");
      const returnUrl = ExpoLinking.createURL("auth/mobile-id/callback");
      const params = new URLSearchParams({ returnUrl });
      if (typeof searchParams.ref === "string") params.set("ref", searchParams.ref);
      const visitorId = await readVisitorId();
      if (visitorId) params.set("visitorId", visitorId);
      void trackMobileMarketingEvent("signup_started", { method: "mobile_id" });
      const result = await WebBrowser.openAuthSessionAsync(
        `${getAppBaseUrl()}/auth/mobile-id?${params.toString()}`,
        returnUrl,
      );
      if (result.type === "cancel" || result.type === "dismiss") {
        setError("Вход отменён");
      }
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error
        ? err.message
        : "Не удалось открыть вход по телефону");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>Вход</Eyebrow>
        <DisplayTitle>Добро пожаловать</DisplayTitle>
        <BodyText>Войдите по номеру телефона — аккаунт создастся автоматически.</BodyText>

        <View style={styles.form}>
          <Button label="Войти по номеру телефона" loading={loading} onPress={startMobileId} />
        </View>

        <OAuthButtons referralCode={typeof searchParams.ref === "string" ? searchParams.ref : undefined} />

        <Text style={styles.legalText}>
          Продолжая, вы принимаете{" "}
          <Text style={styles.legalLink} onPress={() => void Linking.openURL(legalLinks.terms)}>
            пользовательское соглашение
          </Text>{" "}
          и{" "}
          <Text style={styles.legalLink} onPress={() => void Linking.openURL(legalLinks.privacy)}>
            политику конфиденциальности
          </Text>.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  form: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
  },
  legalText: {
    color: colors.eyebrow,
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  legalLink: {
    color: colors.pink,
    fontFamily: "Manrope_500Medium",
  },
});
