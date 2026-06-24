import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import type { BillingPlanOffer, BillingPeriod, SubscriptionPlan } from "@wibestyle/shared-types";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import {
  annualSavingsRub,
  formatTryOnAllowance,
  promoAppliedText,
  TRIAL_TRY_ONS,
} from "@/lib/paywall-logic";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

export default function PaywallScreen() {
  const router = useRouter();
  const { api, profile, refreshProfile } = useSession();
  const [plans, setPlans] = useState<BillingPlanOffer[]>([]);
  const [selected, setSelected] = useState<{ plan: SubscriptionPlan; period: BillingPeriod }>({
    plan: "elite",
    period: "annual",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState("mock");
  const [annualDiscountPercent, setAnnualDiscountPercent] = useState(20);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  useEffect(() => {
    void api.getBillingPlans().then((payload) => {
      setPlans(payload.items);
      setSelected({ plan: "elite", period: "annual" });
      setPaymentProvider(payload.paymentProvider ?? "mock");
      setAnnualDiscountPercent(payload.annualDiscountPercent);
      setPromoDiscountPercent(payload.promoDiscountPercent);
    });
  }, [api]);

  const current = plans.find((p) => p.plan === selected.plan && p.period === selected.period);
  const promoMessage = promoAppliedText(promoDiscountPercent);
  const showTrial = !profile || profile.plan === "trial";
  const trialRemaining = profile?.plan === "trial" ? profile.trialGenerationsLeft : TRIAL_TRY_ONS;

  function startTrial() {
    if (!profile) {
      router.replace("/auth");
      return;
    }
    router.replace("/(main)/home");
  }

  async function checkout() {
    if (!profile) {
      router.replace("/auth");
      return;
    }
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
        <DisplayTitle>Выбери свой формат примерок</DisplayTitle>
        <BodyText>
          Начни с бесплатных примерок или подключи Wibe либо Elite для большего количества образов.
        </BodyText>

        {showTrial ? (
          <View style={styles.trialCard}>
            <View style={styles.trialCopy}>
              <Text style={styles.trialTitle}>Бесплатный trial</Text>
              <Text style={styles.trialText}>
                {trialRemaining > 0
                  ? `${TRIAL_TRY_ONS} бесплатные примерки · осталось ${trialRemaining}`
                  : "Три бесплатные примерки уже использованы"}
              </Text>
            </View>
            {trialRemaining > 0 ? (
              <Button label="Попробовать бесплатно" onPress={startTrial} />
            ) : null}
          </View>
        ) : null}

        {promoMessage ? <Text style={styles.promoBanner}>{promoMessage}</Text> : null}

        <View style={styles.toggle}>
          {(["monthly", "annual"] as BillingPeriod[]).map((period) => (
            <Pressable
              key={period}
              style={[styles.toggleItem, selected.period === period && styles.toggleItemActive]}
              onPress={() => setSelected((s) => ({ ...s, period }))}
            >
              <Text style={[styles.toggleText, selected.period === period && styles.toggleTextActive]}>
                {period === "annual" ? `Год −${annualDiscountPercent}%` : "Месяц"}
              </Text>
            </Pressable>
          ))}
        </View>

        {(["wibe", "elite"] as const).map((plan) => {
          const offer = plans.find((p) => p.plan === plan && p.period === selected.period);
          if (!offer) return null;
          const active = selected.plan === plan;
          const savings = selected.period === "annual" ? annualSavingsRub(plans, plan) : 0;
          const featured = plan === "elite" && selected.period === "annual";
          return (
            <LinearGradient
              key={plan}
              colors={
                featured
                  ? ["#fff0f8", "#f4efff", "#eef7ff"]
                  : selected.period === "annual"
                    ? ["#fffafc", "#fff2f9"]
                    : [colors.white, colors.white]
              }
              style={[
                styles.planCard,
                selected.period === "annual" && styles.annualPlanCard,
                active && styles.planCardActive,
                featured && styles.featuredPlanCard,
              ]}
            >
              <Pressable
                style={styles.planCardContent}
                onPress={() => setSelected((s) => ({ ...s, plan }))}
                accessibilityRole="button"
              >
                {featured ? <Text style={styles.badge}>Рекомендуем годовой Elite</Text> : null}
                <Text style={styles.planName}>{plan === "elite" ? "Elite" : "Wibe"}</Text>
                <Text style={styles.planPrice}>{offer.priceRub.toLocaleString("ru-RU")} ₽</Text>
                {promoDiscountPercent > 0 && offer.basePriceRub > offer.priceRub ? (
                  <Text style={styles.oldPrice}>Без промокода: {offer.basePriceRub.toLocaleString("ru-RU")} ₽</Text>
                ) : null}
                <Text style={styles.planMeta}>{formatTryOnAllowance(offer.generationsPerPeriod, offer.period)}</Text>
                {plan === "elite" ? (
                  <View style={styles.elitePerks}>
                    {["Генерация видео к любой примерке", "Лучшие нейросети", "Приоритетная поддержка"].map((perk) => (
                      <View key={perk} style={styles.elitePerk}>
                        <Feather name="check" size={14} color={colors.violet} />
                        <Text style={styles.elitePerkText}>{perk}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {savings > 0 ? (
                  <Text style={styles.savingsBadge}>
                    Экономия {savings.toLocaleString("ru-RU")} ₽ за год по сравнению с помесячной оплатой
                  </Text>
                ) : null}
              </Pressable>
            </LinearGradient>
          );
        })}

        {current ? (
          <Text style={styles.summary}>
            Итого: {current.priceRub.toLocaleString("ru-RU")} ₽ · {formatTryOnAllowance(current.generationsPerPeriod, current.period)}
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
  trialCard: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.pink,
    backgroundColor: colors.pinkBg,
  },
  trialCopy: { gap: 4 },
  trialTitle: {
    fontFamily: "Manrope_500Medium",
    fontSize: 18,
    color: colors.black,
  },
  trialText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: colors.muted,
  },
  promoBanner: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.black,
    color: colors.white,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    textAlign: "center",
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
    borderRadius: radius.xl,
    borderWidth: hairline,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  planCardContent: {
    padding: spacing.lg,
    gap: 4,
  },
  annualPlanCard: {
    borderWidth: 1,
    borderColor: colors.pinkSoft,
  },
  planCardActive: {
    borderColor: colors.pink,
    borderWidth: 2,
  },
  featuredPlanCard: {
    borderColor: colors.violet,
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
  oldPrice: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  savingsBadge: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: hairline,
    borderColor: colors.pinkSoft,
    color: colors.pinkDark,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  elitePerks: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  elitePerk: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  elitePerkText: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: colors.black,
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
