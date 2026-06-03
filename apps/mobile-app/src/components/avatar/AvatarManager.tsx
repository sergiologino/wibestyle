import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { ApiError } from "@wibestyle/api-client";
import type { AvatarRecord } from "@wibestyle/shared-types";
import { MAX_AVATARS_PER_USER } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { BodyText, Button, SectionTitle } from "@/components/ui/Button";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import type { RNFile } from "@/lib/mobile-api";

type AvatarThumbProps = {
  avatar: AvatarRecord;
  active: boolean;
  accessToken: string | null;
  busy: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

function AvatarThumb({ avatar, active, accessToken, busy, onSelect, onDelete }: AvatarThumbProps) {
  const photoPath = avatar.photoProcessedUrl ?? avatar.photoOriginalUrl;

  return (
    <View style={[styles.thumb, active && styles.thumbActive]}>
      <View style={styles.thumbImageWrap}>
        {photoPath ? (
          <AuthenticatedImage path={photoPath} accessToken={accessToken} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbPlaceholderText}>Нет фото</Text>
          </View>
        )}
      </View>
      <View style={styles.thumbActions}>
        {active ? <Text style={styles.activeBadge}>По умолчанию</Text> : null}
        {!active ? (
          <Button label="Сделать основным" size="sm" variant="secondary" disabled={busy} onPress={onSelect} />
        ) : null}
        {!active && avatar.status !== "DELETED" ? (
          <Button label="Удалить" size="sm" variant="ghost" disabled={busy} onPress={onDelete} />
        ) : null}
      </View>
    </View>
  );
}

type AvatarManagerProps = {
  hideFace: boolean;
  hideBackground: boolean;
  activeAvatarId?: string | null;
};

export function AvatarManager({ hideFace, hideBackground, activeAvatarId }: AvatarManagerProps) {
  const { api, uploads, accessToken, refreshProfile } = useSession();
  const [avatars, setAvatars] = useState<AvatarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newPhoto, setNewPhoto] = useState<RNFile | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await api.listAvatars();
      setAvatars(items.filter((item) => item.status !== "DELETED"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить аватары");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
    setNewPhoto({
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: "avatar.jpg",
    });
  }

  async function activateAvatar(avatarId: string) {
    setBusy(true);
    setError(null);
    try {
      await api.activateAvatar(avatarId);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось активировать аватар");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteAvatar(avatarId: string) {
    Alert.alert("Удалить аватар", "Этот образ будет удалён без возможности восстановления.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => void deleteAvatar(avatarId),
      },
    ]);
  }

  async function deleteAvatar(avatarId: string) {
    setBusy(true);
    setError(null);
    try {
      await api.deleteAvatar(avatarId);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось удалить аватар");
    } finally {
      setBusy(false);
    }
  }

  async function addAvatar() {
    if (!newPhoto) {
      setError("Выберите фото для нового аватара");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { avatar } = await api.createAvatar({
        privacyFaceHidden: hideFace,
        privacyBackgroundHidden: hideBackground,
        privacyFeaturesHidden: false,
      });
      await uploads.uploadAvatarPhoto(api, avatar.id, newPhoto);
      await api.validateAvatar(avatar.id);
      await api.preprocessAvatar(avatar.id);
      await api.activateAvatar(avatar.id);
      setNewPhoto(null);
      setPreviewUri(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось добавить аватар");
    } finally {
      setBusy(false);
    }
  }

  const atAvatarLimit = avatars.length >= MAX_AVATARS_PER_USER;
  const additionalAvatars = avatars.filter((avatar) => avatar.id !== activeAvatarId && !avatar.active);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <SectionTitle>Мои аватары</SectionTitle>
          <BodyText>До {MAX_AVATARS_PER_USER} образов. Размеры задаются в антропометрии ниже.</BodyText>
        </View>
        <Button
          label={adding ? "Отмена" : "+ Новый"}
          size="sm"
          variant="secondary"
          disabled={atAvatarLimit && !adding}
          onPress={() => {
            setAdding((value) => !value);
            if (adding) {
              setNewPhoto(null);
              setPreviewUri(null);
            }
          }}
        />
      </View>

      {atAvatarLimit ? (
        <Text style={styles.limitNote}>
          Достигнут лимит — {MAX_AVATARS_PER_USER} аватара. Удалите неиспользуемый, чтобы добавить новый.
        </Text>
      ) : null}

      {adding ? (
        <View style={styles.addPanel}>
          <Pressable style={styles.photoBox} onPress={pickPhoto}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.photo} contentFit="cover" />
            ) : (
              <Text style={styles.photoHint}>Нажми, чтобы выбрать фото в полный рост</Text>
            )}
          </Pressable>
          <Button label={busy ? "Загружаем…" : "Сохранить новый аватар"} loading={busy} disabled={!newPhoto} onPress={addAvatar} />
        </View>
      ) : null}

      {loading ? <BodyText>Загружаем аватары…</BodyText> : null}

      {!loading && additionalAvatars.length === 0 ? (
        <BodyText>Дополнительных аватаров пока нет. Основной образ показан выше.</BodyText>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {additionalAvatars.map((avatar) => (
            <AvatarThumb
              key={avatar.id}
              avatar={avatar}
              active={avatar.active}
              accessToken={accessToken}
              busy={busy}
              onSelect={() => void activateAvatar(avatar.id)}
              onDelete={() => confirmDeleteAvatar(avatar.id)}
            />
          ))}
        </ScrollView>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  limitNote: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.muted,
    backgroundColor: colors.pinkBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  addPanel: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
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
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  thumbRow: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  thumb: {
    width: 160,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  thumbActive: {
    borderColor: colors.pink,
    borderWidth: 2,
  },
  thumbImageWrap: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.pinkBg,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbPlaceholderText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    color: colors.eyebrow,
  },
  thumbActions: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  activeBadge: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: colors.pink,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
  },
});
