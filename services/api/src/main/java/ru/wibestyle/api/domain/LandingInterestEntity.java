package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "landing_interests")
public class LandingInterestEntity {

    @Id
    private UUID id;

    @Column(name = "email_or_phone", nullable = false, length = 255)
    private String emailOrPhone;

    @Column(length = 64)
    private String interest;

    @Column(length = 255)
    private String page;

    @Column(name = "utm_source", length = 128)
    private String utmSource;

    @Column(name = "utm_campaign", length = 128)
    private String utmCampaign;

    @Column(length = 512)
    private String referrer;

    @Column(nullable = false)
    private boolean consent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected LandingInterestEntity() {
    }

    public LandingInterestEntity(
            UUID id,
            String emailOrPhone,
            String interest,
            String page,
            String utmSource,
            String utmCampaign,
            String referrer,
            boolean consent,
            Instant createdAt
    ) {
        this.id = id;
        this.emailOrPhone = emailOrPhone;
        this.interest = interest;
        this.page = page;
        this.utmSource = utmSource;
        this.utmCampaign = utmCampaign;
        this.referrer = referrer;
        this.consent = consent;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getEmailOrPhone() {
        return emailOrPhone;
    }

    public String getInterest() {
        return interest;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
