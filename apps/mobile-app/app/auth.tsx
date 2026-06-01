import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getApiBaseUrl } from "@/lib/config";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

type AuthTab = "phone" | "login";

export default function AuthScreen() {
  const router = useRouter();
  const { api, setAuth } = useSession();
  const [tab, setTab] = useState<AuthTab>("phone");
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCaptcha() {
    const captcha = await api.getCaptcha();
    setCaptchaId(captcha.challengeId);
    setCaptchaQuestion(captcha.question);
  }

  async function startOtp() {
    setError(null);
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
      const auth = await api.verifyOtp(requestId, code);
      const meClient = new WibeStyleApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken: () => auth.accessToken,
      });
      const me = await meClient.me();
      setAuth(
        auth.accessToken,
        auth.user.phone ?? me.user.login ?? me.user.email ?? "",
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
      setError("Неверный код. Для dev используй 0000.");
    } finally {
      setLoading(false);
    }
  }

  async function loginPassword() {
    setError(null);
    setLoading(true);
    try {
      if (!captchaId) await loadCaptcha();
      const captcha = captchaId ? { challengeId: captchaId } : await api.getCaptcha();
      const auth = await api.loginWithPassword({
        identifier,
        password,
        captchaId: captcha.challengeId,
        captchaAnswer,
      });
      const meClient = new WibeStyleApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken: () => auth.accessToken,
      });
      const me = await meClient.me();
      setAuth(
        auth.accessToken,
        auth.user.phone ?? auth.user.login ?? auth.user.email ?? "",
        me.profile,
        auth.refreshToken,
        auth.expiresIn,
      );
      router.replace(
        resolvePostAuthRoute({
          newUser: false,
          hasActiveAvatar: Boolean(me.profile.activeAvatarId),
        }) as never,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось войти");
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Eyebrow>Вход</Eyebrow>
          <DisplayTitle>Добро пожаловать</DisplayTitle>
          <BodyText>Войди по телефону или логину — данные синхронизируются с web-app.</BodyText>

          <View style={styles.tabs}>
            {(["phone", "login"] as AuthTab[]).map((value) => (
              <Pressable
                key={value}
                style={[styles.tab, tab === value && styles.tabActive]}
                onPress={() => {
                  setTab(value);
                  setError(null);
                  if (value === "login" && !captchaId) void loadCaptcha();
                }}
              >
                <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>
                  {value === "phone" ? "Телефон" : "Логин"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "phone" ? (
            <View style={styles.form}>
              {!requestId ? (
                <>
                  <TextField
                    label="Телефон"
                    placeholder="+7 900 000-00-00"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                  <Button label="Получить код" loading={loading} onPress={startOtp} />
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
                  <Button label="Изменить номер" variant="ghost" onPress={() => setRequestId(null)} />
                </>
              )}
            </View>
          ) : (
            <View style={styles.form}>
              <TextField label="Логин или email" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
              <TextField label="Пароль" value={password} onChangeText={setPassword} secureTextEntry />
              {captchaQuestion ? (
                <TextField
                  label={`Пример: ${captchaQuestion}`}
                  value={captchaAnswer}
                  onChangeText={setCaptchaAnswer}
                  keyboardType="number-pad"
                />
              ) : null}
              <Button label="Войти" loading={loading} onPress={loginPassword} />
            </View>
          )}

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
});
