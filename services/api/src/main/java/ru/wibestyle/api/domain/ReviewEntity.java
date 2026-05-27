package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reviews")
public class ReviewEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "try_on_session_id")
    private UUID tryOnSessionId;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "display_name", length = 120)
    private String displayName;

    @Column(name = "allow_publish", nullable = false)
    private boolean allowPublish;

    @Column(nullable = false, length = 16)
    private String status = "pending";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    protected ReviewEntity() {
    }

    public ReviewEntity(
            UUID id,
            UUID userId,
            UUID tryOnSessionId,
            int rating,
            String body,
            String displayName,
            boolean allowPublish,
            Instant createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.tryOnSessionId = tryOnSessionId;
        this.rating = rating;
        this.body = body;
        this.displayName = displayName;
        this.allowPublish = allowPublish;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getTryOnSessionId() {
        return tryOnSessionId;
    }

    public int getRating() {
        return rating;
    }

    public String getBody() {
        return body;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isAllowPublish() {
        return allowPublish;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }
}
