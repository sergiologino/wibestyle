package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "promo_codes")
public class PromoCodeEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "discount_percent", nullable = false)
    private int discountPercent;

    @Column(name = "max_uses", nullable = false)
    private int maxUses;

    @Column(name = "uses_count", nullable = false)
    private int usesCount;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(length = 120)
    private String label;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PromoCodeEntity() {
    }

    public PromoCodeEntity(
            UUID id,
            String code,
            int discountPercent,
            int maxUses,
            Instant expiresAt,
            String label,
            Instant createdAt
    ) {
        this.id = id;
        this.code = code;
        this.discountPercent = discountPercent;
        this.maxUses = maxUses;
        this.expiresAt = expiresAt;
        this.label = label;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public int getDiscountPercent() {
        return discountPercent;
    }

    public int getMaxUses() {
        return maxUses;
    }

    public int getUsesCount() {
        return usesCount;
    }

    public void setUsesCount(int usesCount) {
        this.usesCount = usesCount;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }

    public String getLabel() {
        return label;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isActive(Instant now) {
        return revokedAt == null && !expiresAt.isBefore(now) && usesCount < maxUses;
    }
}
