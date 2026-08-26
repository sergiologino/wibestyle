import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { BodyText, Button, SectionTitle } from "@/components/ui/Button";
import { useSession } from "@/context/SessionProvider";
import { preparePickedImageForUpload } from "@/lib/image-upload";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const PORTRAIT_URL = "/api/v1/profile/hairstyle-portrait/image";

export function HairstylePortraitManager() {
  const { api, uploads, ensureSession, accessToken, sessionReady, profile } = useSession();
  const [portraitPath, setPortraitPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionReady || !profile) return;
    let cancelled = false;
    void api.getHairstylePortrait()
      .then((result) => {
        if (!cancelled) {
          setPortraitPath(result.exists ? `${result.imageUrl ?? PORTRAIT_URL}?v=${Date.now()}` : null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, profile, sessionReady]);

  async function pick(source: "camera" | "library") {
    const permission = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Нужен доступ", "Разреши доступ к камере или галерее.");
      return;
    }
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true, aspect: [1, 1], cameraType: ImagePicker.CameraType.front })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || !result.assets[0]) return;

    setBusy(true);
    setError(null);
    try {
      if (!(await ensureSession())) {
        setError("Войдите в аккаунт, чтобы сохранить портрет.");
        return;
      }
      const file = await preparePickedImageForUpload(result.assets[0], "hair-portrait.jpg", 1200);
      const uploaded = await uploads.uploadHairstylePortrait(file);
      setPortraitPath(`${uploaded.imageUrl ?? PORTRAIT_URL}?v=${Date.now()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить портрет. Попробуйте другое фото.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <SectionTitle>Портрет для причёсок</SectionTitle>
      <BodyText>Отдельный крупный портрет от макушки до плеч. Он не заменяет аватар для одежды.</BodyText>
      <Pressable style={styles.preview} onPress={() => void pick("library")}>
        {portraitPath ? (
          <AuthenticatedImage path={portraitPath} accessToken={accessToken} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.empty}>
            <Feather name="user" size={30} color={colors.pink} />
            <Text style={styles.emptyText}>Загрузить портрет</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.actions}>
        <Button label="Камера" variant="secondary" loading={busy} onPress={() => void pick("camera")} />
        <Button label={portraitPath ? "Заменить" : "Галерея"} variant="secondary" loading={busy} onPress={() => void pick("library")} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  preview: {
    height: 190,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  empty: { alignItems: "center", gap: spacing.sm },
  emptyText: { color: colors.pink, fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  actions: { flexDirection: "row", gap: spacing.sm },
  error: { color: colors.danger, fontFamily: "Manrope_400Regular", fontSize: 13 },
});
