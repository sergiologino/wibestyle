package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gallery_posts")
public class GalleryPostEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 64)
    private String slug;

    @Column(length = 255)
    private String title;

    @Column(length = 512)
    private String description;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "try_on_session_id")
    private UUID tryOnSessionId;

    @Column(nullable = false, length = 32)
    private String visibility;

    @Column(name = "moderation_status", nullable = false, length = 32)
    private String moderationStatus;

    @Column(name = "product_link_visible", nullable = false)
    private boolean productLinkVisible = true;

    @Column(name = "product_visibility", nullable = false, length = 32)
    private String productVisibility = "SHOW_PRODUCT_LINK";

    @Column(length = 32)
    private String marketplace;

    @Column(name = "product_url", length = 512)
    private String productUrl;

    @Column(name = "product_title", length = 255)
    private String productTitle;

    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @Column(name = "comment_count", nullable = false)
    private int commentCount;

    @Column(name = "elite_frame", nullable = false)
    private boolean eliteFrame;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected GalleryPostEntity() {
    }

    public GalleryPostEntity(
            UUID id,
            UUID userId,
            String slug,
            String visibility,
            String moderationStatus,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.slug = slug;
        this.visibility = visibility;
        this.moderationStatus = moderationStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getSlug() {
        return slug;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public UUID getTryOnSessionId() {
        return tryOnSessionId;
    }

    public void setTryOnSessionId(UUID tryOnSessionId) {
        this.tryOnSessionId = tryOnSessionId;
    }

    public String getVisibility() {
        return visibility;
    }

    public String getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(String moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public boolean isProductLinkVisible() {
        return productLinkVisible;
    }

    public void setProductLinkVisible(boolean productLinkVisible) {
        this.productLinkVisible = productLinkVisible;
    }

    public String getProductVisibility() {
        return productVisibility;
    }

    public void setProductVisibility(String productVisibility) {
        this.productVisibility = productVisibility;
    }

    public String getMarketplace() {
        return marketplace;
    }

    public void setMarketplace(String marketplace) {
        this.marketplace = marketplace;
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

    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public int getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(int commentCount) {
        this.commentCount = commentCount;
    }

    public boolean isEliteFrame() {
        return eliteFrame;
    }

    public void setEliteFrame(boolean eliteFrame) {
        this.eliteFrame = eliteFrame;
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
}
