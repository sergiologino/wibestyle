package ru.wibestyle.api.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hair_color_catalog")
public class HairColorCatalogEntity {
    @Id private UUID id;
    @Column(nullable = false, unique = true) private String slug;
    @Column(nullable = false) private String title;
    @Column(nullable = false) private String family;
    @Column(nullable = false, length = 600) private String description;
    @Column(name = "ai_directive", nullable = false, length = 600) private String aiDirective;
    @Column(name = "image_path", nullable = false) private String imagePath;
    @Column(name = "source_brand", nullable = false) private String sourceBrand;
    @Column(name = "source_url", nullable = false, length = 700) private String sourceUrl;
    @Column(name = "attribution_text", nullable = false, length = 500) private String attributionText;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected HairColorCatalogEntity() {}

    public HairColorCatalogEntity(UUID id, String slug, String title, String family, String description,
                                  String aiDirective, String imagePath, String sourceBrand, String sourceUrl,
                                  String attributionText, int sortOrder, Instant now) {
        this.id = id; this.slug = slug; this.title = title; this.family = family; this.description = description;
        this.aiDirective = aiDirective; this.imagePath = imagePath; this.sourceBrand = sourceBrand;
        this.sourceUrl = sourceUrl; this.attributionText = attributionText; this.sortOrder = sortOrder;
        this.createdAt = now; this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getFamily() { return family; }
    public String getDescription() { return description; }
    public String getAiDirective() { return aiDirective; }
    public String getImagePath() { return imagePath; }
    public String getSourceBrand() { return sourceBrand; }
    public String getSourceUrl() { return sourceUrl; }
    public String getAttributionText() { return attributionText; }
    public int getSortOrder() { return sortOrder; }
    public boolean isActive() { return active; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void updateCatalogData(String title, String family, String description, String aiDirective,
                                  String imagePath, String sourceBrand, String sourceUrl,
                                  String attributionText, int sortOrder, Instant now) {
        this.title = title;
        this.family = family;
        this.description = description;
        this.aiDirective = aiDirective;
        this.imagePath = imagePath;
        this.sourceBrand = sourceBrand;
        this.sourceUrl = sourceUrl;
        this.attributionText = attributionText;
        this.sortOrder = sortOrder;
        this.active = true;
        this.updatedAt = now;
    }

    public void updateAdminData(String title, String family, String description, String aiDirective,
                                String sourceBrand, String sourceUrl, String attributionText,
                                int sortOrder, boolean active) {
        this.title = title;
        this.family = family;
        this.description = description;
        this.aiDirective = aiDirective;
        this.sourceBrand = sourceBrand;
        this.sourceUrl = sourceUrl;
        this.attributionText = attributionText;
        this.sortOrder = sortOrder;
        this.active = active;
        this.updatedAt = Instant.now();
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
        this.updatedAt = Instant.now();
    }

    public void deactivate(Instant now) {
        this.active = false;
        this.updatedAt = now;
    }
}
