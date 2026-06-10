import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WibeStyleApiClient } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { getApiBaseUrl } from "@/lib/config";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import { colors, spacing } from "@/theme/tokens";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accessToken?: string; refreshToken?: string; newUser?: string }>();
  const { setAuth } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = params.accessToken;
    if (!accessToken) {
      setError("Не получили токен авторизации");
      return;
    }

    void (async () => {
      try {
        const meClient = new WibeStyleApiClient({
          baseUrl: getApiBaseUrl(),
          getAccessToken: () => accessToken,
        });
        const me = await meClient.me();
        setAuth(
          accessToken,
          me.user.phone ?? me.user.email ?? me.user.login ?? "",
          me.profile,
          params.refreshToken,
          undefined,
        );
        router.replace(
          resolvePostAuthRoute({
            newUser: params.newUser === "true",
            hasActiveAvatar: Boolean(me.profile.activeAvatarId),
          }) as never,
        );
      } catch {
        setError("Не удалось завершить вход");
      }
    })();
  }, [params.accessToken, params.refreshToken, params.newUser, router, setAuth]);

  return (
    <Screen>
      <View style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.pink} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
});
