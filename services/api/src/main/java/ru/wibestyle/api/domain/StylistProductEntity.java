package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stylist_products")
public class StylistProductEntity {

    @Id
    private UUID id;

    @Column(name = "variant_id", nullable = false)
    private UUID variantId;

    @Column(nullable = false, length = 32)
    private String marketplace;

    @Column(name = "external_product_id", nullable = false, length = 128)
    private String externalProductId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 120)
    private String brand;

    @Column(name = "price_rub")
    private Integer priceRub;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "product_url", length = 512)
    private String productUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StylistProductEntity() {
    }

    public StylistProductEntity(
            UUID id,
            UUID variantId,
            String marketplace,
            String externalProductId,
            String title,
            String brand,
            Integer priceRub,
            String imageUrl,
            String productUrl,
            int sortOrder,
            Instant createdAt
    ) {
        this.id = id;
        this.variantId = variantId;
        this.marketplace = marketplace;
        this.externalProductId = externalProductId;
        this.title = title;
        this.brand = brand;
        this.priceRub = priceRub;
        this.imageUrl = imageUrl;
        this.productUrl = productUrl;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getVariantId() {
        return variantId;
    }

    public String getMarketplace() {
        return marketplace;
    }

    public String getExternalProductId() {
        return externalProductId;
    }

    public String getTitle() {
        return title;
    }

    public String getBrand() {
        return brand;
    }

    public Integer getPriceRub() {
        return priceRub;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getProductUrl() {
        return productUrl;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
