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
import { AnthropometryFields } from "@/components/profile/AnthropometryFields";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { preparePickedImageForUpload } from "@/lib/image-upload";
import type { RNFile } from "@/lib/mobile-api";

const defaultAvatarSample = require("../../assets/avatar/default-avatar-sample.webp");

export default function AvatarOnboardingScreen() {
  const router = useRouter();
  const { api, uploads, refreshProfile, completeOnboardingStep, ensureSession } = useSession();
  const [gender, setGender] = useState<"female" | "male">("female");
  const [heightCm, setHeightCm] = useState("170");
  const [bustCm, setBustCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [clothingSize, setClothingSize] = useState("M");
  const [shoeSizeEu, setShoeSizeEu] = useState("");
  const [photo, setPhoto] = useState<RNFile | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarGuidance, setAvatarGuidance] = useState<{ title?: string; message?: string } | null>(null);

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
    const prepared = await preparePickedImageForUpload(asset, "avatar.jpg");
    setPreviewUri(prepared.uri);
    setPhoto(prepared);
    setAvatarGuidance(null);
  }

  async function submit() {
    if (!photo) {
      setError("Загрузи фото в полный рост");
      return;
    }
    if (!heightCm || !bustCm || !waistCm || !hipsCm) {
      setError("Заполни рост, грудь, талию и бёдра — они нужны для примерки");
      return;
    }
    setLoading(true);
    setError(null);
    setAvatarGuidance(null);
    let createdAvatarId: string | null = null;
    let avatarActivated = false;
    try {
      await api.updateProfile({
        gender,
        heightCm: Number(heightCm) || undefined,
        bustCm: Number(bustCm) || undefined,
        waistCm: Number(waistCm) || undefined,
        hipsCm: Number(hipsCm) || undefined,
        clothingSize,
        shoeSizeEu: shoeSizeEu ? Number(shoeSizeEu) : undefined,
      });
      const created = await api.createAvatar({});
      createdAvatarId = created.avatar.id;
      await uploads.uploadAvatarPhoto(api, created.avatar.id, photo);
      const validation = await api.validateAvatar(created.avatar.id);
      if (validation.recommendedAction === "replace_photo" || validation.avatar.status === "VALIDATION_FAILED") {
        setAvatarGuidance({
          title: validation.guidanceTitle,
          message: validation.guidanceMessage,
        });
        await api.deleteAvatar(created.avatar.id).catch(() => undefined);
        return;
      }
      await api.preprocessAvatar(created.avatar.id);
      await api.activateAvatar(created.avatar.id);
      avatarActivated = true;
      await refreshProfile();
      completeOnboardingStep("avatar");
      router.replace("/(main)/home");
    } catch (err) {
      if (createdAvatarId && !avatarActivated) {
        await api.deleteAvatar(createdAvatarId).catch(() => undefined);
      }
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

          <View style={styles.privacyNote}>
            <Text style={styles.privacyTitle}>Аватар — это приватная зона</Text>
            <Text style={styles.privacyText}>
              Ваше фото никогда не видно другим пользователям. Оно используется только в вашем аккаунте,
              чтобы примерка точнее сохраняла фигуру и посадку одежды.
            </Text>
          </View>

          <Pressable style={styles.photoBox} onPress={pickPhoto}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.photo} contentFit="cover" />
            ) : (
              <Image source={defaultAvatarSample} style={styles.photo} contentFit="contain" />
            )}
            {!previewUri ? <Text style={styles.sampleWatermark}>ОБРАЗЕЦ</Text> : null}
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

          <AnthropometryFields
            required
            heightCm={heightCm}
            bustCm={bustCm}
            waistCm={waistCm}
            hipsCm={hipsCm}
            clothingSize={clothingSize}
            shoeSizeEu={shoeSizeEu}
            onChange={(field, value) => {
              if (field === "heightCm") setHeightCm(value);
              if (field === "bustCm") setBustCm(value);
              if (field === "waistCm") setWaistCm(value);
              if (field === "hipsCm") setHipsCm(value);
              if (field === "clothingSize") setClothingSize(value);
              if (field === "shoeSizeEu") setShoeSizeEu(value);
            }}
          />

          {avatarGuidance?.message ? (
            <View style={styles.guidanceBox}>
              <Text style={styles.guidanceTitle}>
                {avatarGuidance.title ?? "Подберём кадр, на котором примерка получится точнее"}
              </Text>
              <Text style={styles.guidanceText}>{avatarGuidance.message}</Text>
            </View>
          ) : null}

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
  sampleWatermark: {
    position: "absolute",
    color: "rgba(90, 80, 88, 0.52)",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 36,
    letterSpacing: 4,
    transform: [{ rotate: "-28deg" }],
  },
  privacyNote: {
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: "#f6fbef",
    padding: spacing.md,
    gap: spacing.xs,
  },
  privacyTitle: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.black,
    fontSize: 15,
  },
  privacyText: {
    fontFamily: "Manrope_400Regular",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
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
  guidanceBox: {
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  guidanceTitle: {
    fontFamily: "Manrope_600SemiBold",
    color: colors.pink,
    fontSize: 14,
  },
  guidanceText: {
    fontFamily: "Manrope_400Regular",
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
  },
});
