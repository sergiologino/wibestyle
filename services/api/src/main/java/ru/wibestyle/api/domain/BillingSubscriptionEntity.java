package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "billing_subscriptions")
public class BillingSubscriptionEntity {
    @Id
    @Column(name = "user_id")
    private UUID userId;
    @Column(nullable = false, length = 16)
    private String plan;
    @Column(name = "billing_period", nullable = false, length = 16)
    private String billingPeriod;
    @Column(name = "current_period_end", nullable = false)
    private Instant currentPeriodEnd;
    @Column(name = "auto_renew_enabled", nullable = false)
    private boolean autoRenewEnabled;
    @Column(nullable = false, length = 32)
    private String provider;
    @Column(name = "provider_payment_method_id", length = 128)
    private String providerPaymentMethodId;
    @Column(nullable = false, length = 24)
    private String status = "active";
    @Column(name = "renewal_failure_count", nullable = false)
    private int renewalFailureCount;
    @Column(name = "next_renewal_attempt_at")
    private Instant nextRenewalAttemptAt;
    @Column(name = "warning_sent_for")
    private Instant warningSentFor;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected BillingSubscriptionEntity() {}

    public BillingSubscriptionEntity(UUID userId, String plan, String billingPeriod, Instant currentPeriodEnd,
                                     String provider, Instant now) {
        this.userId = userId;
        this.plan = plan;
        this.billingPeriod = billingPeriod;
        this.currentPeriodEnd = currentPeriodEnd;
        this.provider = provider;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getUserId() { return userId; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getBillingPeriod() { return billingPeriod; }
    public void setBillingPeriod(String billingPeriod) { this.billingPeriod = billingPeriod; }
    public Instant getCurrentPeriodEnd() { return currentPeriodEnd; }
    public void setCurrentPeriodEnd(Instant currentPeriodEnd) { this.currentPeriodEnd = currentPeriodEnd; }
    public boolean isAutoRenewEnabled() { return autoRenewEnabled; }
    public void setAutoRenewEnabled(boolean autoRenewEnabled) { this.autoRenewEnabled = autoRenewEnabled; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProviderPaymentMethodId() { return providerPaymentMethodId; }
    public void setProviderPaymentMethodId(String providerPaymentMethodId) { this.providerPaymentMethodId = providerPaymentMethodId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getRenewalFailureCount() { return renewalFailureCount; }
    public void setRenewalFailureCount(int renewalFailureCount) { this.renewalFailureCount = renewalFailureCount; }
    public Instant getNextRenewalAttemptAt() { return nextRenewalAttemptAt; }
    public void setNextRenewalAttemptAt(Instant nextRenewalAttemptAt) { this.nextRenewalAttemptAt = nextRenewalAttemptAt; }
    public Instant getWarningSentFor() { return warningSentFor; }
    public void setWarningSentFor(Instant warningSentFor) { this.warningSentFor = warningSentFor; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
