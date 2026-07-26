package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_activity")
public class UserActivityEntity {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "last_try_on_at")
    private Instant lastTryOnAt;

    @Column(name = "last_gallery_at")
    private Instant lastGalleryAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserActivityEntity() {
    }

    public UserActivityEntity(UUID userId, Instant now) {
        this.userId = userId;
        this.lastSeenAt = now;
        this.updatedAt = now;
    }

    public UUID getUserId() {
        return userId;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    public Instant getLastTryOnAt() {
        return lastTryOnAt;
    }

    public void setLastTryOnAt(Instant lastTryOnAt) {
        this.lastTryOnAt = lastTryOnAt;
    }

    public Instant getLastGalleryAt() {
        return lastGalleryAt;
    }

    public void setLastGalleryAt(Instant lastGalleryAt) {
        this.lastGalleryAt = lastGalleryAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
