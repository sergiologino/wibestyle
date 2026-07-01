package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
public class UserProfileEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "display_name", length = 120)
    private String displayName;

    @Column(length = 16)
    private String gender;

    @Column(name = "interface_palette", nullable = false, length = 24)
    private String interfacePalette = "vibe";

    @Column(nullable = false, length = 16)
    private String plan = "trial";

    @Column(name = "trial_generations_left", nullable = false)
    private int trialGenerationsLeft = 3;

    @Column(name = "trial_video_generations_left", nullable = false)
    private int trialVideoGenerationsLeft = 1;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private Integer weightKg;

    @Column(name = "bust_cm")
    private Integer bustCm;

    @Column(name = "waist_cm")
    private Integer waistCm;

    @Column(name = "hips_cm")
    private Integer hipsCm;

    @Column(name = "shoe_size_eu")
    private Integer shoeSizeEu;

    @Column(name = "clothing_size", length = 8)
    private String clothingSize;

    @Column(name = "profile_type", length = 16)
    private String profileType;

    @Column(name = "sizing_system", length = 16)
    private String sizingSystem;

    @Column(name = "privacy_face_hidden", nullable = false)
    private boolean privacyFaceHidden = true;

    @Column(name = "privacy_background_hidden", nullable = false)
    private boolean privacyBackgroundHidden = false;

    @Column(name = "privacy_features_hidden", nullable = false)
    private boolean privacyFeaturesHidden = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "plan_generations_left", nullable = false)
    private int planGenerationsLeft;

    @Column(name = "bonus_generations_left", nullable = false)
    private int bonusGenerationsLeft;

    @Column(name = "billing_period", length = 16)
    private String billingPeriod;

    @Column(name = "subscription_expires_at")
    private Instant subscriptionExpiresAt;

    @Column(name = "active_promo_code_id")
    private UUID activePromoCodeId;

    @Column(name = "promo_discount_percent")
    private Integer promoDiscountPercent;

    protected UserProfileEntity() {
    }

    public UserProfileEntity(UUID userId, Instant updatedAt) {
        this.userId = userId;
        this.updatedAt = updatedAt;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getInterfacePalette() {
        return interfacePalette;
    }

    public void setInterfacePalette(String interfacePalette) {
        this.interfacePalette = interfacePalette;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public int getTrialGenerationsLeft() {
        return trialGenerationsLeft;
    }

    public void setTrialGenerationsLeft(int trialGenerationsLeft) {
        this.trialGenerationsLeft = trialGenerationsLeft;
    }

    public int getTrialVideoGenerationsLeft() {
        return trialVideoGenerationsLeft;
    }

    public void setTrialVideoGenerationsLeft(int trialVideoGenerationsLeft) {
        this.trialVideoGenerationsLeft = trialVideoGenerationsLeft;
    }

    public Integer getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Integer heightCm) {
        this.heightCm = heightCm;
    }

    public Integer getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Integer weightKg) {
        this.weightKg = weightKg;
    }

    public Integer getBustCm() {
        return bustCm;
    }

    public void setBustCm(Integer bustCm) {
        this.bustCm = bustCm;
    }

    public Integer getWaistCm() {
        return waistCm;
    }

    public void setWaistCm(Integer waistCm) {
        this.waistCm = waistCm;
    }

    public Integer getHipsCm() {
        return hipsCm;
    }

    public void setHipsCm(Integer hipsCm) {
        this.hipsCm = hipsCm;
    }

    public Integer getShoeSizeEu() {
        return shoeSizeEu;
    }

    public void setShoeSizeEu(Integer shoeSizeEu) {
        this.shoeSizeEu = shoeSizeEu;
    }

    public String getClothingSize() {
        return clothingSize;
    }

    public void setClothingSize(String clothingSize) {
        this.clothingSize = clothingSize;
    }

    public String getProfileType() {
        return profileType;
    }

    public void setProfileType(String profileType) {
        this.profileType = profileType;
    }

    public String getSizingSystem() {
        return sizingSystem;
    }

    public void setSizingSystem(String sizingSystem) {
        this.sizingSystem = sizingSystem;
    }

    public boolean isPrivacyFaceHidden() {
        return privacyFaceHidden;
    }

    public void setPrivacyFaceHidden(boolean privacyFaceHidden) {
        this.privacyFaceHidden = privacyFaceHidden;
    }

    public boolean isPrivacyBackgroundHidden() {
        return privacyBackgroundHidden;
    }

    public void setPrivacyBackgroundHidden(boolean privacyBackgroundHidden) {
        this.privacyBackgroundHidden = privacyBackgroundHidden;
    }

    public boolean isPrivacyFeaturesHidden() {
        return privacyFeaturesHidden;
    }

    public void setPrivacyFeaturesHidden(boolean privacyFeaturesHidden) {
        this.privacyFeaturesHidden = privacyFeaturesHidden;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getPlanGenerationsLeft() {
        return planGenerationsLeft;
    }

    public void setPlanGenerationsLeft(int planGenerationsLeft) {
        this.planGenerationsLeft = planGenerationsLeft;
    }

    public int getBonusGenerationsLeft() {
        return bonusGenerationsLeft;
    }

    public void setBonusGenerationsLeft(int bonusGenerationsLeft) {
        this.bonusGenerationsLeft = bonusGenerationsLeft;
    }

    public String getBillingPeriod() {
        return billingPeriod;
    }

    public void setBillingPeriod(String billingPeriod) {
        this.billingPeriod = billingPeriod;
    }

    public Instant getSubscriptionExpiresAt() {
        return subscriptionExpiresAt;
    }

    public void setSubscriptionExpiresAt(Instant subscriptionExpiresAt) {
        this.subscriptionExpiresAt = subscriptionExpiresAt;
    }

    public UUID getActivePromoCodeId() {
        return activePromoCodeId;
    }

    public void setActivePromoCodeId(UUID activePromoCodeId) {
        this.activePromoCodeId = activePromoCodeId;
    }

    public Integer getPromoDiscountPercent() {
        return promoDiscountPercent;
    }

    public void setPromoDiscountPercent(Integer promoDiscountPercent) {
        this.promoDiscountPercent = promoDiscountPercent;
    }
}
