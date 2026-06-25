package ru.wibestyle.api.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Instant;

@Component
public class BillingRenewalScheduler {
    private final BillingService billingService;
    public BillingRenewalScheduler(BillingService billingService) { this.billingService = billingService; }

    @Scheduled(cron = "${wibestyle.billing.renewal-cron:0 15 * * * *}")
    public void processRenewals() {
        Instant now = Instant.now();
        billingService.sendRenewalWarnings(now);
        billingService.processDueRenewals(now);
    }
}
