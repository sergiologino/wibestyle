import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ApiError, WibeStyleApiClient } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { getApiBaseUrl } from "@/lib/config";
import { legalLinks } from "@/lib/legal-links";
import { formatRussianPhone, getRussianNationalPhoneDigits, isRussianPhoneComplete } from "@/lib/phone-mask";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import { colors, spacing } from "@/theme/tokens";
import { readVisitorId, trackMobileMarketingEvent } from "@/lib/marketing-visitor";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { DEFAULT_OTP_RESEND_SECONDS, formatCountdown, secondsUntil } from "@/lib/otp-countdown";

export default function AuthScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ ref?: string; next?: string }>();
  const { api, setAuth } = useSession();
  const [phone, setPhone] = useState("+7 ");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resendSecondsLeft = secondsUntil(resendAvailableAt, nowMs);

  useEffect(() => {
    if (!requestId || resendSecondsLeft === 0) return;
    const intervalId = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, [requestId, resendSecondsLeft]);

  async function startOtp() {
    if (!isRussianPhoneComplete(phone)) {
      setError("Введите номер российского мобильного телефона полностью.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.startOtp(`+7${getRussianNationalPhoneDigits(phone)}`);
      setRequestId(result.requestId);
      setCode("");
      setNowMs(Date.now());
      setResendAvailableAt(Date.now() + (result.resendIn ?? DEFAULT_OTP_RESEND_SECONDS) * 1_000);
      void trackMobileMarketingEvent("signup_started", { method: "sms_otp" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить код. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!requestId) return;
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError("Введите код из SMS.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const auth = await api.verifyOtp(
        requestId,
        code.trim(),
        undefined,
        typeof searchParams.ref === "string" ? searchParams.ref : undefined,
        await readVisitorId() ?? undefined,
        await getOrCreateDeviceId(),
      );
      const meClient = new WibeStyleApiClient({
        baseUrl: getApiBaseUrl(),
        getAccessToken: () => auth.accessToken,
      });
      const me = await meClient.me();
      setAuth(
        auth.accessToken,
        auth.user.phone ?? me.user.phone ?? me.user.login ?? me.user.email ?? "",
        me.profile,
        auth.refreshToken,
        auth.expiresIn,
      );
      if (auth.device?.previousRegistrationOnDevice) {
        Alert.alert(
          "Устройство уже использовалось",
          "На этом устройстве уже была регистрация. Бесплатные примерки ограничены общим лимитом устройства.",
        );
      }
      router.replace(resolvePostAuthRoute({
        newUser: Boolean(auth.newUser),
        hasActiveAvatar: Boolean(me.profile.activeAvatarId),
        nextParam: typeof searchParams.next === "string" ? searchParams.next : null,
      }) as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Неверный код. Проверьте SMS или запросите новый.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Eyebrow>Вход</Eyebrow>
        <DisplayTitle>{requestId ? "Введите код из SMS" : "Добро пожаловать"}</DisplayTitle>
        <BodyText>
          {requestId
            ? `Мы отправили код на ${formatRussianPhone(phone)}.`
            : "Войдите по номеру телефона — аккаунт создастся автоматически."}
        </BodyText>

        <View style={styles.form}>
          {!requestId ? (
            <>
              <TextField
                placeholder="+7 (900) 000-00-00"
                value={phone}
                onChangeText={(value) => setPhone(formatRussianPhone(value))}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
              <Button label="Получить код" loading={loading} onPress={() => void startOtp()} />
            </>
          ) : (
            <>
              <TextField
                placeholder="Код из SMS"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 8))}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={8}
              />
              <Button label="Войти" loading={loading} onPress={() => void verifyOtp()} />
              <Text style={styles.deliveryHint}>
                Код обычно приходит в течение минуты. Он действует 5 минут.
              </Text>
              <Button
                label={resendSecondsLeft > 0 ? `Отправить ещё раз через ${formatCountdown(resendSecondsLeft)}` : "Отправить код ещё раз"}
                variant="secondary"
                disabled={loading || resendSecondsLeft > 0}
                onPress={() => void startOtp()}
              />
              <Button
                label="Изменить номер"
                variant="ghost"
                disabled={loading}
                onPress={() => {
                  setRequestId(null);
                  setResendAvailableAt(null);
                }}
              />
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
  deliveryHint: {
    color: colors.muted,
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
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
