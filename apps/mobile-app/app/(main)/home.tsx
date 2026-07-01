import { Alert, ScrollView, Share, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import type { TryOnHistoryItem, UserNotification } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, Card, DisplayTitle, Eyebrow, SectionTitle } from "@/components/ui/Button";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { TelegramChannelButton } from "@/components/community/TelegramChannelButton";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { Pressable, Text } from "react-native";
import { getAppBaseUrl } from "@/lib/config";
import { useAppTheme } from "@/theme/palettes";

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { api, profile, phone, accessToken, ensureSession } = useSession();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<UserNotification | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await ensureSession();
      if (!ok) {
        router.replace("/auth");
        return;
      }
      try {
        const payload = await api.listMyTryOnSessions();
        if (active) setHistory(payload.items);
        const notifications = await api.getNotifications();
        if (active) setNotification(notifications.items.find((item) => !item.read) ?? null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [api, ensureSession, router]);

  const gensLeft =
    profile?.plan === "trial"
      ? profile.trialGenerationsLeft
      : profile?.planGenerationsLeft ?? null;
  const publishedVerb = profile?.gender === "male" ? "публиковал" : "публиковала";

  async function shareApplication() {
    try {
      const referral = await api.getReferrals();
      if (!referral.eligible) {
        Alert.alert(
          "Реферальные бонусы",
          "Дополнительные примерки начисляются отправителю с активной подпиской Wibe или Elite.",
        );
        return;
      }
      const link = `${getAppBaseUrl()}/welcome?ref=${encodeURIComponent(referral.referralCode)}`;
      Alert.alert(
        "Поделиться приложением",
        `Если друг купит месячную подписку, вы получите ${referral.monthlyReward} примерки; за годовую — ${referral.annualReward}.`,
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Поделиться",
            onPress: () => {
              void Share.share({
                title: "Я на стиле",
                message: `Попробуй виртуальную примерочную «Я на стиле». Если ты купишь подписку, я получу дополнительные примерки: ${link}`,
              });
            },
          },
        ],
      );
    } catch {
      Alert.alert("Не удалось поделиться", "Попробуйте ещё раз.");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {notification ? (
          <Card style={styles.notificationCard}>
            <Eyebrow>Уведомление</Eyebrow>
            <SectionTitle>{notification.title}</SectionTitle>
            <BodyText>{notification.body}</BodyText>
            <View style={styles.notificationActions}>
              {notification.actionUrl ? (
                <Button label="Открыть" onPress={() => router.push(notification.actionUrl as never)} />
              ) : null}
              <Button
                label="Понятно"
                variant="secondary"
                onPress={() => {
                  const id = notification.id;
                  setNotification(null);
                  void api.markNotificationRead(id);
                }}
              />
            </View>
          </Card>
        ) : null}
        <Card>
          <View style={styles.homeHeader}>
            <Eyebrow>{phone ? `Привет, ${phone}` : "Привет"}</Eyebrow>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Поделиться приложением"
              style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
              onPress={() => void shareApplication()}
            >
              <Feather name="share-2" size={18} color={colors.violet} />
            </Pressable>
          </View>
          <DisplayTitle>Готова примерить новый look?</DisplayTitle>
          <BodyText>
            {gensLeft != null
              ? `Осталось примерок: ${gensLeft}`
              : "Подписка активна — можно примерять без trial-лимита."}
          </BodyText>
          {!profile?.activeAvatarId ? (
            <Pressable style={styles.avatarCta} onPress={() => router.push("/settings")}>
              <Text style={styles.avatarCtaText}>Добавьте аватар в профиле</Text>
            </Pressable>
          ) : null}
          <View style={styles.tryOnActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Примерить по ссылке Wildberries или Ozon"
              style={({ pressed }) => [
                styles.tryOnAction,
                { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.primarySoft },
                pressed && styles.tryOnActionPressed,
              ]}
              onPress={() => router.push("/try-on/link")}
            >
              <Feather name="link-2" size={19} color={theme.colors.primaryDark} />
              <Text style={[styles.tryOnActionText, { color: theme.colors.primaryDark }]}>По ссылке WB / Ozon</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Примерить по фото"
              style={({ pressed }) => [
                styles.tryOnAction,
                { backgroundColor: theme.colors.white, borderColor: theme.colors.borderLight },
                pressed && styles.tryOnActionPressed,
              ]}
              onPress={() => router.push("/try-on/photo")}
            >
              <Feather name="image" size={19} color={theme.colors.muted} />
              <Text style={[styles.tryOnActionText, { color: theme.colors.muted }]}>По фото</Text>
            </Pressable>
          </View>
          <View style={styles.actions}>
            <TelegramChannelButton />
          </View>
        </Card>

        <View style={styles.section}>
          <SectionTitle>{`Твои примерки (${history.length})`}</SectionTitle>
          <BodyText>Все образы — даже если не {publishedVerb} в галерее.</BodyText>
        </View>

        {loading ? (
          <BodyText>Загрузка…</BodyText>
        ) : history.length === 0 ? (
          <Card>
            <BodyText>Пока нет завершённых примерок. Начни с ссылки на WB или Ozon.</BodyText>
          </Card>
        ) : (
          <View style={styles.grid}>
            {history.map((item) => (
              <Pressable
                key={item.sessionId}
                style={styles.tile}
                onPress={() => router.push(`/try-on/result/${item.sessionId}`)}
              >
                {item.afterImageUrl && accessToken ? (
                  <AuthenticatedImage
                    path={item.afterImageUrl}
                    accessToken={accessToken}
                    style={styles.tileImage}
                  />
                ) : (
                  <View style={[styles.tileImage, styles.tilePlaceholder]} />
                )}
                <Text style={styles.tileTitle} numberOfLines={2}>
                  {item.productTitle}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  shareButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
  },
  shareButtonPressed: {
    opacity: 0.7,
  },
  tryOnActions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
  },
  tryOnAction: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: hairline,
  },
  tryOnActionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  tryOnActionText: {
    flexShrink: 1,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    textAlign: "center",
  },
  notificationCard: { borderColor: colors.violet },
  notificationActions: { marginTop: spacing.md, gap: spacing.sm },
  avatarCta: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.pinkBg,
  },
  avatarCtaText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.pink,
  },
  section: {
    gap: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tile: {
    width: "47%",
    gap: spacing.sm,
  },
  tileImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    backgroundColor: colors.pinkBg,
    borderWidth: hairline,
    borderColor: colors.borderLight,
  },
  tilePlaceholder: {
    backgroundColor: colors.pinkBg,
  },
  tileTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.black,
    lineHeight: 18,
  },
});
