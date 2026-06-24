package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "billing_checkouts")
public class BillingCheckoutEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 16)
    private String plan;

    @Column(name = "billing_period", nullable = false, length = 16)
    private String billingPeriod;

    @Column(name = "price_rub", nullable = false)
    private int priceRub;

    @Column(nullable = false, length = 16)
    private String status = "pending";

    @Column(nullable = false, length = 32)
    private String provider = "mock";

    @Column(name = "external_payment_id", length = 128)
    private String externalPaymentId;

    @Column(name = "save_payment_method", nullable = false)
    private boolean savePaymentMethod;

    @Column(name = "checkout_type", nullable = false, length = 16)
    private String checkoutType = "initial";

    @Column(name = "renewal_key", length = 160, unique = true)
    private String renewalKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected BillingCheckoutEntity() {
    }

    public BillingCheckoutEntity(
            UUID id,
            UUID userId,
            String plan,
            String billingPeriod,
            int priceRub,
            String provider,
            Instant createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.plan = plan;
        this.billingPeriod = billingPeriod;
        this.priceRub = priceRub;
        this.provider = provider;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getPlan() {
        return plan;
    }

    public String getBillingPeriod() {
        return billingPeriod;
    }

    public int getPriceRub() {
        return priceRub;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProvider() {
        return provider;
    }

    public String getExternalPaymentId() {
        return externalPaymentId;
    }

    public void setExternalPaymentId(String externalPaymentId) {
        this.externalPaymentId = externalPaymentId;
    }

    public boolean isSavePaymentMethod() { return savePaymentMethod; }

    public void setSavePaymentMethod(boolean savePaymentMethod) { this.savePaymentMethod = savePaymentMethod; }

    public String getCheckoutType() { return checkoutType; }

    public void setCheckoutType(String checkoutType) { this.checkoutType = checkoutType; }

    public String getRenewalKey() { return renewalKey; }

    public void setRenewalKey(String renewalKey) { this.renewalKey = renewalKey; }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
