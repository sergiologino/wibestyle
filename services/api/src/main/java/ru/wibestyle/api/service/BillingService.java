package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.billing.yookassa.YooKassaClient;
import ru.wibestyle.api.billing.yookassa.YooKassaPaymentResult;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.domain.BillingCheckoutEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.BillingWebhookRequest;
import ru.wibestyle.api.repository.BillingCheckoutRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    private final YooKassaClient yooKassaClient;

    public BillingService(
            BillingProperties billingProperties,
            UserProfileRepository userProfileRepository,
            QuotaService quotaService,
            BillingCheckoutRepository billingCheckoutRepository,
            YooKassaClient yooKassaClient
    ) {
        this.billingProperties = billingProperties;
        this.userProfileRepository = userProfileRepository;
        this.quotaService = quotaService;
        this.billingCheckoutRepository = billingCheckoutRepository;
        this.yooKassaClient = yooKassaClient;
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
        response.put("subscriber", Map.of(
                "plan", profile.getPlan(),
                "billingPeriod", profile.getBillingPeriod() == null ? "monthly" : profile.getBillingPeriod(),
                "subscriptionActive", subscriptionActive(profile)
        ));
        return response;
    }

    @Transactional
    public Map<String, Object> subscribe(UUID userId, String plan, String period) {
        if (!billingProperties.isSubscribeDevEnabled()) {
            throw new IllegalArgumentException("SUBSCRIBE_DEV_DISABLED");
        }
        CheckoutPricing pricing = resolvePricing(userId, plan, period);
        activateSubscription(userId, plan, period, pricing.finalPrice(), pricing.basePrice());
        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        return buildActiveSubscriptionResponse(plan, period, pricing, profile);
    }

    @Transactional
    public Map<String, Object> createCheckout(UUID userId, String plan, String period) {
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

        String paymentUrl;
        if ("yookassa".equals(provider)) {
            YooKassaPaymentResult payment = yooKassaClient.createRedirectPayment(
                    checkoutId,
                    pricing.finalPrice(),
                    checkoutDescription(plan, period),
                    userId
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

        BillingCheckoutEntity checkout = billingCheckoutRepository.findById(request.checkoutId())
                .orElseThrow(() -> new IllegalArgumentException("CHECKOUT_NOT_FOUND"));
        return completeCheckout(checkout, request.externalPaymentId());
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
                : billingCheckoutRepository.findById(checkoutId).orElse(null);
        if (checkout == null) {
            return;
        }

        if ("payment.succeeded".equals(event) && "succeeded".equals(verifiedStatus)) {
            verifyPaymentAmount(checkout, verified);
            try {
                completeCheckout(checkout, paymentId);
            } catch (IllegalArgumentException ex) {
                if (!"CHECKOUT_ALREADY_PROCESSED".equals(ex.getMessage())) {
                    throw ex;
                }
            }
            return;
        }
        if ("payment.canceled".equals(event) || "canceled".equals(verifiedStatus)) {
            markCheckoutCanceled(checkout);
        }
    }

    private Map<String, Object> completeCheckout(BillingCheckoutEntity checkout, String externalPaymentId) {
        if (!"pending".equals(checkout.getStatus())) {
            throw new IllegalArgumentException("CHECKOUT_ALREADY_PROCESSED");
        }

        activateSubscription(
                checkout.getUserId(),
                checkout.getPlan(),
                checkout.getBillingPeriod(),
                checkout.getPriceRub(),
                checkout.getPriceRub()
        );

        checkout.setStatus("completed");
        checkout.setExternalPaymentId(externalPaymentId);
        checkout.setCompletedAt(Instant.now());
        billingCheckoutRepository.save(checkout);

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
                completeCheckout(checkout, checkout.getExternalPaymentId());
            } catch (IllegalArgumentException ex) {
                if (!"CHECKOUT_ALREADY_PROCESSED".equals(ex.getMessage())) {
                    throw ex;
                }
            }
        } else if ("canceled".equals(status)) {
            markCheckoutCanceled(checkout);
        }
    }

    private void verifyPaymentAmount(BillingCheckoutEntity checkout, JsonNode payment) {
        String value = payment.path("amount").path("value").asText("0");
        int paidRub = new BigDecimal(value).setScale(0, RoundingMode.HALF_UP).intValue();
        if (paidRub != checkout.getPriceRub()) {
            throw new IllegalStateException("YOOKASSA_AMOUNT_MISMATCH");
        }
    }

    private void markCheckoutCanceled(BillingCheckoutEntity checkout) {
        if ("pending".equals(checkout.getStatus())) {
            checkout.setStatus("canceled");
            billingCheckoutRepository.save(checkout);
        }
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

    private void activateSubscription(UUID userId, String plan, String period, int finalPrice, int basePrice) {
        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        Instant now = Instant.now();
        Instant expiresAt = "annual".equals(period) ? now.plus(365, ChronoUnit.DAYS) : now.plus(30, ChronoUnit.DAYS);

        profile.setPlan(plan);
        profile.setBillingPeriod(period);
        profile.setPlanGenerationsLeft(quotaService.defaultGenerationsForPlan(plan));
        profile.setSubscriptionExpiresAt(expiresAt);
        profile.setUpdatedAt(now);
        userProfileRepository.save(profile);
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
        map.put("generationsPerPeriod", quotaService.defaultGenerationsForPlan(plan));
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
