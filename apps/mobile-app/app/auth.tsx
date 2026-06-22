import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { OAuthButtons } from "../components/auth/OAuthButtons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getApiBaseUrl } from "@/lib/config";
import { legalLinks } from "@/lib/legal-links";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import { formatRussianPhone, isRussianPhoneComplete } from "@/lib/phone-mask";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

type AuthTab = "phone" | "email";

export default function AuthScreen() {
  const router = useRouter();
  const { api, setAuth } = useSession();
  const [tab, setTab] = useState<AuthTab>("phone");
  const [phone, setPhone] = useState("+7 ");
  const [email, setEmail] = useState("");
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

  async function startEmailOtp() {
    setError(null);
    setLoading(true);
    try {
      const result = await api.startEmailOtp(email);
      setRequestId(result.requestId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить код на email");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!requestId) return;
    setError(null);
    setLoading(true);
    try {
      const auth = tab === "phone"
        ? await api.verifyOtp(requestId, code)
        : await api.verifyEmailOtp(requestId, code);
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
        }) as never,
      );
    } catch {
      setError(tab === "phone" ? "Неверный код. Для dev используй 0000." : "Неверный код из письма.");
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
          <BodyText>Войди по телефону, email или через Яндекс / Google.</BodyText>

          <View style={styles.tabs}>
            {(["phone", "email"] as AuthTab[]).map((value) => (
              <Pressable
                key={value}
                style={[styles.tab, tab === value && styles.tabActive]}
                onPress={() => {
                  setTab(value);
                  resetChallenge();
                }}
              >
                <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>
                  {value === "phone" ? "Телефон" : "Email"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.form}>
            {!requestId ? (
              <>
                {tab === "phone" ? (
                  <TextField
                    label="Телефон"
                    placeholder="+7 900 000-00-00"
                    keyboardType="phone-pad"
                    maxLength={18}
                    value={phone}
                    onChangeText={(value) => setPhone(formatRussianPhone(value))}
                  />
                ) : (
                  <TextField
                    label="Email"
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                )}
                <Button
                  label="Получить код"
                  loading={loading}
                  onPress={tab === "phone" ? startPhoneOtp : startEmailOtp}
                />
              </>
            ) : (
              <>
                <TextField
                  label={tab === "phone" ? "Код из SMS" : "Код из письма"}
                  placeholder={tab === "phone" ? "0000" : "123456"}
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                />
                <Button label="Подтвердить" loading={loading} onPress={verifyOtp} />
                <Button label="Изменить" variant="ghost" onPress={resetChallenge} />
              </>
            )}
          </View>

          <OAuthButtons />

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
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  tabActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  tabText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.pink,
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
