package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "promo_code_redemptions")
public class PromoCodeRedemptionEntity {

    @Id
    private UUID id;

    @Column(name = "promo_code_id", nullable = false)
    private UUID promoCodeId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "redeemed_at", nullable = false)
    private Instant redeemedAt;

    protected PromoCodeRedemptionEntity() {
    }

    public PromoCodeRedemptionEntity(UUID id, UUID promoCodeId, UUID userId, Instant redeemedAt) {
        this.id = id;
        this.promoCodeId = promoCodeId;
        this.userId = userId;
        this.redeemedAt = redeemedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPromoCodeId() {
        return promoCodeId;
    }

    public UUID getUserId() {
        return userId;
    }

    public Instant getRedeemedAt() {
        return redeemedAt;
    }
}
