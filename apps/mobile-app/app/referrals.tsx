import { useEffect, useState } from "react";
import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { ReferralOverview } from "@wibestyle/shared-types";
import { useSession } from "@/context/SessionProvider";
import { BodyText, Button, Card, DisplayTitle, Eyebrow, SectionTitle } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { getAppBaseUrl } from "@/lib/config";
import { colors, spacing } from "@/theme/tokens";

export default function ReferralsScreen() {
  const router = useRouter();
  const { api } = useSession();
  const [data, setData] = useState<ReferralOverview | null>(null);

  useEffect(() => {
    void api.getReferrals().then(setData);
  }, [api]);

  const link = data ? `${getAppBaseUrl()}/welcome?ref=${encodeURIComponent(data.referralCode)}` : "";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Button label="Назад" variant="ghost" onPress={() => router.back()} />
        <Eyebrow>Реферальная программа</Eyebrow>
        <DisplayTitle>Больше образов вместе</DisplayTitle>
        <Card>
          <BodyText>Друг покупает месяц — тебе 3 примерки. Покупает год — получаешь 15.</BodyText>
          <BodyText>Программа доступна всем. Получай бесплатные примерки даже без подписки.</BodyText>
          <Text style={styles.balance}>Бонусных примерок: {data?.bonusGenerationsLeft ?? "…"}</Text>
          <Text selectable style={styles.link}>{link || "Загружаем ссылку…"}</Text>
          <Button
            label="Поделиться ссылкой"
            disabled={!data}
            onPress={() => void Share.share({ message: `Попробуй виртуальную примерочную «Я на стиле»: ${link}` })}
          />
        </Card>
        <Card>
          <SectionTitle>История начислений</SectionTitle>
          <View style={styles.history}>
            {data?.rewards.length ? data.rewards.map((reward) => (
              <View key={reward.id} style={styles.reward}>
                <Text style={styles.friend}>{reward.friend}</Text>
                <BodyText>
                  +{reward.generations} примерок · {reward.billingPeriod === "annual" ? "годовой тариф" : "месячный тариф"}
                </BodyText>
                <Text style={styles.date}>{new Date(reward.rewardedAt).toLocaleString("ru-RU")}</Text>
              </View>
            )) : <BodyText>Начислений пока нет.</BodyText>}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  balance: { marginTop: spacing.md, fontFamily: "Manrope_600SemiBold", fontSize: 18, color: colors.black },
  link: { marginVertical: spacing.md, padding: spacing.md, borderRadius: 16, backgroundColor: colors.pinkBg, color: colors.black },
  history: { marginTop: spacing.md, gap: spacing.sm },
  reward: { padding: spacing.md, borderRadius: 16, backgroundColor: colors.pinkBg },
  friend: { fontFamily: "Manrope_600SemiBold", color: colors.black },
  date: { marginTop: 4, fontFamily: "Manrope_400Regular", fontSize: 12, color: colors.eyebrow },
});
