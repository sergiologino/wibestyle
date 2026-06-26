package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "favorites")
public class FavoriteEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 32)
    private String marketplace;

    @Column(name = "external_product_id", nullable = false, length = 128)
    private String externalProductId;

    @Column(name = "product_title", length = 255)
    private String productTitle;

    @Column(name = "product_brand", length = 120)
    private String productBrand;

    @Column(name = "product_price_rub")
    private Integer productPriceRub;

    @Column(name = "product_image_url", length = 512)
    private String productImageUrl;

    @Column(name = "product_url", length = 512)
    private String productUrl;

    @Column(name = "try_on_session_id")
    private UUID tryOnSessionId;

    @Column(name = "product_sizes", length = 255)
    private String productSizes;

    @Column(length = 512)
    private String note;

    @Column(length = 255)
    private String tags;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FavoriteEntity() {
    }

    public FavoriteEntity(UUID id, UUID userId, String marketplace, String externalProductId, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.marketplace = marketplace;
        this.externalProductId = externalProductId;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getMarketplace() {
        return marketplace;
    }

    public String getExternalProductId() {
        return externalProductId;
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

    public String getProductUrl() {
        return productUrl;
    }

    public void setProductUrl(String productUrl) {
        this.productUrl = productUrl;
    }

    public UUID getTryOnSessionId() {
        return tryOnSessionId;
    }

    public void setTryOnSessionId(UUID tryOnSessionId) {
        this.tryOnSessionId = tryOnSessionId;
    }

    public String getProductSizes() {
        return productSizes;
    }

    public void setProductSizes(String productSizes) {
        this.productSizes = productSizes;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
