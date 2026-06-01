import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { canStartGeneration } from "@/lib/onboarding-flow";
import type { RNFile } from "@/lib/mobile-api";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const CATEGORIES = [
  { id: "dress", label: "Платье" },
  { id: "top", label: "Верх" },
  { id: "pants", label: "Брюки" },
  { id: "jacket", label: "Куртка" },
  { id: "shoes", label: "Обувь" },
  { id: "other", label: "Другое" },
];

export default function TryOnPhotoScreen() {
  const router = useRouter();
  const { api, uploads, profile, ensureSession, refreshProfile } = useSession();
  const [photo, setPhoto] = useState<RNFile | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [category, setCategory] = useState("dress");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickPhoto(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Нужен доступ", "Разреши доступ к камере или галерее.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true, aspect: [3, 4] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsEditing: true, aspect: [3, 4] });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    const file: RNFile = {
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: "garment.jpg",
    };
    setPhoto(file);
    try {
      const classified = await uploads.classifyGarmentPhoto(file);
      setCategory(classified.classification.category);
      setTitle(classified.classification.title);
    } catch {
      /* keep manual category */
    }
  }

  async function generate() {
    if (!photo) {
      setError("Выбери фото вещи");
      return;
    }
    const ok = await ensureSession();
    if (!ok) {
      router.replace("/auth");
      return;
    }
    if (profile && !canStartGeneration(profile)) {
      router.push("/paywall");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sessionPayload = await uploads.createPhotoTryOnSession(
        photo,
        category,
        "gallery_upload",
        undefined,
        title || undefined,
      );
      await api.generateTryOn(sessionPayload.session.id);
      await refreshProfile();
      router.replace(`/try-on/result/${sessionPayload.session.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось запустить примерку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>

        <Eyebrow>Фото вещи</Eyebrow>
        <DisplayTitle>Примерить по фото</DisplayTitle>
        <BodyText>Сфотографируй вещь или выбери из галереи — как на карточке маркетплейса.</BodyText>

        <Pressable style={styles.photoBox} onPress={() => pickPhoto("library")}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <Text style={styles.photoHint}>Нажми, чтобы выбрать фото</Text>
          )}
        </Pressable>

        <View style={styles.actions}>
          <Button label="Камера" variant="secondary" onPress={() => pickPhoto("camera")} />
          <Button label="Галерея" variant="secondary" onPress={() => pickPhoto("library")} />
        </View>

        <Text style={styles.label}>Категория</Text>
        <View style={styles.categories}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.catPill, category === item.id && styles.catPillActive]}
              onPress={() => setCategory(item.id)}
            >
              <Text style={[styles.catText, category === item.id && styles.catTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Запустить AI-примерку" loading={loading} onPress={generate} />
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
  photoBox: {
    height: 280,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoHint: {
    fontFamily: "Manrope_400Regular",
    color: colors.muted,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  label: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.black,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  catPillActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  catText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.muted,
  },
  catTextActive: {
    color: colors.pink,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
  },
});
