import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import type { UpdateProfilePayload } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { AvatarManager } from "@/components/avatar/AvatarManager";
import { AnthropometryFields } from "@/components/profile/AnthropometryFields";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { BodyText, Button, Card, DisplayTitle, Eyebrow, SectionTitle } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { legalLinks } from "@/lib/legal-links";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

type ProfileEditorProps = {
  showBackButton?: boolean;
  showQuickLinks?: boolean;
};

export function ProfileEditor({ showBackButton = false, showQuickLinks = true }: ProfileEditorProps) {
  const router = useRouter();
  const { api, profile, phone, accessToken, logout, refreshProfile } = useSession();

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [bustCm, setBustCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [clothingSize, setClothingSize] = useState("M");
  const [shoeSizeEu, setShoeSizeEu] = useState("");
  const [hideFace, setHideFace] = useState(true);
  const [hideBackground, setHideBackground] = useState(false);
  const [activeAvatarPhotoPath, setActiveAvatarPhotoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setGender(profile.gender ?? "");
    setHideFace(profile.privacy?.faceHidden ?? true);
    setHideBackground(profile.privacy?.backgroundHidden ?? false);
    setHeightCm(profile.anthropometry?.heightCm ? String(profile.anthropometry.heightCm) : "");
    setBustCm(profile.anthropometry?.bustCm ? String(profile.anthropometry.bustCm) : "");
    setWaistCm(profile.anthropometry?.waistCm ? String(profile.anthropometry.waistCm) : "");
    setHipsCm(profile.anthropometry?.hipsCm ? String(profile.anthropometry.hipsCm) : "");
    setClothingSize(profile.anthropometry?.clothingSize ?? "M");
    setShoeSizeEu(profile.anthropometry?.shoeSizeEu ? String(profile.anthropometry.shoeSizeEu) : "");
  }, [profile]);

  useEffect(() => {
    if (!accessToken || !profile?.activeAvatarId) {
      setActiveAvatarPhotoPath(null);
      return;
    }
    let cancelled = false;
    void api.listAvatars().then(({ items }) => {
      if (cancelled) return;
      const active = items.find((item) => item.id === profile.activeAvatarId);
      setActiveAvatarPhotoPath(active?.photoProcessedUrl ?? active?.photoOriginalUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, api, profile?.activeAvatarId]);

  function handleLogout() {
    Alert.alert("Выйти из профиля", "Завершить сессию на этом устройстве?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload: UpdateProfilePayload = {
      displayName: displayName.trim() || undefined,
      gender: gender || undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      bustCm: bustCm ? Number(bustCm) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      hipsCm: hipsCm ? Number(hipsCm) : undefined,
      clothingSize,
      shoeSizeEu: shoeSizeEu ? Number(shoeSizeEu) : undefined,
      privacyFaceHidden: hideFace,
      privacyBackgroundHidden: hideBackground,
      privacyFeaturesHidden: false,
    };
    try {
      await api.updateProfile(payload);
      await refreshProfile();
      setMessage("Профиль сохранён");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (confirmDelete !== "УДАЛИТЬ") {
      setError('Введите слово «УДАЛИТЬ» для подтверждения');
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount("DELETE");
      await logout();
      router.replace("/welcome");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось удалить аккаунт");
      setDeleting(false);
    }
  }

  const genderLabel =
    gender === "female" ? "Женский" : gender === "male" ? "Мужской" : gender === "other" ? "Другой" : "Не указан";

  const planLabel =
    profile?.plan === "elite" ? "Elite" : profile?.plan === "wibe" ? "Wibe" : "Trial";

  const LINKS = [
    { label: "Избранное", icon: "heart" as const, href: "/favorites" },
    { label: "Тарифы Wibe / Elite", icon: "star" as const, href: "/paywall" },
  ];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {showBackButton ? (
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.black} />
          </Pressable>
        ) : null}

        <Eyebrow>Профиль</Eyebrow>
        <DisplayTitle>{displayName.trim() || "Мой профиль"}</DisplayTitle>

        <Card>
          <View style={styles.accountRow}>
            <View style={styles.accountMeta}>
              {phone ? <BodyText>Аккаунт: {phone}</BodyText> : null}
              <BodyText>Пол: {genderLabel}</BodyText>
              {profile ? (
                <BodyText>
                  Тариф: {planLabel}
                  {profile.plan === "trial" ? ` · осталось ${profile.trialGenerationsLeft} примерок` : ""}
                </BodyText>
              ) : null}
            </View>
            {activeAvatarPhotoPath ? (
              <AuthenticatedImage
                path={activeAvatarPhotoPath}
                accessToken={accessToken}
                style={styles.avatarThumb}
              />
            ) : null}
          </View>
          <Button label="Выйти из профиля" variant="secondary" onPress={handleLogout} style={styles.logoutBtn} />
        </Card>

        <Card>
          <SectionTitle>Подписка</SectionTitle>
          {profile ? (
            <View style={styles.subscriptionMeta}>
              <Text style={styles.planStrong}>{planLabel}</Text>
              {profile.plan === "trial" ? (
                <BodyText>Бесплатных примерок: {profile.trialGenerationsLeft}</BodyText>
              ) : profile.planGenerationsLeft != null ? (
                <BodyText>Генераций в периоде: {profile.planGenerationsLeft}</BodyText>
              ) : (
                <BodyText>Активная подписка</BodyText>
              )}
              {profile.subscriptionExpiresAt ? (
                <BodyText>
                  Действует до: {new Date(profile.subscriptionExpiresAt).toLocaleDateString("ru-RU")}
                </BodyText>
              ) : null}
            </View>
          ) : null}
          <Button label="Тарифы и подписка" variant="secondary" onPress={() => router.push("/paywall")} />
        </Card>

        <Card>
          <SectionTitle>Основной аватар</SectionTitle>
          <BodyText>Текущий образ для примерки и настройки приватности.</BodyText>
          <View style={styles.previewBox}>
            {activeAvatarPhotoPath ? (
              <AuthenticatedImage
                path={activeAvatarPhotoPath}
                accessToken={accessToken}
                style={styles.previewImage}
                contentFit="contain"
              />
            ) : (
              <Text style={styles.previewEmpty}>Загрузите аватар ниже</Text>
            )}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Скрыть лицо в ленте</Text>
            <Switch value={hideFace} onValueChange={setHideFace} trackColor={{ true: colors.pink }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Скрыть фон</Text>
            <Switch value={hideBackground} onValueChange={setHideBackground} trackColor={{ true: colors.pink }} />
          </View>
        </Card>

        <Card>
          <AvatarManager
            activeAvatarId={profile?.activeAvatarId}
            hideFace={hideFace}
            hideBackground={hideBackground}
          />
        </Card>

        <Card>
          <SectionTitle>Данные профиля</SectionTitle>
          <BodyText>Имя, пол и антропометрия — нужны для активации аватаров и примерки.</BodyText>

          <TextField label="Имя для отображения" value={displayName} onChangeText={setDisplayName} maxLength={80} />

          <View style={styles.genderBlock}>
            <Text style={styles.fieldLabel}>Пол</Text>
            <View style={styles.genderRow}>
              {(
                [
                  { value: "female", label: "Женский" },
                  { value: "male", label: "Мужской" },
                  { value: "other", label: "Другой" },
                ] as const
              ).map((option) => (
                <Pressable
                  key={option.value}
                  style={[styles.genderPill, gender === option.value && styles.genderPillActive]}
                  onPress={() => setGender(option.value)}
                >
                  <Text style={[styles.genderText, gender === option.value && styles.genderTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.anthroBlock}>
            <Text style={styles.fieldLabel}>Антропометрия</Text>
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
          </View>

          <Button label={saving ? "Сохраняем…" : "Сохранить профиль"} loading={saving} onPress={saveProfile} />
          {message ? <Text style={styles.success}>{message}</Text> : null}
        </Card>

        <Card style={styles.dangerCard}>
          <SectionTitle>Удалить аккаунт</SectionTitle>
          <BodyText>
            Безвозвратно удалятся профиль, аватары, примерки и медиа. Это действие нельзя отменить.
          </BodyText>
          <TextField
            label='Подтверждение: введите «УДАЛИТЬ»'
            value={confirmDelete}
            onChangeText={setConfirmDelete}
            autoCapitalize="characters"
          />
          <Button
            label={deleting ? "Удаляем…" : "Удалить аккаунт навсегда"}
            variant="ghost"
            loading={deleting}
            onPress={deleteAccount}
          />
        </Card>

        {showQuickLinks ? (
          <View style={styles.links}>
            {LINKS.map((link) => (
              <Pressable
                key={link.href}
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
                onPress={() => router.push(link.href as never)}
              >
                <Feather name={link.icon} size={18} color={colors.pink} />
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Feather name="chevron-right" size={18} color={colors.eyebrow} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.legalLinks}>
          <Text style={styles.legalLink} onPress={() => void Linking.openURL(legalLinks.privacy)}>
            Политика конфиденциальности
          </Text>
          <Text style={styles.legalLink} onPress={() => void Linking.openURL(legalLinks.terms)}>
            Пользовательское соглашение
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -spacing.sm,
  },
  accountRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  accountMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  avatarThumb: {
    width: 72,
    height: 96,
    borderRadius: radius.md,
  },
  logoutBtn: {
    marginTop: spacing.md,
  },
  subscriptionMeta: {
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  planStrong: {
    fontFamily: "Manrope_500Medium",
    fontSize: 20,
    color: colors.violet,
  },
  previewBox: {
    marginTop: spacing.md,
    minHeight: 280,
    borderRadius: radius.xxl,
    backgroundColor: colors.pinkBg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    minHeight: 280,
  },
  previewEmpty: {
    fontFamily: "Manrope_400Regular",
    color: colors.muted,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  toggleLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    color: colors.black,
    flex: 1,
    paddingRight: spacing.md,
  },
  genderBlock: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.black,
  },
  genderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  genderPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  genderPillActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  genderText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.muted,
  },
  genderTextActive: {
    color: colors.pink,
  },
  anthroBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dangerCard: {
    borderColor: colors.danger,
  },
  links: {
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  linkPressed: {
    backgroundColor: colors.pinkBg,
  },
  linkLabel: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: colors.black,
  },
  success: {
    color: colors.violet,
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
  },
  legalLinks: {
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  legalLink: {
    color: colors.pink,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
});
