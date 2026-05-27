package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "landing_leads")
public class LandingLeadEntity {

    @Id
    private UUID id;

    @Column(name = "spot_number", nullable = false)
    private int spotNumber;

    @Column(name = "has_discount", nullable = false)
    private boolean hasDiscount;

    @Column(name = "price_annual", nullable = false)
    private int priceAnnual;

    @Column(name = "price_with_discount", nullable = false)
    private int priceWithDiscount;

    private String name;

    @Column(name = "phone_or_email", nullable = false)
    private String phoneOrEmail;

    private String gender;

    @Column(name = "favorite_marketplace")
    private String favoriteMarketplace;

    private String interest;

    @Column(nullable = false)
    private boolean consent;

    @Column(nullable = false, length = 16)
    private String status = "new";

    private String page;

    @Column(name = "utm_source", length = 128)
    private String utmSource;

    @Column(name = "utm_campaign", length = 128)
    private String utmCampaign;

    @Column(length = 512)
    private String referrer;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected LandingLeadEntity() {
    }

    public LandingLeadEntity(
            UUID id,
            int spotNumber,
            boolean hasDiscount,
            int priceAnnual,
            int priceWithDiscount,
            String name,
            String phoneOrEmail,
            String gender,
            String favoriteMarketplace,
            String interest,
            boolean consent,
            String page,
            String utmSource,
            String utmCampaign,
            String referrer,
            Instant createdAt
    ) {
        this.id = id;
        this.spotNumber = spotNumber;
        this.hasDiscount = hasDiscount;
        this.priceAnnual = priceAnnual;
        this.priceWithDiscount = priceWithDiscount;
        this.name = name;
        this.phoneOrEmail = phoneOrEmail;
        this.gender = gender;
        this.favoriteMarketplace = favoriteMarketplace;
        this.interest = interest;
        this.consent = consent;
        this.page = page;
        this.utmSource = utmSource;
        this.utmCampaign = utmCampaign;
        this.referrer = referrer;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public int getSpotNumber() {
        return spotNumber;
    }

    public boolean isHasDiscount() {
        return hasDiscount;
    }

    public int getPriceAnnual() {
        return priceAnnual;
    }

    public int getPriceWithDiscount() {
        return priceWithDiscount;
    }

    public String getName() {
        return name;
    }

    public String getPhoneOrEmail() {
        return phoneOrEmail;
    }

    public String getGender() {
        return gender;
    }

    public String getFavoriteMarketplace() {
        return favoriteMarketplace;
    }

    public String getInterest() {
        return interest;
    }

    public boolean isConsent() {
        return consent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPage() {
        return page;
    }

    public String getUtmSource() {
        return utmSource;
    }

    public String getUtmCampaign() {
        return utmCampaign;
    }

    public String getReferrer() {
        return referrer;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
