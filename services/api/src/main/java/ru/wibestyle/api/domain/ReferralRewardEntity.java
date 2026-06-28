package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "referral_rewards")
public class ReferralRewardEntity {
    @Id
    private UUID id;
    @Column(name = "referrer_user_id", nullable = false)
    private UUID referrerUserId;
    @Column(name = "referred_user_id", nullable = false, unique = true)
    private UUID referredUserId;
    @Column(name = "checkout_id", nullable = false, unique = true)
    private UUID checkoutId;
    @Column(name = "billing_period", nullable = false, length = 16)
    private String billingPeriod;
    @Column(name = "reward_generations", nullable = false)
    private int rewardGenerations;
    @Column(name = "friend_label", nullable = false, length = 160)
    private String friendLabel;
    @Column(name = "rewarded_at", nullable = false)
    private Instant rewardedAt;

    protected ReferralRewardEntity() {}

    public ReferralRewardEntity(UUID id, UUID referrerUserId, UUID referredUserId, UUID checkoutId,
                                String billingPeriod, int rewardGenerations, String friendLabel, Instant rewardedAt) {
        this.id = id;
        this.referrerUserId = referrerUserId;
        this.referredUserId = referredUserId;
        this.checkoutId = checkoutId;
        this.billingPeriod = billingPeriod;
        this.rewardGenerations = rewardGenerations;
        this.friendLabel = friendLabel;
        this.rewardedAt = rewardedAt;
    }

    public UUID getId() { return id; }
    public UUID getReferrerUserId() { return referrerUserId; }
    public UUID getReferredUserId() { return referredUserId; }
    public UUID getCheckoutId() { return checkoutId; }
    public String getBillingPeriod() { return billingPeriod; }
    public int getRewardGenerations() { return rewardGenerations; }
    public String getFriendLabel() { return friendLabel; }
    public Instant getRewardedAt() { return rewardedAt; }
}
