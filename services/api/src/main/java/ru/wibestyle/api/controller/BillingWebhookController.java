package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.dto.BillingWebhookRequest;
import ru.wibestyle.api.service.BillingService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing/webhooks")
public class BillingWebhookController {

    private final BillingService billingService;

    public BillingWebhookController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/{provider}")
    public Map<String, Object> webhook(
            @PathVariable String provider,
            @Valid @RequestBody BillingWebhookRequest request
    ) {
        return billingService.handleWebhook(provider, request);
    }

    @PostMapping("/mock/simulate")
    public Map<String, Object> simulateMockPayment(@RequestParam UUID checkoutId) {
        return billingService.handleWebhook(
                "mock",
                new BillingWebhookRequest("payment.succeeded", checkoutId, "mock-pay-" + checkoutId)
        );
    }
}
