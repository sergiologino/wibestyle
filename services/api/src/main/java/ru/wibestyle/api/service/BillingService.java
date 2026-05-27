package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.domain.BillingCheckoutEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.BillingWebhookRequest;
import ru.wibestyle.api.repository.BillingCheckoutRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

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

    public BillingService(
            BillingProperties billingProperties,
            UserProfileRepository userProfileRepository,
            QuotaService quotaService,
            BillingCheckoutRepository billingCheckoutRepository
    ) {
        this.billingProperties = billingProperties;
        this.userProfileRepository = userProfileRepository;
        this.quotaService = quotaService;
        this.billingCheckoutRepository = billingCheckoutRepository;
    }

    public Map<String, Object> listPlans(UserProfileEntity profile) {
        int promoDiscount = profile.getPromoDiscountPercent() == null ? 0 : profile.getPromoDiscountPercent();
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(planOffer("wibe", "monthly", billingProperties.getWibeMonthlyRub(), promoDiscount));
        items.add(planOffer("wibe", "annual", billingProperties.getWibeAnnualRub(), promoDiscount));
        items.add(planOffer("elite", "monthly", billingProperties.getEliteMonthlyRub(), promoDiscount));
        items.add(planOffer("elite", "annual", billingProperties.getEliteAnnualRub(), promoDiscount));

        return Map.of(
                "items", items,
                "annualDiscountPercent", billingProperties.getAnnualDiscountPercent(),
                "defaultSelection", Map.of("plan", "wibe", "period", "annual"),
                "promoDiscountPercent", promoDiscount
        );
    }

    @Transactional
    public Map<String, Object> subscribe(UUID userId, String plan, String period) {
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
        BillingCheckoutEntity checkout = new BillingCheckoutEntity(
                UUID.randomUUID(),
                userId,
                plan,
                period,
                pricing.finalPrice(),
                "mock",
                now
        );
        billingCheckoutRepository.save(checkout);

        Map<String, Object> response = new HashMap<>();
        response.put("checkoutId", checkout.getId().toString());
        response.put("status", "pending");
        response.put("plan", plan);
        response.put("period", period);
        response.put("priceRub", pricing.finalPrice());
        response.put("basePriceRub", pricing.basePrice());
        response.put("provider", "mock");
        response.put("paymentUrl", "/api/v1/billing/webhooks/mock/simulate?checkoutId=" + checkout.getId());
        return response;
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
        checkout.setExternalPaymentId(request.externalPaymentId());
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
        int finalPrice = applyDiscount(basePrice, profile.getPromoDiscountPercent());
        return new CheckoutPricing(basePrice, finalPrice);
    }

    private record CheckoutPricing(int basePrice, int finalPrice) {
    }

    private Map<String, Object> planOffer(String plan, String period, int basePriceRub, int promoDiscountPercent) {
        int finalPrice = applyDiscount(basePriceRub, promoDiscountPercent);
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
