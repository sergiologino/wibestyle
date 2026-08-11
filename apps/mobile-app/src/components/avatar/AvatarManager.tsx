import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { BeforeAfterSlider } from "@/components/try-on/BeforeAfterSlider";
import { BodyText, Button, SectionTitle } from "@/components/ui/Button";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { preparePickedImageForUpload } from "@/lib/image-upload";
import { buildProductImageSource, type RNFile } from "@/lib/mobile-api";
import { getApiBaseUrl, getAppBaseUrl } from "@/lib/config";

const defaultAvatarSample = require("../../../assets/avatar/default-avatar-sample.webp");

type AvatarThumbProps = {
  avatar: AvatarRecord;
  active: boolean;
  accessToken: string | null;
  busy: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEnhance: () => void;
};

function AvatarThumb({ avatar, active, accessToken, busy, onSelect, onDelete, onEnhance }: AvatarThumbProps) {
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
        {avatar.enhancementRecommended ? (
          <Button label="Улучшить фото" size="sm" variant="secondary" disabled={busy} onPress={onEnhance} />
        ) : null}
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

type ProcessingOverlayProps = {
  label: string;
};

function ProcessingOverlay({ label }: ProcessingOverlayProps) {
  return (
    <View style={styles.processingOverlay}>
      <View style={styles.processingCard}>
        <ActivityIndicator color={colors.pink} size="small" />
        <Text style={styles.processingText}>{label}</Text>
      </View>
    </View>
  );
}

type AvatarCandidatePanelProps = {
  avatar: AvatarRecord;
  accessToken: string | null;
  busy: boolean;
  processingLabel?: string | null;
  onEnhance: () => void;
  onSaveOriginal: () => void;
};

function AvatarCandidatePanel({
  avatar,
  accessToken,
  busy,
  processingLabel,
  onEnhance,
  onSaveOriginal,
}: AvatarCandidatePanelProps) {
  const photoPath = avatar.photoOriginalUrl ?? avatar.photoProcessedUrl;
  return (
    <View style={styles.reviewPanel}>
      <Text style={styles.reviewBadge}>Можно улучшить</Text>
      <BodyText>Фото подходит для примерки. Можно сохранить как есть или сначала улучшить фон, чёткость и одежду.</BodyText>
      <View style={styles.largePhotoBox}>
        {photoPath ? <AuthenticatedImage path={photoPath} accessToken={accessToken} style={styles.largePhoto} /> : null}
        {processingLabel ? <ProcessingOverlay label={processingLabel} /> : null}
      </View>
      <Button label="Улучшить аватар" disabled={busy} onPress={onEnhance} />
      <Button label="Сохранить этот вариант" disabled={busy} variant="secondary" onPress={onSaveOriginal} />
    </View>
  );
}

type AvatarEnhancementPanelProps = {
  avatar: AvatarRecord;
  accessToken: string | null;
  busy: boolean;
  onApply: () => void;
  onRevert: () => void;
};

function AvatarEnhancementPanel({ avatar, accessToken, busy, onApply, onRevert }: AvatarEnhancementPanelProps) {
  const originalSource = avatar.photoOriginalUrl
    ? buildProductImageSource(getApiBaseUrl(), avatar.photoOriginalUrl, accessToken, getAppBaseUrl())
    : null;
  const enhancedSource = avatar.photoEnhancedUrl
    ? buildProductImageSource(getApiBaseUrl(), avatar.photoEnhancedUrl, accessToken, getAppBaseUrl())
    : null;

  return (
    <View style={styles.enhancementPanel}>
      <SectionTitle>Сравните варианты</SectionTitle>
      <BodyText>Улучшаем фон, чёткость и одежду для точной примерки. Лицо, фигура, пропорции и поза должны сохраниться.</BodyText>
      <BeforeAfterSlider beforeSource={originalSource} afterSource={enhancedSource} height={460} />
      <Button label="Использовать улучшенный" disabled={busy} loading={busy} onPress={onApply} />
      <Button label="Оставить исходный" disabled={busy} variant="secondary" onPress={onRevert} />
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
  const [busyAction, setBusyAction] = useState<"validate" | "enhance" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newPhoto, setNewPhoto] = useState<RNFile | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [avatarGuidance, setAvatarGuidance] = useState<{ title?: string; message?: string } | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<AvatarRecord | null>(null);
  const [enhancementAvatar, setEnhancementAvatar] = useState<AvatarRecord | null>(null);
  const autoAddPhotoRef = useRef<RNFile | null>(null);

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

  useEffect(() => {
    if (!newPhoto || busy || autoAddPhotoRef.current === newPhoto) return;
    autoAddPhotoRef.current = newPhoto;
    void addAvatar(newPhoto);
  }, [newPhoto, busy]);

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
    setNewPhoto(prepared);
    setAvatarGuidance(null);
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

  async function enhanceAvatar(avatarId: string) {
    setBusy(true);
    setBusyAction("enhance");
    setError(null);
    try {
      const { avatar } = await api.enhanceAvatar(avatarId);
      setAdding(false);
      setEnhancementAvatar(avatar);
      setPendingAvatar((current) => (current?.id === avatar.id ? avatar : current));
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось улучшить фото");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function applyEnhancement() {
    if (!enhancementAvatar) return;
    setBusy(true);
    setBusyAction("save");
    setError(null);
    try {
      await api.applyAvatarEnhancement(enhancementAvatar.id);
      await api.activateAvatar(enhancementAvatar.id);
      setEnhancementAvatar(null);
      setPendingAvatar(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось применить улучшенный вариант");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function revertEnhancement() {
    if (!enhancementAvatar) return;
    setBusy(true);
    setBusyAction("save");
    setError(null);
    try {
      await api.revertAvatarEnhancement(enhancementAvatar.id);
      if (enhancementAvatar.active) await api.activateAvatar(enhancementAvatar.id);
      setEnhancementAvatar(null);
      setPendingAvatar(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось вернуть исходный вариант");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function addAvatar(photo: RNFile | null = newPhoto) {
    if (!photo) {
      setError("Выберите фото для нового аватара");
      return;
    }
    setBusy(true);
    setBusyAction("validate");
    setError(null);
    setAvatarGuidance(null);
    let createdAvatarId: string | null = null;
    let avatarActivated = false;
    try {
      const { avatar } = await api.createAvatar({
        privacyFaceHidden: hideFace,
        privacyBackgroundHidden: hideBackground,
        privacyFeaturesHidden: false,
      });
      createdAvatarId = avatar.id;
      await uploads.uploadAvatarPhoto(api, avatar.id, photo);
      const validation = await api.validateAvatar(avatar.id);
      if (validation.recommendedAction === "replace_photo" || validation.avatar.status === "VALIDATION_FAILED") {
        setAvatarGuidance({
          title: validation.guidanceTitle,
          message: validation.guidanceMessage,
        });
        setNewPhoto(null);
        setPreviewUri(null);
        return;
      }
      if (validation.recommendedAction === "continue_with_warning" || validation.warnings.length > 0) {
        setPendingAvatar(validation.avatar);
        setAdding(false);
        setNewPhoto(null);
        setPreviewUri(null);
        return;
      }
      await api.preprocessAvatar(avatar.id);
      await api.activateAvatar(avatar.id);
      avatarActivated = true;
      setNewPhoto(null);
      setPreviewUri(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      if (createdAvatarId && !avatarActivated) {
        await api.deleteAvatar(createdAvatarId).catch(() => undefined);
      }
      setError(err instanceof ApiError ? err.message : "Не удалось добавить аватар");
    } finally {
      if (autoAddPhotoRef.current === photo) {
        autoAddPhotoRef.current = null;
      }
      setBusyAction(null);
      setBusy(false);
    }
  }

  async function saveOriginalAvatar(avatarId: string) {
    setBusy(true);
    setBusyAction("save");
    setError(null);
    try {
      await api.preprocessAvatar(avatarId);
      await api.activateAvatar(avatarId);
      setPendingAvatar(null);
      setEnhancementAvatar(null);
      setAdding(false);
      await refreshProfile();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить аватар");
    } finally {
      setBusyAction(null);
      setBusy(false);
    }
  }

  const readyAvatarCount = avatars.filter((avatar) => avatar.status === "READY").length;
  const atAvatarLimit = readyAvatarCount >= MAX_AVATARS_PER_USER;
  const visibleAvatars = avatars.filter((avatar) => avatar.status === "READY");
  const reviewedAvatarId = enhancementAvatar?.id ?? pendingAvatar?.id ?? null;
  const reserveAvatars = reviewedAvatarId ? visibleAvatars.filter((avatar) => avatar.id !== reviewedAvatarId) : visibleAvatars;

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
              setAvatarGuidance(null);
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
          <Pressable disabled={busy} style={styles.photoBox} onPress={pickPhoto}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.photo} contentFit="cover" />
            ) : (
              <Image source={defaultAvatarSample} style={styles.photo} contentFit="contain" />
            )}
            {!previewUri ? <Text style={styles.sampleWatermark}>ОБРАЗЕЦ</Text> : null}
            {busyAction === "validate" ? <ProcessingOverlay label="Идёт проверка корректности фото для аватара…" /> : null}
          </Pressable>
          {avatarGuidance?.message ? (
            <View style={styles.guidanceBox}>
              <Text style={styles.guidanceTitle}>
                {avatarGuidance.title ?? "Подберём кадр, на котором примерка получится точнее"}
              </Text>
              <Text style={styles.guidanceText}>{avatarGuidance.message}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {loading ? <BodyText>Загружаем аватары…</BodyText> : null}

      {enhancementAvatar ? (
        <AvatarEnhancementPanel avatar={enhancementAvatar} accessToken={accessToken} busy={busy} onApply={applyEnhancement} onRevert={revertEnhancement} />
      ) : null}

      {!enhancementAvatar && pendingAvatar ? (
        <AvatarCandidatePanel
          avatar={pendingAvatar}
          accessToken={accessToken}
          busy={busy}
          processingLabel={busyAction === "enhance" ? "Улучшаем аватар…" : null}
          onEnhance={() => void enhanceAvatar(pendingAvatar.id)}
          onSaveOriginal={() => void saveOriginalAvatar(pendingAvatar.id)}
        />
      ) : null}

      {!loading && visibleAvatars.length === 0 && !pendingAvatar && !enhancementAvatar ? (
        <BodyText>Аватары пока не готовы.</BodyText>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {reserveAvatars.map((avatar) => (
            <AvatarThumb
              key={avatar.id}
              avatar={avatar}
              active={avatar.active}
              accessToken={accessToken}
              busy={busy}
              onSelect={() => void activateAvatar(avatar.id)}
              onDelete={() => confirmDeleteAvatar(avatar.id)}
              onEnhance={() => void enhanceAvatar(avatar.id)}
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
  sampleWatermark: {
    position: "absolute",
    color: "rgba(90, 80, 88, 0.52)",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 30,
    letterSpacing: 3,
    transform: [{ rotate: "-28deg" }],
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(48, 38, 55, 0.48)",
    padding: spacing.md,
  },
  processingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  processingText: {
    flexShrink: 1,
    color: colors.black,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
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
  reviewPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  reviewBadge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: radius.pill,
    borderWidth: hairline,
    borderColor: colors.pinkSoft,
    backgroundColor: colors.pinkBg,
    color: colors.pink,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  largePhotoBox: {
    minHeight: 420,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
    overflow: "hidden",
  },
  largePhoto: {
    width: "100%",
    height: 460,
  },
  enhancementPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xxl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
  },
  comparisonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  comparisonCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  comparisonImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  comparisonLabel: {
    padding: spacing.sm,
    color: colors.muted,
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
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
