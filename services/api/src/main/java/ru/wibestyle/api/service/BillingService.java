package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.billing.yookassa.YooKassaClient;
import ru.wibestyle.api.billing.yookassa.YooKassaChargeResult;
import ru.wibestyle.api.billing.yookassa.YooKassaPaymentResult;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.domain.BillingCheckoutEntity;
import ru.wibestyle.api.domain.BillingSubscriptionEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.BillingWebhookRequest;
import ru.wibestyle.api.repository.BillingCheckoutRepository;
import ru.wibestyle.api.repository.BillingSubscriptionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BillingService {

    private final BillingProperties billingProperties;
    private final UserProfileRepository userProfileRepository;
    private final QuotaService quotaService;
    private final BillingCheckoutRepository billingCheckoutRepository;
    private final BillingSubscriptionRepository billingSubscriptionRepository;
    private final YooKassaClient yooKassaClient;
    private final NotificationService notificationService;
    private final ReferralService referralService;
    private final MarketingAttributionService marketingAttributionService;

    public BillingService(
            BillingProperties billingProperties,
            UserProfileRepository userProfileRepository,
            QuotaService quotaService,
            BillingCheckoutRepository billingCheckoutRepository,
            BillingSubscriptionRepository billingSubscriptionRepository,
            YooKassaClient yooKassaClient,
            NotificationService notificationService,
            ReferralService referralService,
            MarketingAttributionService marketingAttributionService
    ) {
        this.billingProperties = billingProperties;
        this.userProfileRepository = userProfileRepository;
        this.quotaService = quotaService;
        this.billingCheckoutRepository = billingCheckoutRepository;
        this.billingSubscriptionRepository = billingSubscriptionRepository;
        this.yooKassaClient = yooKassaClient;
        this.notificationService = notificationService;
        this.referralService = referralService;
        this.marketingAttributionService = marketingAttributionService;
    }

    public Map<String, Object> listPlans(UserProfileEntity profile) {
        int promoDiscount = profile.getPromoDiscountPercent() == null ? 0 : profile.getPromoDiscountPercent();
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(planOffer(profile, "wibe", "monthly", billingProperties.getWibeMonthlyRub(), promoDiscount));
        items.add(planOffer(profile, "wibe", "annual", billingProperties.getWibeAnnualRub(), promoDiscount));
        items.add(planOffer(profile, "elite", "monthly", billingProperties.getEliteMonthlyRub(), promoDiscount));
        items.add(planOffer(profile, "elite", "annual", billingProperties.getEliteAnnualRub(), promoDiscount));

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("annualDiscountPercent", billingProperties.getAnnualDiscountPercent());
        response.put("defaultSelection", Map.of("plan", "wibe", "period", "annual"));
        response.put("promoDiscountPercent", promoDiscount);
        response.put("paymentProvider", activeProvider());
        Map<String, Object> subscriber = new HashMap<>();
        subscriber.put("plan", profile.getPlan());
        subscriber.put("billingPeriod", profile.getBillingPeriod() == null ? "monthly" : profile.getBillingPeriod());
        subscriber.put("subscriptionActive", subscriptionActive(profile));
        billingSubscriptionRepository.findById(profile.getUserId()).ifPresent(subscription -> {
            subscriber.put("autoRenewEnabled", subscription.isAutoRenewEnabled());
            subscriber.put("currentPeriodEnd", subscription.getCurrentPeriodEnd().toString());
        });
        response.put("subscriber", subscriber);
        return response;
    }

    @Transactional
    public Map<String, Object> subscribe(UUID userId, String plan, String period) {
        if (!billingProperties.isSubscribeDevEnabled()) {
            throw new IllegalArgumentException("SUBSCRIBE_DEV_DISABLED");
        }
        CheckoutPricing pricing = resolvePricing(userId, plan, period);
        activateSubscription(userId, plan, period, false);
        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        return buildActiveSubscriptionResponse(plan, period, pricing, profile);
    }

    @Transactional
    public Map<String, Object> createCheckout(UUID userId, String plan, String period,
                                               boolean savePaymentMethod, boolean mobileClient) {
        CheckoutPricing pricing = resolvePricing(userId, plan, period);
        Instant now = Instant.now();
        UUID checkoutId = UUID.randomUUID();
        String provider = activeProvider();

        BillingCheckoutEntity checkout = new BillingCheckoutEntity(
                checkoutId,
                userId,
                plan,
                period,
                pricing.finalPrice(),
                provider,
                now
        );
        try {
            marketingAttributionService.recordSystemEvent(null, userId, "payment_started",
                    Map.of("checkoutId", checkoutId.toString(), "plan", plan, "period", period));
        } catch (RuntimeException ignored) {
            // Analytics must not prevent checkout creation.
        }
        checkout.setSavePaymentMethod(savePaymentMethod);

        String paymentUrl;
        if ("yookassa".equals(provider)) {
            YooKassaPaymentResult payment = yooKassaClient.createRedirectPayment(
                    checkoutId,
                    pricing.finalPrice(),
                    checkoutDescription(plan, period),
                    userId,
                    savePaymentMethod,
                    mobileClient ? billingProperties.getMobileReturnUrl() : billingProperties.getReturnUrl()
            );
            checkout.setExternalPaymentId(payment.paymentId());
            paymentUrl = payment.confirmationUrl();
        } else {
            paymentUrl = "/api/v1/billing/webhooks/mock/simulate?checkoutId=" + checkoutId;
        }

        billingCheckoutRepository.save(checkout);

        Map<String, Object> response = new HashMap<>();
        response.put("checkoutId", checkout.getId().toString());
        response.put("status", "pending");
        response.put("plan", plan);
        response.put("period", period);
        response.put("priceRub", pricing.finalPrice());
        response.put("basePriceRub", pricing.basePrice());
        response.put("provider", provider);
        response.put("paymentUrl", paymentUrl);
        response.put("savePaymentMethod", savePaymentMethod);
        return response;
    }

    @Transactional
    public Map<String, Object> getCheckout(UUID userId, UUID checkoutId) {
        BillingCheckoutEntity checkout = billingCheckoutRepository.findByIdAndUserId(checkoutId, userId)
                .orElseThrow(() -> new IllegalArgumentException("CHECKOUT_NOT_FOUND"));
        if ("pending".equals(checkout.getStatus()) && "yookassa".equals(checkout.getProvider())) {
            syncYooKassaCheckout(checkout);
        }
        return toCheckoutResponse(checkout);
    }

    @Transactional
    public Map<String, Object> handleWebhook(String provider, BillingWebhookRequest request) {
        if (!"mock".equals(provider)) {
            throw new IllegalArgumentException("PROVIDER_UNSUPPORTED");
        }
        if (!"payment.succeeded".equals(request.event())) {
            throw new IllegalArgumentException("WEBHOOK_EVENT_UNSUPPORTED");
        }
        if (request.checkoutId() == null) {
            throw new IllegalArgumentException("CHECKOUT_ID_REQUIRED");
        }

        BillingCheckoutEntity checkout = billingCheckoutRepository.findLockedById(request.checkoutId())
                .orElseThrow(() -> new IllegalArgumentException("CHECKOUT_NOT_FOUND"));
        return completeCheckout(checkout, request.externalPaymentId(), null);
    }

    @Transactional
    public void handleYooKassaNotification(JsonNode notification) {
        String event = notification.path("event").asText("");
        JsonNode payment = notification.path("object");
        String paymentId = payment.path("id").asText(null);
        if (paymentId == null || paymentId.isBlank()) {
            return;
        }

        JsonNode verified = yooKassaClient.fetchPayment(paymentId);
        String verifiedStatus = verified.path("status").asText("");
        UUID checkoutId = parseCheckoutId(verified.path("metadata").path("checkout_id").asText(null));

        BillingCheckoutEntity checkout = checkoutId == null
                ? billingCheckoutRepository.findByExternalPaymentId(paymentId).orElse(null)
                : billingCheckoutRepository.findLockedById(checkoutId).orElse(null);
        if (checkout == null) {
            return;
        }

        if ("payment.succeeded".equals(event) && "succeeded".equals(verifiedStatus)) {
            verifyPaymentAmount(checkout, verified);
            try {
                completeCheckout(checkout, paymentId, verified);
            } catch (IllegalArgumentException ex) {
                if (!"CHECKOUT_ALREADY_PROCESSED".equals(ex.getMessage())) {
                    throw ex;
                }
            }
            return;
        }
        if ("payment.canceled".equals(event) || "canceled".equals(verifiedStatus)) {
            boolean newlyCanceled = markCheckoutCanceled(checkout);
            if (newlyCanceled && "renewal".equals(checkout.getCheckoutType())) {
                recordRenewalFailure(checkout, "Платёж отклонён");
            }
        }
    }

    private Map<String, Object> completeCheckout(BillingCheckoutEntity checkout, String externalPaymentId, JsonNode payment) {
        if (!"pending".equals(checkout.getStatus())) {
            throw new IllegalArgumentException("CHECKOUT_ALREADY_PROCESSED");
        }

        boolean renewal = "renewal".equals(checkout.getCheckoutType());
        activateSubscription(checkout.getUserId(), checkout.getPlan(), checkout.getBillingPeriod(), renewal);

        checkout.setStatus("completed");
        checkout.setExternalPaymentId(externalPaymentId);
        checkout.setCompletedAt(Instant.now());
        billingCheckoutRepository.save(checkout);

        updateRecurringSubscription(checkout, payment, renewal);
        referralService.rewardFirstPurchase(checkout);
        try {
            marketingAttributionService.recordSystemEvent(null, checkout.getUserId(), "payment_completed",
                    Map.of("checkoutId", checkout.getId().toString(), "plan", checkout.getPlan(),
                            "period", checkout.getBillingPeriod(), "priceRub", checkout.getPriceRub()));
        } catch (RuntimeException ignored) {
            // Analytics must not roll back a confirmed payment.
        }

        UserProfileEntity profile = userProfileRepository.findById(checkout.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));

        Map<String, Object> response = buildActiveSubscriptionResponse(
                checkout.getPlan(),
                checkout.getBillingPeriod(),
                new CheckoutPricing(checkout.getPriceRub(), checkout.getPriceRub()),
                profile
        );
        response.put("checkoutId", checkout.getId().toString());
        return response;
    }

    private void syncYooKassaCheckout(BillingCheckoutEntity checkout) {
        if (checkout.getExternalPaymentId() == null || checkout.getExternalPaymentId().isBlank()) {
            return;
        }
        JsonNode payment = yooKassaClient.fetchPayment(checkout.getExternalPaymentId());
        String status = payment.path("status").asText("");
        if ("succeeded".equals(status)) {
            verifyPaymentAmount(checkout, payment);
            try {
                completeCheckout(checkout, checkout.getExternalPaymentId(), payment);
            } catch (IllegalArgumentException ex) {
                if (!"CHECKOUT_ALREADY_PROCESSED".equals(ex.getMessage())) {
                    throw ex;
                }
            }
        } else if ("canceled".equals(status)) {
            boolean newlyCanceled = markCheckoutCanceled(checkout);
            if (newlyCanceled && "renewal".equals(checkout.getCheckoutType())) {
                recordRenewalFailure(checkout, "Платёж отклонён");
            }
        }
    }

    private void verifyPaymentAmount(BillingCheckoutEntity checkout, JsonNode payment) {
        String value = payment.path("amount").path("value").asText("0");
        int paidRub = new BigDecimal(value).setScale(0, RoundingMode.HALF_UP).intValue();
        if (paidRub != checkout.getPriceRub()) {
            throw new IllegalStateException("YOOKASSA_AMOUNT_MISMATCH");
        }
    }

    private boolean markCheckoutCanceled(BillingCheckoutEntity checkout) {
        if ("pending".equals(checkout.getStatus())) {
            checkout.setStatus("canceled");
            billingCheckoutRepository.save(checkout);
            return true;
        }
        return false;
    }

    private Map<String, Object> toCheckoutResponse(BillingCheckoutEntity checkout) {
        Map<String, Object> response = new HashMap<>();
        response.put("checkoutId", checkout.getId().toString());
        response.put("status", checkout.getStatus());
        response.put("plan", checkout.getPlan());
        response.put("period", checkout.getBillingPeriod());
        response.put("priceRub", checkout.getPriceRub());
        response.put("provider", checkout.getProvider());
        if ("completed".equals(checkout.getStatus())) {
            UserProfileEntity profile = userProfileRepository.findById(checkout.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
            response.put("subscription", Map.of(
                    "plan", profile.getPlan(),
                    "period", profile.getBillingPeriod(),
                    "subscriptionExpiresAt", profile.getSubscriptionExpiresAt().toString(),
                    "planGenerationsLeft", profile.getPlanGenerationsLeft()
            ));
        }
        return response;
    }

    private String activeProvider() {
        if (billingProperties.yooKassaConfigured()) {
            return "yookassa";
        }
        if (billingProperties.usesYooKassa()) {
            throw new IllegalStateException("YOOKASSA_NOT_CONFIGURED");
        }
        return "mock";
    }

    private static UUID parseCheckoutId(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String checkoutDescription(String plan, String period) {
        String planLabel = "elite".equals(plan) ? "Elite" : "Wibe";
        String periodLabel = "annual".equals(period) ? "год" : "месяц";
        return "WibeStyle подписка " + planLabel + " (" + periodLabel + ")";
    }

    private void activateSubscription(UUID userId, String plan, String period, boolean renewal) {
        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        Instant now = Instant.now();
        Instant periodStart = renewal && profile.getSubscriptionExpiresAt() != null
                ? profile.getSubscriptionExpiresAt()
                : now;
        ZonedDateTime start = periodStart.atZone(ZoneOffset.UTC);
        Instant expiresAt = ("annual".equals(period) ? start.plusYears(1) : start.plusMonths(1)).toInstant();

        profile.setPlan(plan);
        profile.setBillingPeriod(period);
        profile.setPlanGenerationsLeft(quotaService.generationsForPlanPeriod(plan, period));
        profile.setSubscriptionExpiresAt(expiresAt);
        profile.setUpdatedAt(now);
        userProfileRepository.save(profile);
    }

    private void updateRecurringSubscription(BillingCheckoutEntity checkout, JsonNode payment, boolean renewal) {
        UserProfileEntity profile = userProfileRepository.findById(checkout.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        Instant now = Instant.now();
        BillingSubscriptionEntity subscription = billingSubscriptionRepository.findById(checkout.getUserId())
                .orElseGet(() -> new BillingSubscriptionEntity(
                        checkout.getUserId(), checkout.getPlan(), checkout.getBillingPeriod(),
                        profile.getSubscriptionExpiresAt(), checkout.getProvider(), now));
        subscription.setPlan(checkout.getPlan());
        subscription.setBillingPeriod(checkout.getBillingPeriod());
        subscription.setCurrentPeriodEnd(profile.getSubscriptionExpiresAt());
        subscription.setProvider(checkout.getProvider());
        subscription.setStatus("active");
        subscription.setRenewalFailureCount(0);
        subscription.setNextRenewalAttemptAt(null);
        subscription.setWarningSentFor(null);

        if (!renewal) {
            String paymentMethodId = payment == null ? null : payment.path("payment_method").path("id").asText(null);
            boolean saved = payment != null && payment.path("payment_method").path("saved").asBoolean(false);
            if (checkout.isSavePaymentMethod() && saved && paymentMethodId != null && !paymentMethodId.isBlank()) {
                subscription.setProviderPaymentMethodId(paymentMethodId);
                subscription.setAutoRenewEnabled(true);
            } else {
                subscription.setAutoRenewEnabled(false);
            }
        }
        subscription.setUpdatedAt(now);
        billingSubscriptionRepository.save(subscription);

        if (renewal) {
            notificationService.create(checkout.getUserId(), "subscription_renewed", "Подписка продлена",
                    "Оплата прошла успешно. Тариф " + checkout.getPlan().toUpperCase()
                            + " действует до " + formatDate(profile.getSubscriptionExpiresAt()) + ".",
                    "/settings", "renewal-success:" + checkout.getRenewalKey());
        }
    }

    public Map<String, Object> getSubscription(UUID userId) {
        BillingSubscriptionEntity subscription = billingSubscriptionRepository.findById(userId)
                .orElse(null);
        if (subscription == null) {
            return Map.of("autoRenewEnabled", false, "paymentMethodSaved", false);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("plan", subscription.getPlan());
        result.put("period", subscription.getBillingPeriod());
        result.put("currentPeriodEnd", subscription.getCurrentPeriodEnd().toString());
        result.put("autoRenewEnabled", subscription.isAutoRenewEnabled());
        result.put("paymentMethodSaved", subscription.getProviderPaymentMethodId() != null);
        result.put("status", subscription.getStatus());
        return result;
    }

    @Transactional
    public Map<String, Object> setAutoRenew(UUID userId, boolean enabled) {
        BillingSubscriptionEntity subscription = billingSubscriptionRepository.findLockedByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("SUBSCRIPTION_NOT_FOUND"));
        if (enabled && (subscription.getProviderPaymentMethodId() == null
                || subscription.getProviderPaymentMethodId().isBlank())) {
            throw new IllegalArgumentException("PAYMENT_METHOD_NOT_SAVED");
        }
        subscription.setAutoRenewEnabled(enabled);
        subscription.setStatus(enabled ? "active" : "canceled");
        subscription.setNextRenewalAttemptAt(null);
        subscription.setUpdatedAt(Instant.now());
        billingSubscriptionRepository.save(subscription);
        return getSubscription(userId);
    }

    @Transactional
    public void sendRenewalWarnings(Instant now) {
        Instant deadline = now.plusSeconds(3 * 24 * 60 * 60L);
        for (BillingSubscriptionEntity candidate :
                billingSubscriptionRepository.findByAutoRenewEnabledTrueAndCurrentPeriodEndBetween(now, deadline)) {
            BillingSubscriptionEntity subscription = billingSubscriptionRepository.findLockedByUserId(candidate.getUserId())
                    .orElse(null);
            if (subscription == null || !subscription.isAutoRenewEnabled()
                    || subscription.getCurrentPeriodEnd().isAfter(deadline)) continue;
            if (subscription.getCurrentPeriodEnd().equals(subscription.getWarningSentFor())) continue;
            int price = basePrice(subscription.getPlan(), subscription.getBillingPeriod());
            notificationService.create(subscription.getUserId(), "subscription_expiring", "Скоро продление подписки",
                    formatDate(subscription.getCurrentPeriodEnd()) + " спишем " + price
                            + " ₽ за тариф " + subscription.getPlan().toUpperCase() + ". Автопродление можно отключить в профиле.",
                    "/settings", "renewal-warning:" + subscription.getCurrentPeriodEnd());
            subscription.setWarningSentFor(subscription.getCurrentPeriodEnd());
            subscription.setUpdatedAt(now);
            billingSubscriptionRepository.save(subscription);
        }
    }

    @Transactional
    public void processDueRenewals(Instant now) {
        for (BillingSubscriptionEntity candidate :
                billingSubscriptionRepository.findByAutoRenewEnabledTrueAndCurrentPeriodEndLessThanEqual(now)) {
            BillingSubscriptionEntity subscription = billingSubscriptionRepository.findLockedByUserId(candidate.getUserId())
                    .orElse(null);
            if (subscription == null || !subscription.isAutoRenewEnabled()
                    || subscription.getCurrentPeriodEnd().isAfter(now)) continue;
            if (subscription.getNextRenewalAttemptAt() != null
                    && subscription.getNextRenewalAttemptAt().isAfter(now)) continue;
            createRenewalAttempt(subscription, now);
        }
    }

    private void createRenewalAttempt(BillingSubscriptionEntity subscription, Instant now) {
        int attempt = subscription.getRenewalFailureCount() + 1;
        String renewalKey = subscription.getUserId() + ":" + subscription.getCurrentPeriodEnd() + ":" + attempt;
        BillingCheckoutEntity existing = billingCheckoutRepository.findByRenewalKey(renewalKey).orElse(null);
        if (existing != null) {
            resumeRenewalAttempt(existing, subscription, now);
            return;
        }
        int price = basePrice(subscription.getPlan(), subscription.getBillingPeriod());
        BillingCheckoutEntity checkout = new BillingCheckoutEntity(UUID.randomUUID(), subscription.getUserId(),
                subscription.getPlan(), subscription.getBillingPeriod(), price, subscription.getProvider(), now);
        checkout.setCheckoutType("renewal");
        checkout.setRenewalKey(renewalKey);
        billingCheckoutRepository.saveAndFlush(checkout);
        resumeRenewalAttempt(checkout, subscription, now);
    }

    private void resumeRenewalAttempt(BillingCheckoutEntity checkout, BillingSubscriptionEntity subscription, Instant now) {
        if (!"pending".equals(checkout.getStatus())) return;
        try {
            if ("yookassa".equals(subscription.getProvider())) {
                String status;
                if (checkout.getExternalPaymentId() == null || checkout.getExternalPaymentId().isBlank()) {
                    YooKassaChargeResult payment = yooKassaClient.createSavedPayment(checkout.getId(), checkout.getPriceRub(),
                            checkoutDescription(subscription.getPlan(), subscription.getBillingPeriod()),
                            subscription.getUserId(), subscription.getProviderPaymentMethodId());
                    checkout.setExternalPaymentId(payment.paymentId());
                    billingCheckoutRepository.save(checkout);
                    status = payment.status();
                } else {
                    status = yooKassaClient.fetchPayment(checkout.getExternalPaymentId()).path("status").asText("");
                }
                if ("succeeded".equals(status)) {
                    JsonNode verified = yooKassaClient.fetchPayment(checkout.getExternalPaymentId());
                    verifyPaymentAmount(checkout, verified);
                    completeCheckout(checkout, checkout.getExternalPaymentId(), verified);
                } else if ("canceled".equals(status) && markCheckoutCanceled(checkout)) {
                    recordRenewalFailure(checkout, "Платёж отклонён");
                } else {
                    subscription.setNextRenewalAttemptAt(now.plusSeconds(15 * 60L));
                    subscription.setUpdatedAt(now);
                    billingSubscriptionRepository.save(subscription);
                }
            } else {
                completeCheckout(checkout, "mock-renewal-" + checkout.getId(), null);
            }
        } catch (RuntimeException ex) {
            if ("YOOKASSA_AMOUNT_MISMATCH".equals(ex.getMessage())) throw ex;
            subscription.setStatus("retrying");
            subscription.setNextRenewalAttemptAt(now.plusSeconds(15 * 60L));
            subscription.setUpdatedAt(now);
            billingSubscriptionRepository.save(subscription);
        }
    }

    private void recordRenewalFailure(BillingCheckoutEntity checkout, String reason) {
        BillingSubscriptionEntity subscription = billingSubscriptionRepository.findById(checkout.getUserId())
                .orElse(null);
        if (subscription == null || !subscription.isAutoRenewEnabled()) return;
        int failures = subscription.getRenewalFailureCount() + 1;
        subscription.setRenewalFailureCount(failures);
        subscription.setUpdatedAt(Instant.now());
        if (failures >= 3) {
            subscription.setAutoRenewEnabled(false);
            subscription.setStatus("payment_failed");
            subscription.setNextRenewalAttemptAt(null);
            notificationService.create(checkout.getUserId(), "subscription_payment_failed",
                    "Автопродление отключено", reason + " после трёх попыток. Обновите способ оплаты в профиле.",
                    "/paywall", "renewal-failed-final:" + subscription.getCurrentPeriodEnd());
        } else {
            subscription.setStatus("retrying");
            subscription.setNextRenewalAttemptAt(Instant.now().plusSeconds(24 * 60 * 60L));
            notificationService.create(checkout.getUserId(), "subscription_payment_retry",
                    "Не удалось продлить подписку", reason + ". Повторим попытку через сутки.",
                    "/settings", "renewal-failed:" + checkout.getRenewalKey());
        }
        billingSubscriptionRepository.save(subscription);
    }

    private static String formatDate(Instant instant) {
        return java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy")
                .withZone(ZoneOffset.UTC).format(instant);
    }

    private Map<String, Object> buildActiveSubscriptionResponse(
            String plan,
            String period,
            CheckoutPricing pricing,
            UserProfileEntity profile
    ) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "active");
        response.put("plan", plan);
        response.put("period", period);
        response.put("priceRub", pricing.finalPrice());
        response.put("basePriceRub", pricing.basePrice());
        response.put("subscriptionExpiresAt", profile.getSubscriptionExpiresAt().toString());
        response.put("planGenerationsLeft", profile.getPlanGenerationsLeft());
        response.put("profile", Map.of(
                "plan", profile.getPlan(),
                "billingPeriod", profile.getBillingPeriod(),
                "planGenerationsLeft", profile.getPlanGenerationsLeft(),
                "subscriptionExpiresAt", profile.getSubscriptionExpiresAt().toString()
        ));
        return response;
    }

    private CheckoutPricing resolvePricing(UUID userId, String plan, String period) {
        if (!"wibe".equals(plan) && !"elite".equals(plan)) {
            throw new IllegalArgumentException("INVALID_PLAN");
        }
        if (!"monthly".equals(period) && !"annual".equals(period)) {
            throw new IllegalArgumentException("INVALID_BILLING_PERIOD");
        }

        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        int basePrice = basePrice(plan, period);
        int chargeBase = basePrice;
        boolean upgradeFromWibe = qualifiesForUpgradeDiff(profile, plan, period);
        if (upgradeFromWibe) {
            chargeBase = basePrice - basePrice("wibe", period);
        }
        int finalPrice = applyDiscount(chargeBase, profile.getPromoDiscountPercent());
        return new CheckoutPricing(basePrice, finalPrice, upgradeFromWibe);
    }

    private boolean subscriptionActive(UserProfileEntity profile) {
        return profile.getSubscriptionExpiresAt() != null
                && profile.getSubscriptionExpiresAt().isAfter(Instant.now())
                && !"trial".equals(profile.getPlan());
    }

    private boolean qualifiesForUpgradeDiff(UserProfileEntity profile, String targetPlan, String targetPeriod) {
        return "elite".equals(targetPlan)
                && "wibe".equals(profile.getPlan())
                && "annual".equals(profile.getBillingPeriod())
                && "annual".equals(targetPeriod)
                && subscriptionActive(profile);
    }

    private record CheckoutPricing(int basePrice, int finalPrice, boolean upgradeFromWibe) {
        CheckoutPricing(int basePrice, int finalPrice) {
            this(basePrice, finalPrice, false);
        }
    }

    private Map<String, Object> planOffer(UserProfileEntity profile, String plan, String period, int basePriceRub, int promoDiscountPercent) {
        boolean upgradeFromWibe = qualifiesForUpgradeDiff(profile, plan, period);
        int chargeBase = upgradeFromWibe ? basePriceRub - basePrice("wibe", period) : basePriceRub;
        int finalPrice = applyDiscount(chargeBase, promoDiscountPercent);
        Map<String, Object> map = new HashMap<>();
        map.put("plan", plan);
        map.put("period", period);
        map.put("basePriceRub", basePriceRub);
        map.put("priceRub", finalPrice);
        map.put("generationsPerPeriod", quotaService.generationsForPlanPeriod(plan, period));
        if ("annual".equals(period)) {
            map.put("monthlyEquivalentRub", Math.round(finalPrice / 12.0));
            map.put("savingsPercent", billingProperties.getAnnualDiscountPercent());
        }
        if ("wibe".equals(plan) && "annual".equals(period)) {
            map.put("recommended", true);
        }
        if (upgradeFromWibe) {
            map.put("upgradeFromWibe", true);
            map.put("upgradePriceRub", finalPrice);
            map.put("fullPriceRub", applyDiscount(basePriceRub, promoDiscountPercent));
        }
        return map;
    }

    private int basePrice(String plan, String period) {
        return switch (plan + ":" + period) {
            case "wibe:monthly" -> billingProperties.getWibeMonthlyRub();
            case "wibe:annual" -> billingProperties.getWibeAnnualRub();
            case "elite:monthly" -> billingProperties.getEliteMonthlyRub();
            case "elite:annual" -> billingProperties.getEliteAnnualRub();
            default -> throw new IllegalArgumentException("INVALID_PLAN");
        };
    }

    private int applyDiscount(int basePriceRub, Integer discountPercent) {
        if (discountPercent == null || discountPercent <= 0) {
            return basePriceRub;
        }
        return Math.max(0, basePriceRub - (basePriceRub * discountPercent / 100));
    }
}
