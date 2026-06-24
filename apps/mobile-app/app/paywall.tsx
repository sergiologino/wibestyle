import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { BillingPlanOffer, BillingPeriod, SubscriptionPlan } from "@wibestyle/shared-types";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function PaywallScreen() {
  const router = useRouter();
  const { api, refreshProfile } = useSession();
  const [plans, setPlans] = useState<BillingPlanOffer[]>([]);
  const [selected, setSelected] = useState<{ plan: SubscriptionPlan; period: BillingPeriod }>({
    plan: "wibe",
    period: "annual",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState("mock");
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  useEffect(() => {
    void api.getBillingPlans().then((payload) => {
      setPlans(payload.items);
      setSelected(payload.defaultSelection);
      setPaymentProvider(payload.paymentProvider ?? "mock");
    });
  }, [api]);

  const current = plans.find((p) => p.plan === selected.plan && p.period === selected.period);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.checkout(selected.plan as "wibe" | "elite", selected.period, {
        savePaymentMethod,
        client: "mobile",
      });
      if (result.provider === "yookassa") {
        await WebBrowser.openAuthSessionAsync(result.paymentUrl, "wibestyle://paywall/return");
        let status = await api.getCheckout(result.checkoutId);
        for (let attempt = 0; status.status === "pending" && attempt < 15; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          status = await api.getCheckout(result.checkoutId);
        }
        if (status.status !== "completed") throw new Error("PAYMENT_NOT_CONFIRMED");
      } else {
        await api.simulateMockCheckout(result.checkoutId);
      }
      await refreshProfile();
      router.replace("/(main)/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Оформление сейчас недоступно");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.close} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Закрыть">
          <Feather name="x" size={22} color={colors.black} />
        </Pressable>

        <Eyebrow>Пейволл</Eyebrow>
        <DisplayTitle>Подключи trial</DisplayTitle>
        <BodyText>
          Больше AI-примерок, история образов и доступ к тарифам Wibe и Elite. Для первых 100 пользователей действует промокод с лендинга.
        </BodyText>

        <View style={styles.toggle}>
          {(["monthly", "annual"] as BillingPeriod[]).map((period) => (
            <Pressable
              key={period}
              style={[styles.toggleItem, selected.period === period && styles.toggleItemActive]}
              onPress={() => setSelected((s) => ({ ...s, period }))}
            >
              <Text style={[styles.toggleText, selected.period === period && styles.toggleTextActive]}>
                {period === "annual" ? "Год −20%" : "Месяц"}
              </Text>
            </Pressable>
          ))}
        </View>

        {(["wibe", "elite"] as const).map((plan) => {
          const offer = plans.find((p) => p.plan === plan && p.period === selected.period);
          if (!offer) return null;
          const active = selected.plan === plan;
          return (
            <Pressable
              key={plan}
              style={[styles.planCard, active && styles.planCardActive]}
              onPress={() => setSelected((s) => ({ ...s, plan }))}
            >
              <Text style={styles.planName}>{plan === "elite" ? "Elite" : "Wibe"}</Text>
              <Text style={styles.planPrice}>{offer.priceRub.toLocaleString("ru-RU")} ₽</Text>
              <Text style={styles.planMeta}>{offer.generationsPerPeriod} примерок / период</Text>
              {offer.recommended ? <Text style={styles.badge}>Рекомендуем</Text> : null}
            </Pressable>
          );
        })}

        {current ? (
          <Text style={styles.summary}>
            Итого: {current.priceRub.toLocaleString("ru-RU")} ₽ · {current.generationsPerPeriod} генераций
          </Text>
        ) : null}

        {paymentProvider === "yookassa" ? (
          <View style={styles.autoRenewRow}>
            <View style={styles.autoRenewCopy}>
              <Text style={styles.autoRenewTitle}>Сохранить способ оплаты и включить автопродление</Text>
              <Text style={styles.autoRenewText}>Предупредим за 3 дня. Отключить можно в профиле.</Text>
            </View>
            <Switch value={savePaymentMethod} onValueChange={setSavePaymentMethod} trackColor={{ true: colors.pink }} />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Перейти к оплате" loading={loading} onPress={checkout} />
        <BodyText>
          AI может ошибаться в посадке, слоях одежды и обработке белья. Мы улучшаем качество и исправляем такие случаи.
        </BodyText>
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
  close: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  toggle: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    alignItems: "center",
  },
  toggleItemActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  toggleText: {
    fontFamily: "Manrope_500Medium",
    color: colors.muted,
  },
  toggleTextActive: {
    color: colors.pink,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: 4,
  },
  planCardActive: {
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  planName: {
    fontFamily: "Manrope_500Medium",
    fontSize: 18,
    color: colors.black,
  },
  planPrice: {
    fontFamily: "Manrope_300Light",
    fontSize: 28,
    color: colors.pink,
  },
  planMeta: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.muted,
  },
  badge: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    color: colors.pink,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  summary: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.black,
  },
  error: {
    color: colors.danger,
    fontFamily: "Manrope_400Regular",
  },
  autoRenewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    backgroundColor: colors.pinkBg,
    padding: spacing.md,
  },
  autoRenewCopy: { flex: 1, gap: 4 },
  autoRenewTitle: { fontFamily: "Manrope_500Medium", color: colors.black, fontSize: 14 },
  autoRenewText: { fontFamily: "Manrope_400Regular", color: colors.muted, fontSize: 12 },
});
