package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stylist_variants")
public class StylistVariantEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "variant_key", nullable = false, length = 32)
    private String variantKey;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 512)
    private String summary;

    @Column(name = "style_direction", nullable = false, length = 512)
    private String styleDirection;

    @Column(name = "stylist_comment", columnDefinition = "TEXT")
    private String stylistComment;

    @Column(name = "product_search_status", nullable = false, length = 32)
    private String productSearchStatus = "demo";

    @Column(name = "product_search_query", length = 512)
    private String productSearchQuery;

    @Column(name = "preview_status", nullable = false, length = 32)
    private String previewStatus;

    @Column(name = "preview_image_path", length = 512)
    private String previewImagePath;

    @Column(name = "preview_image_url", length = 512)
    private String previewImageUrl;

    @Column(name = "provider", length = 64)
    private String provider;

    @Column(name = "external_request_id", length = 128)
    private String externalRequestId;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "error_message", length = 512)
    private String errorMessage;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StylistVariantEntity() {
    }

    public StylistVariantEntity(
            UUID id,
            UUID sessionId,
            String variantKey,
            String title,
            String summary,
            String styleDirection,
            String stylistComment,
            String previewStatus,
            int sortOrder,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.variantKey = variantKey;
        this.title = title;
        this.summary = summary;
        this.styleDirection = styleDirection;
        this.stylistComment = stylistComment;
        this.previewStatus = previewStatus;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public String getVariantKey() {
        return variantKey;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public String getStyleDirection() {
        return styleDirection;
    }

    public String getStylistComment() {
        return stylistComment;
    }

    public String getProductSearchStatus() {
        return productSearchStatus;
    }

    public void setProductSearchStatus(String productSearchStatus) {
        this.productSearchStatus = productSearchStatus;
    }

    public String getProductSearchQuery() {
        return productSearchQuery;
    }

    public void setProductSearchQuery(String productSearchQuery) {
        this.productSearchQuery = productSearchQuery;
    }

    public String getPreviewStatus() {
        return previewStatus;
    }

    public void setPreviewStatus(String previewStatus) {
        this.previewStatus = previewStatus;
    }

    public String getPreviewImagePath() {
        return previewImagePath;
    }

    public void setPreviewImagePath(String previewImagePath) {
        this.previewImagePath = previewImagePath;
    }

    public String getPreviewImageUrl() {
        return previewImageUrl;
    }

    public void setPreviewImageUrl(String previewImageUrl) {
        this.previewImageUrl = previewImageUrl;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getExternalRequestId() {
        return externalRequestId;
    }

    public void setExternalRequestId(String externalRequestId) {
        this.externalRequestId = externalRequestId;
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

    public int getSortOrder() {
        return sortOrder;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
