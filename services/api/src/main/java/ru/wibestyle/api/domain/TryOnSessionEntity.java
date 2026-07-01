package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "try_on_sessions")
public class TryOnSessionEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "avatar_snapshot_id")
    private UUID avatarSnapshotId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 32)
    private TryOnSourceType sourceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TryOnSessionStatus status;

    @Column(nullable = false, length = 16)
    private String visibility = "private";

    @Column(length = 32)
    private String marketplace;

    @Column(name = "external_product_id", length = 128)
    private String externalProductId;

    @Column(name = "product_url", length = 512)
    private String productUrl;

    @Column(name = "product_title", length = 255)
    private String productTitle;

    @Column(name = "product_brand", length = 120)
    private String productBrand;

    @Column(name = "product_price_rub")
    private Integer productPriceRub;

    @Column(name = "product_image_url", length = 512)
    private String productImageUrl;

    @Column(name = "product_sizes", length = 255)
    private String productSizes;

    @Column(name = "selected_size", length = 16)
    private String selectedSize;

    @Column(name = "garment_category", length = 32)
    private String garmentCategory;

    @Column(name = "garment_prompt_profile", length = 32)
    private String garmentPromptProfile;

    @Column(name = "garment_coverage_level", length = 32)
    private String garmentCoverageLevel;

    @Column(name = "garment_moderation_risk", length = 32)
    private String garmentModerationRisk;

    @Column(name = "garment_has_human_model", nullable = false)
    private boolean garmentHasHumanModel;

    @Column(name = "garment_photo_path", length = 512)
    private String garmentPhotoPath;

    @Column(name = "size_warning", length = 64)
    private String sizeWarning;

    @Column(name = "recommended_size", length = 16)
    private String recommendedSize;

    @Column(name = "size_fit_status", length = 32)
    private String sizeFitStatus;

    @Column(name = "size_fit_message", length = 512)
    private String sizeFitMessage;

    @Column(name = "style_compliment", length = 512)
    private String styleCompliment;

    @Column(name = "product_size_chart", columnDefinition = "TEXT")
    private String productSizeChart;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "error_message", length = 512)
    private String errorMessage;

    @Column(name = "before_image_url", length = 512)
    private String beforeImageUrl;

    @Column(name = "after_image_url", length = 512)
    private String afterImageUrl;

    @Column(name = "video_status", nullable = false, length = 32)
    private String videoStatus = "none";

    @Column(name = "after_video_url", length = 512)
    private String afterVideoUrl;

    @Column(name = "video_error_code", length = 64)
    private String videoErrorCode;

    @Column(name = "video_error_message", length = 512)
    private String videoErrorMessage;

    @Column(name = "video_quota_reserved", nullable = false)
    private boolean videoQuotaReserved;

    @Column(name = "video_quota_consumed", nullable = false)
    private boolean videoQuotaConsumed;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "quota_reserved", nullable = false)
    private boolean quotaReserved;

    @Column(name = "quota_consumed", nullable = false)
    private boolean quotaConsumed;

    protected TryOnSessionEntity() {
    }

    public TryOnSessionEntity(
            UUID id,
            UUID userId,
            UUID avatarSnapshotId,
            TryOnSourceType sourceType,
            TryOnSessionStatus status,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.avatarSnapshotId = avatarSnapshotId;
        this.sourceType = sourceType;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getAvatarSnapshotId() {
        return avatarSnapshotId;
    }

    public TryOnSourceType getSourceType() {
        return sourceType;
    }

    public TryOnSessionStatus getStatus() {
        return status;
    }

    public void setStatus(TryOnSessionStatus status) {
        this.status = status;
    }

    public String getVisibility() {
        return visibility;
    }

    public String getMarketplace() {
        return marketplace;
    }

    public void setMarketplace(String marketplace) {
        this.marketplace = marketplace;
    }

    public String getExternalProductId() {
        return externalProductId;
    }

    public void setExternalProductId(String externalProductId) {
        this.externalProductId = externalProductId;
    }

    public String getProductUrl() {
        return productUrl;
    }

    public void setProductUrl(String productUrl) {
        this.productUrl = productUrl;
    }

    public String getProductTitle() {
        return productTitle;
    }

    public void setProductTitle(String productTitle) {
        this.productTitle = productTitle;
    }

    public String getProductBrand() {
        return productBrand;
    }

    public void setProductBrand(String productBrand) {
        this.productBrand = productBrand;
    }

    public Integer getProductPriceRub() {
        return productPriceRub;
    }

    public void setProductPriceRub(Integer productPriceRub) {
        this.productPriceRub = productPriceRub;
    }

    public String getProductImageUrl() {
        return productImageUrl;
    }

    public void setProductImageUrl(String productImageUrl) {
        this.productImageUrl = productImageUrl;
    }

    public String getProductSizes() {
        return productSizes;
    }

    public void setProductSizes(String productSizes) {
        this.productSizes = productSizes;
    }

    public String getSelectedSize() {
        return selectedSize;
    }

    public void setSelectedSize(String selectedSize) {
        this.selectedSize = selectedSize;
    }

    public String getGarmentCategory() {
        return garmentCategory;
    }

    public void setGarmentCategory(String garmentCategory) {
        this.garmentCategory = garmentCategory;
    }

    public String getGarmentPromptProfile() {
        return garmentPromptProfile;
    }

    public void setGarmentPromptProfile(String garmentPromptProfile) {
        this.garmentPromptProfile = garmentPromptProfile;
    }

    public String getGarmentCoverageLevel() {
        return garmentCoverageLevel;
    }

    public void setGarmentCoverageLevel(String garmentCoverageLevel) {
        this.garmentCoverageLevel = garmentCoverageLevel;
    }

    public String getGarmentModerationRisk() {
        return garmentModerationRisk;
    }

    public void setGarmentModerationRisk(String garmentModerationRisk) {
        this.garmentModerationRisk = garmentModerationRisk;
    }

    public boolean isGarmentHasHumanModel() {
        return garmentHasHumanModel;
    }

    public void setGarmentHasHumanModel(boolean garmentHasHumanModel) {
        this.garmentHasHumanModel = garmentHasHumanModel;
    }

    public String getGarmentPhotoPath() {
        return garmentPhotoPath;
    }

    public void setGarmentPhotoPath(String garmentPhotoPath) {
        this.garmentPhotoPath = garmentPhotoPath;
    }

    public String getSizeWarning() {
        return sizeWarning;
    }

    public void setSizeWarning(String sizeWarning) {
        this.sizeWarning = sizeWarning;
    }

    public String getRecommendedSize() {
        return recommendedSize;
    }

    public void setRecommendedSize(String recommendedSize) {
        this.recommendedSize = recommendedSize;
    }

    public String getSizeFitStatus() {
        return sizeFitStatus;
    }

    public void setSizeFitStatus(String sizeFitStatus) {
        this.sizeFitStatus = sizeFitStatus;
    }

    public String getSizeFitMessage() {
        return sizeFitMessage;
    }

    public void setSizeFitMessage(String sizeFitMessage) {
        this.sizeFitMessage = sizeFitMessage;
    }

    public String getStyleCompliment() {
        return styleCompliment;
    }

    public void setStyleCompliment(String styleCompliment) {
        this.styleCompliment = styleCompliment;
    }

    public String getProductSizeChart() {
        return productSizeChart;
    }

    public void setProductSizeChart(String productSizeChart) {
        this.productSizeChart = productSizeChart;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getBeforeImageUrl() {
        return beforeImageUrl;
    }

    public void setBeforeImageUrl(String beforeImageUrl) {
        this.beforeImageUrl = beforeImageUrl;
    }

    public String getAfterImageUrl() {
        return afterImageUrl;
    }

    public void setAfterImageUrl(String afterImageUrl) {
        this.afterImageUrl = afterImageUrl;
    }

    public String getVideoStatus() {
        return videoStatus;
    }

    public void setVideoStatus(String videoStatus) {
        this.videoStatus = videoStatus;
    }

    public String getAfterVideoUrl() {
        return afterVideoUrl;
    }

    public void setAfterVideoUrl(String afterVideoUrl) {
        this.afterVideoUrl = afterVideoUrl;
    }

    public String getVideoErrorCode() {
        return videoErrorCode;
    }

    public void setVideoErrorCode(String videoErrorCode) {
        this.videoErrorCode = videoErrorCode;
    }

    public String getVideoErrorMessage() {
        return videoErrorMessage;
    }

    public void setVideoErrorMessage(String videoErrorMessage) {
        this.videoErrorMessage = videoErrorMessage;
    }

    public boolean isVideoQuotaReserved() {
        return videoQuotaReserved;
    }

    public void setVideoQuotaReserved(boolean videoQuotaReserved) {
        this.videoQuotaReserved = videoQuotaReserved;
    }

    public boolean isVideoQuotaConsumed() {
        return videoQuotaConsumed;
    }

    public void setVideoQuotaConsumed(boolean videoQuotaConsumed) {
        this.videoQuotaConsumed = videoQuotaConsumed;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isQuotaReserved() {
        return quotaReserved;
    }

    public void setQuotaReserved(boolean quotaReserved) {
        this.quotaReserved = quotaReserved;
    }

    public boolean isQuotaConsumed() {
        return quotaConsumed;
    }

    public void setQuotaConsumed(boolean quotaConsumed) {
        this.quotaConsumed = quotaConsumed;
    }
}
