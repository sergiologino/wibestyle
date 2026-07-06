import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WibeStyleApiClient } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { getApiBaseUrl } from "@/lib/config";
import { resolvePostAuthRoute } from "@/lib/onboarding-flow";
import { colors, spacing } from "@/theme/tokens";

export default function MobileIdCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ handoffCode?: string }>();
  const { setAuth } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.handoffCode) {
      setError("Не получен код авторизации");
      return;
    }
    void (async () => {
      try {
        const publicClient = new WibeStyleApiClient({ baseUrl: getApiBaseUrl() });
        const auth = await publicClient.exchangeMobileIdHandoff(params.handoffCode!);
        const client = new WibeStyleApiClient({
          baseUrl: getApiBaseUrl(),
          getAccessToken: () => auth.accessToken,
        });
        const me = await client.me();
        setAuth(
          auth.accessToken,
          me.user.phone ?? me.user.login ?? me.user.email ?? "",
          me.profile,
          auth.refreshToken,
          auth.expiresIn,
        );
        router.replace(resolvePostAuthRoute({
          newUser: Boolean(auth.newUser),
          hasActiveAvatar: Boolean(me.profile.activeAvatarId),
          nextParam: null,
        }) as never);
      } catch {
        setError("Не удалось завершить вход по телефону");
      }
    })();
  }, [params.handoffCode, router, setAuth]);

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
