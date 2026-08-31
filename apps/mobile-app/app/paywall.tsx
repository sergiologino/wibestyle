import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import type { BillingOfferPeriod, BillingOfferPlan, BillingPackagePlan, BillingPlanOffer, SubscriptionPlan } from "@wibestyle/shared-types";
import { Feather } from "@expo/vector-icons";
import { ApiError } from "@wibestyle/api-client";
import { useSession } from "@/context/SessionProvider";
import { Screen } from "@/components/ui/Screen";
import { BodyText, Button, DisplayTitle, Eyebrow } from "@/components/ui/Button";
import {
  formatTryOnAllowance,
  promoAppliedText,
  TRIAL_TRY_ONS,
} from "@/lib/paywall-logic";
import { colors, hairline, radius, spacing } from "@/theme/tokens";

const PACKAGE_COPY = {
  tryon_20: { title: "20 примерок", note: "Стартовый пакет для проверки нескольких покупок." },
  tryon_50: { title: "50 примерок", note: "Оптимально для активного подбора образов.", featured: true },
  tryon_100: { title: "100 примерок", note: "Максимальный запас для регулярной примерки." },
} satisfies Record<BillingPackagePlan, { title: string; note: string; featured?: boolean }>;

function planLabel(plan: SubscriptionPlan) {
  return plan === "elite" ? "Elite" : plan === "wibe" ? "Wibe" : "trial";
}

export default function PaywallScreen() {
  const router = useRouter();
  const { api, profile, refreshProfile } = useSession();
  const [plans, setPlans] = useState<BillingPlanOffer[]>([]);
  const [selected, setSelected] = useState<{ plan: BillingOfferPlan; period: BillingOfferPeriod }>({
    plan: "tryon_50",
    period: "one_time",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState(0);
  const [subscriberPlan, setSubscriberPlan] = useState<SubscriptionPlan>("trial");
  const [subscriberPeriod, setSubscriberPeriod] = useState<BillingOfferPeriod>("monthly");
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  useEffect(() => {
    void api.getBillingPlans().then((payload) => {
      setPlans(payload.items);
      setSelected(payload.defaultSelection);
      setPromoDiscountPercent(payload.promoDiscountPercent);
      if (payload.subscriber) {
        setSubscriberPlan(payload.subscriber.plan);
        setSubscriberPeriod(payload.subscriber.billingPeriod);
        setSubscriptionActive(payload.subscriber.subscriptionActive);
      }
    });
  }, [api]);

  const current = plans.find((p) => p.plan === selected.plan && p.period === selected.period);
  const promoMessage = promoAppliedText(promoDiscountPercent);
  const showTrial = !profile || profile.plan === "trial";
  const trialRemaining = profile?.plan === "trial" ? profile.trialGenerationsLeft : TRIAL_TRY_ONS;
  const hasActivePaidSubscription = subscriptionActive && subscriberPlan !== "trial";
  const checkoutLabel = "Перейти к оплате";

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
      const result = await api.checkout(selected.plan, selected.period, {
        savePaymentMethod: false,
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
          Начни с бесплатных примерок или купи пакет: одежда, причёски, цвет волос, фото и видео расходуют общий баланс.
        </BodyText>

        {showTrial ? (
          <View style={styles.trialCard}>
            <View style={styles.trialCopy}>
              <Text style={styles.trialTitle}>Бесплатный trial</Text>
              <Text style={styles.trialText}>
                {trialRemaining > 0
                  ? `${TRIAL_TRY_ONS} бесплатные примерки и 1 видео · осталось примерок: ${trialRemaining}`
                  : "Три бесплатные примерки уже использованы"}
              </Text>
            </View>
            {trialRemaining > 0 ? (
              <Button label="Попробовать бесплатно" onPress={startTrial} />
            ) : null}
          </View>
        ) : null}

        {promoMessage ? <Text style={styles.promoBanner}>{promoMessage}</Text> : null}

        {plans.map((offer) => {
          const active = selected.plan === offer.plan;
          const copy = PACKAGE_COPY[offer.plan as BillingPackagePlan] ?? PACKAGE_COPY.tryon_20;
          const featured = Boolean(offer.recommended || ("featured" in copy && copy.featured));
          return (
            <LinearGradient
              key={`${offer.plan}:${offer.period}`}
              colors={
                featured
                  ? ["#fff0f8", "#f4efff", "#eef7ff"]
                  : [colors.white, colors.white]
              }
              style={[
                styles.planCard,
                active && styles.planCardActive,
                featured && styles.featuredPlanCard,
              ]}
            >
              <Pressable
                style={styles.planCardContent}
                onPress={() => setSelected({ plan: offer.plan, period: offer.period })}
                accessibilityRole="button"
              >
                <View style={styles.badgeRow}>
                  {featured ? <Text style={styles.badge}>Рекомендуем</Text> : null}
                  {offer.discountPercent && offer.discountPercent > 0 ? (
                    <Text style={styles.discountBadge}>−{offer.discountPercent}%</Text>
                  ) : null}
                </View>
                <Text style={styles.planName}>{offer.title ?? copy.title}</Text>
                <Text style={styles.planPrice}>{offer.priceRub.toLocaleString("ru-RU")} ₽</Text>
                {offer.discountPercent && offer.discountPercent > 0 && offer.basePriceRub > offer.priceRub ? (
                  <Text style={styles.oldPrice}>Без промокода: {offer.basePriceRub.toLocaleString("ru-RU")} ₽</Text>
                ) : null}
                <Text style={styles.planMeta}>{formatTryOnAllowance(offer.generationsPerPeriod, offer.period)}</Text>
                <Text style={styles.packageNote}>{copy.note}</Text>
              </Pressable>
            </LinearGradient>
          );
        })}

        {current ? (
          <Text style={styles.summary}>
            Итого: {current.priceRub.toLocaleString("ru-RU")} ₽ · {formatTryOnAllowance(current.generationsPerPeriod, current.period)}
          </Text>
        ) : null}

        {hasActivePaidSubscription ? (
          <Text style={styles.currentSubscription}>
            Текущий тариф: {planLabel(subscriberPlan)}, {subscriberPeriod === "annual" ? "год" : "месяц"}. Он продолжит работать по старым правилам до окончания подписки.
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={checkoutLabel} disabled={!current} loading={loading} onPress={checkout} />
        <BodyText>
          Программа может ошибаться в посадке, слоях одежды и обработке белья. Мы улучшаем качество примерок и исправляем такие случаи.
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
  disabledChoice: {
    opacity: 0.55,
  },
  currentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.pinkBg,
    color: colors.pink,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
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
  packageNote: {
    marginTop: spacing.sm,
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: colors.black,
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
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  discountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.violet,
    color: colors.white,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  summary: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: colors.black,
  },
  currentSubscription: {
    padding: spacing.md,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: hairline,
    borderColor: colors.pinkSoft,
    backgroundColor: colors.pinkBg,
    color: colors.black,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    lineHeight: 19,
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
