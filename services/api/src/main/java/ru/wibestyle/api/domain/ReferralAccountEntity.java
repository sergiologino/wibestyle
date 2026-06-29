package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "referral_accounts")
public class ReferralAccountEntity {
    @Id
    @Column(name = "user_id")
    private UUID userId;
    @Column(name = "referral_code", nullable = false, unique = true, length = 16)
    private String referralCode;
    @Column(name = "referred_by_user_id")
    private UUID referredByUserId;
    @Column(name = "referred_at")
    private Instant referredAt;
    @Column(name = "first_paid_at")
    private Instant firstPaidAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ReferralAccountEntity() {}

    public ReferralAccountEntity(UUID userId, String referralCode, Instant createdAt) {
        this.userId = userId;
        this.referralCode = referralCode;
        this.createdAt = createdAt;
    }

    public UUID getUserId() { return userId; }
    public String getReferralCode() { return referralCode; }
    public UUID getReferredByUserId() { return referredByUserId; }
    public void setReferredByUserId(UUID referredByUserId) { this.referredByUserId = referredByUserId; }
    public Instant getReferredAt() { return referredAt; }
    public void setReferredAt(Instant referredAt) { this.referredAt = referredAt; }
    public Instant getFirstPaidAt() { return firstPaidAt; }
    public void setFirstPaidAt(Instant firstPaidAt) { this.firstPaidAt = firstPaidAt; }
}
