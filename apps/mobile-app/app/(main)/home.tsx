import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { TryOnHistoryItem } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, Card, DisplayTitle, Eyebrow, SectionTitle } from "@/components/ui/Button";
import { AuthenticatedImage } from "@/components/media/AuthenticatedImage";
import { colors, hairline, radius, spacing } from "@/theme/tokens";
import { Pressable, Text } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { api, profile, phone, accessToken, ensureSession } = useSession();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card>
          <Eyebrow>{phone ? `Привет, ${phone}` : "Привет"}</Eyebrow>
          <DisplayTitle>Готова примерить новый look?</DisplayTitle>
          <BodyText>
            {gensLeft != null
              ? profile?.plan === "trial"
                ? `Осталось бесплатных примерок: ${gensLeft}`
                : `Генераций в подписке: ${gensLeft}`
              : "Подписка активна — примеряй без ограничений trial."}
          </BodyText>
          <View style={styles.actions}>
            <Button label="Примерить по ссылке" onPress={() => router.push("/try-on/link")} />
            <Button label="Примерить по фото" variant="secondary" onPress={() => router.push("/try-on/photo")} />
          </View>
        </Card>

        <View style={styles.section}>
          <SectionTitle>Твои примерки</SectionTitle>
          <BodyText>Все образы — даже если не публиковала в галерее.</BodyText>
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
