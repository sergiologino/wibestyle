import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function SettingsScreen() {
  const router = useRouter();
  const { api, profile, refreshProfile, logout } = useSession();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [heightCm, setHeightCm] = useState(String(profile?.anthropometry?.heightCm ?? ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      await api.updateProfile({
        displayName: displayName.trim() || undefined,
        heightCm: Number(heightCm) || undefined,
      });
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Удалить аккаунт", "Это действие необратимо. Все данные будут удалены.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await api.deleteAccount("DELETE");
          await logout();
          router.replace("/welcome");
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>
        <Eyebrow>Профиль</Eyebrow>
        <DisplayTitle>Настройки</DisplayTitle>

        <TextField label="Имя" value={displayName} onChangeText={setDisplayName} />
        <TextField label="Рост (см)" keyboardType="number-pad" value={heightCm} onChangeText={setHeightCm} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Сохранить" loading={loading} onPress={save} />

        <View style={styles.dangerZone}>
          <BodyText>Удаление аккаунта удалит аватары, примерки и подписку trial.</BodyText>
          <Button label="Удалить аккаунт" variant="ghost" onPress={confirmDelete} />
        </View>
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
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
  },
  dangerZone: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
});
