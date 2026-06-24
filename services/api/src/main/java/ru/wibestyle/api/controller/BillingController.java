package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.dto.SubscribeRequest;
import ru.wibestyle.api.dto.AutoRenewPatchRequest;
import ru.wibestyle.api.dto.ValidatePromoRequest;
import ru.wibestyle.api.service.BillingService;
import ru.wibestyle.api.service.EntitlementsService;
import ru.wibestyle.api.service.ProfileService;
import ru.wibestyle.api.service.PromoService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;
    private final PromoService promoService;
    private final ProfileService profileService;
    private final EntitlementsService entitlementsService;

    public BillingController(
            BillingService billingService,
            PromoService promoService,
            ProfileService profileService,
            EntitlementsService entitlementsService
    ) {
        this.billingService = billingService;
        this.promoService = promoService;
        this.profileService = profileService;
        this.entitlementsService = entitlementsService;
    }

    @GetMapping("/entitlements")
    public Map<String, Object> entitlements(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UUID userId = AuthSupport.requireUserId(authorization);
        var profile = profileService.requireProfile(userId);
        return Map.of("entitlements", entitlementsService.forProfile(profile));
    }

    @GetMapping("/plans")
    public Map<String, Object> plans(@RequestHeader(value = "Authorization", required = false) String authorization) {
        UUID userId = AuthSupport.optionalUserId(authorization);
        if (userId == null) {
            return billingService.listPlans(profileService.anonymousProfile());
        }
        return billingService.listPlans(profileService.requireProfile(userId));
    }

    @PostMapping("/promo/validate")
    public Map<String, Object> validatePromo(@Valid @RequestBody ValidatePromoRequest request) {
        return promoService.validate(request.code());
    }

    @PostMapping("/subscribe")
    public Map<String, Object> subscribe(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody SubscribeRequest request
    ) {
        UUID userId = AuthSupport.requireUserId(authorization);
        return billingService.subscribe(userId, request.plan(), request.period());
    }

    @GetMapping("/checkout/{checkoutId}")
    public Map<String, Object> checkoutStatus(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID checkoutId
    ) {
        UUID userId = AuthSupport.requireUserId(authorization);
        return billingService.getCheckout(userId, checkoutId);
    }

    @PostMapping("/checkout")
    public Map<String, Object> checkout(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody SubscribeRequest request
    ) {
        UUID userId = AuthSupport.requireUserId(authorization);
        return billingService.createCheckout(
                userId, request.plan(), request.period(), request.shouldSavePaymentMethod(), request.isMobileClient());
    }

    @GetMapping("/subscription")
    public Map<String, Object> subscription(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return billingService.getSubscription(AuthSupport.requireUserId(authorization));
    }

    @PatchMapping("/subscription/auto-renew")
    public Map<String, Object> autoRenew(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody AutoRenewPatchRequest request
    ) {
        return billingService.setAutoRenew(AuthSupport.requireUserId(authorization), request.enabled());
    }
}
