import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getApiBaseUrl } from "@/lib/config";
import { legalLinks } from "@/lib/legal-links";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import { formatRussianPhone, isRussianPhoneComplete } from "@/lib/phone-mask";
import { colors, spacing } from "@/theme/tokens";

export default function AuthScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ next?: string; ref?: string }>();
  const { api, setAuth } = useSession();
  const [phone, setPhone] = useState("+7 ");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startPhoneOtp() {
    setError(null);
    if (!isRussianPhoneComplete(phone)) {
      setError("Введите номер в формате +7 (ККК) ННН-НН-НН");
      return;
    }
    setLoading(true);
    try {
      const result = await api.startOtp(phone);
      setRequestId(result.requestId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!requestId) return;
    setError(null);
    setLoading(true);
    try {
      const auth = await api.verifyOtp(
        requestId,
        code,
        undefined,
        typeof searchParams.ref === "string" ? searchParams.ref : undefined,
      );
      const meClient = new WibeStyleApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken: () => auth.accessToken,
      });
      const me = await meClient.me();
      setAuth(
        auth.accessToken,
        auth.user.phone ?? auth.user.email ?? me.user.login ?? me.user.email ?? "",
        me.profile,
        auth.refreshToken,
        auth.expiresIn,
      );
      router.replace(
        resolvePostAuthRoute({
          newUser: Boolean(auth.newUser),
          hasActiveAvatar: Boolean(me.profile.activeAvatarId),
          nextParam: typeof searchParams.next === "string" ? searchParams.next : null,
        }) as never,
      );
    } catch {
      setError("Неверный код. Для dev используй 0000.");
    } finally {
      setLoading(false);
    }
  }

  function resetChallenge() {
    setRequestId(null);
    setCode("");
    setError(null);
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Eyebrow>Вход</Eyebrow>
          <DisplayTitle>Добро пожаловать</DisplayTitle>
          <BodyText>Войди по телефону или через Яндекс / Google.</BodyText>

          <View style={styles.form}>
            {!requestId ? (
              <>
                <TextField
                  label="Телефон"
                  placeholder="+7 900 000-00-00"
                  keyboardType="phone-pad"
                  maxLength={18}
                  value={phone}
                  onChangeText={(value) => setPhone(formatRussianPhone(value))}
                />
                <Button
                  label="Получить код"
                  loading={loading}
                  onPress={startPhoneOtp}
                />
              </>
            ) : (
              <>
                <TextField
                  label="Код из SMS"
                  placeholder="0000"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                />
                <Button label="Подтвердить" loading={loading} onPress={verifyOtp} />
                <Button label="Изменить" variant="ghost" onPress={resetChallenge} />
              </>
            )}
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
            </Text>
            .
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
