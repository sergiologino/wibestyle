import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import type { RNFile } from "@/lib/mobile-api";

export default function AvatarOnboardingScreen() {
  const router = useRouter();
  const { api, uploads, refreshProfile, completeOnboardingStep, ensureSession } = useSession();
  const [gender, setGender] = useState<"female" | "male">("female");
  const [heightCm, setHeightCm] = useState("170");
  const [photo, setPhoto] = useState<RNFile | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void ensureSession();
  }, [ensureSession]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Нужен доступ", "Разреши доступ к галерее для загрузки фото.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setPhoto({
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: "avatar.jpg",
    });
  }

  async function submit() {
    if (!photo) {
      setError("Загрузи фото в полный рост");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.updateProfile({
        gender,
        heightCm: Number(heightCm) || undefined,
      });
      const created = await api.createAvatar({});
      await uploads.uploadAvatarPhoto(api, created.avatar.id, photo);
      await api.validateAvatar(created.avatar.id);
      await api.preprocessAvatar(created.avatar.id);
      await api.activateAvatar(created.avatar.id);
      await refreshProfile();
      completeOnboardingStep("avatar");
      router.replace("/(main)/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось создать аватар");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Eyebrow>Шаг 1</Eyebrow>
          <DisplayTitle>Твоё фото для примерки</DisplayTitle>
          <BodyText>Фото в полный рост, облегающая одежда, нейтральный фон — так AI точнее «наденет» вещь.</BodyText>

          <Pressable style={styles.photoBox} onPress={pickPhoto}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.photo} contentFit="cover" />
            ) : (
              <Text style={styles.photoHint}>Нажми, чтобы выбрать фото</Text>
            )}
          </Pressable>

          <View style={styles.genderRow}>
            {(["female", "male"] as const).map((value) => (
              <Pressable
                key={value}
                style={[styles.genderPill, gender === value && styles.genderPillActive]}
                onPress={() => setGender(value)}
              >
                <Text style={[styles.genderText, gender === value && styles.genderTextActive]}>
                  {value === "female" ? "Женский" : "Мужской"}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextField
            label="Рост (см)"
            keyboardType="number-pad"
            value={heightCm}
            onChangeText={setHeightCm}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Сохранить и продолжить" loading={loading} onPress={submit} />
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
  photoBox: {
    height: 360,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoHint: {
    fontFamily: "Manrope_400Regular",
    color: colors.muted,
    fontSize: 15,
  },
  genderRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  genderPillActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  genderText: {
    fontFamily: "Manrope_500Medium",
    color: colors.muted,
  },
  genderTextActive: {
    color: colors.pink,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
  },
});
