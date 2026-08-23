import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { WibeStyleApiClient } from "@wibestyle/api-client";
import { getApiBaseUrl } from "@/lib/config";
import { shouldPromptForUpdate } from "@/lib/app-update";
import { colors, spacing } from "@/theme/tokens";

type UpdateState = {
  latestVersion: string;
  updateUrl: string;
  required: boolean;
} | null;

export default function AppUpdatePrompt() {
  const [update, setUpdate] = useState<UpdateState>(null);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  const checkUpdate = useCallback(async () => {
    const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
    const api = new WibeStyleApiClient({ baseUrl: getApiBaseUrl() });
    const config = await api.getAppConfig();
    const decision = shouldPromptForUpdate({
      currentVersion,
      latestVersion: config.android.latestVersion,
      minSupportedVersion: config.android.minSupportedVersion,
      forceUpdate: config.android.forceUpdate,
    });
    if (!decision.shouldPrompt || (!decision.required && dismissedVersion === config.android.latestVersion)) {
      return;
    }
    setUpdate({
      latestVersion: config.android.latestVersion,
      updateUrl: config.android.updateUrl,
      required: decision.required,
    });
  }, [dismissedVersion]);

  useEffect(() => {
    void checkUpdate().catch(() => undefined);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void checkUpdate().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [checkUpdate]);

  if (!update) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={() => {
        if (!update.required) {
          setDismissedVersion(update.latestVersion);
          setUpdate(null);
        }
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Доступна новая версия</Text>
          <Text style={styles.body}>
            В RuStore опубликована версия {update.latestVersion}. Обновите приложение, чтобы получить последние исправления и функции.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => void Linking.openURL(update.updateUrl)}>
            <Text style={styles.primaryButtonText}>Открыть RuStore</Text>
          </Pressable>
          {!update.required ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setDismissedVersion(update.latestVersion);
                setUpdate(null);
              }}
            >
              <Text style={styles.secondaryButtonText}>Позже</Text>
            </Pressable>
          ) : (
            <Text style={styles.requiredHint}>Эту версию нужно обновить для продолжения работы.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(48,38,55,0.42)",
  },
  card: {
    gap: spacing.md,
    borderRadius: 28,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  title: {
    color: colors.black,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 22,
  },
  body: {
    color: colors.muted,
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.pink,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  requiredHint: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
