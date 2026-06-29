import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { TryOnHistoryItem, UserNotification } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, Card, DisplayTitle, Eyebrow, SectionTitle } from "@/components/ui/Button";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { TelegramChannelButton } from "@/components/community/TelegramChannelButton";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { Pressable, Text } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
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
          <Eyebrow>{phone ? `Привет, ${phone}` : "Привет"}</Eyebrow>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Примерить по ссылке Wildberries или Ozon"
            style={({ pressed }) => [styles.marketplaceCta, pressed && styles.marketplaceCtaPressed]}
            onPress={() => router.push("/try-on/link")}
          >
            <View style={styles.marketplaceCtaIcon}>
              <Text style={styles.marketplaceCtaIconText}>🔗</Text>
            </View>
            <View style={styles.marketplaceCtaCopy}>
              <Text style={styles.marketplaceCtaTitle}>Примерить по ссылке WB / Ozon</Text>
              <Text style={styles.marketplaceCtaText}>Вставь ссылку на товар — фото вещи загрузится автоматически</Text>
            </View>
            <Text style={styles.marketplaceCtaArrow}>›</Text>
          </Pressable>
          <View style={styles.actions}>
            <Button label="Примерить по фото" variant="secondary" onPress={() => router.push("/try-on/photo")} />
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
  marketplaceCta: {
    marginTop: spacing.lg,
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.pink,
  },
  marketplaceCtaPressed: {
    opacity: 0.86,
  },
  marketplaceCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  marketplaceCtaIconText: {
    fontSize: 22,
  },
  marketplaceCtaCopy: {
    flex: 1,
    gap: 3,
  },
  marketplaceCtaTitle: {
    color: colors.white,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
  marketplaceCtaText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  marketplaceCtaArrow: {
    color: colors.white,
    fontSize: 30,
    fontFamily: "Manrope_400Regular",
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
