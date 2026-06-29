import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const YANDEX_RED = "#FC3F1D";

WebBrowser.maybeCompleteAuthSession();

export function OAuthButtons({ referralCode }: { referralCode?: string }) {
  const { api } = useSession();
  const [providers, setProviders] = useState({ yandex: false, google: false });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.getOAuthProviders().then((data) => {
      setProviders({ yandex: data.yandex.enabled, google: data.google.enabled });
    }).catch(() => setProviders({ yandex: false, google: false }));
  }, [api]);

  async function start(provider: "yandex" | "google") {
    setLoading(provider);
    setError(null);
    try {
      const returnUrl = Linking.createURL("auth/oauth/callback");
      const result = await api.startOAuth(provider, { returnUrl, referralCode });
      await WebBrowser.openAuthSessionAsync(result.authorizationUrl, returnUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "OAuth временно недоступен");
    } finally {
      setLoading(null);
    }
  }

  if (!providers.yandex && !providers.google) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Или войти через</Text>
      <View style={styles.row}>
        {providers.yandex ? (
          <Pressable
            accessibilityLabel="Яндекс"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.yandexButton,
              pressed && loading === null ? styles.buttonPressed : null,
              loading !== null ? styles.buttonDisabled : null,
            ]}
            disabled={loading !== null}
            onPress={() => void start("yandex")}
          >
            <View style={styles.yandexLogo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text style={styles.yandexLogoText}>Я</Text>
            </View>
            <Text style={styles.yandexButtonText}>{loading === "yandex" ? "…" : "Яндекс"}</Text>
          </Pressable>
        ) : null}
        {providers.google ? (
          <Pressable style={styles.button} disabled={loading !== null} onPress={() => void start("google")}>
            <Text style={styles.buttonText}>{loading === "google" ? "…" : "Google"}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: colors.black,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  yandexButton: {
    backgroundColor: YANDEX_RED,
    borderColor: YANDEX_RED,
  },
  yandexLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  yandexLogoText: {
    color: YANDEX_RED,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    lineHeight: 19,
  },
  yandexButtonText: {
    color: colors.white,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  buttonText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: colors.black,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
  },
});
