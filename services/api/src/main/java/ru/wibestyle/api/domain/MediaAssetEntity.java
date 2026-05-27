package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "media_assets")
public class MediaAssetEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 32)
    private String purpose;

    @Column(name = "content_type", length = 64)
    private String contentType;

    @Column(name = "stored_path", length = 512)
    private String storedPath;

    @Column(nullable = false, length = 16)
    private String status = "pending";

    @Column(name = "upload_token", nullable = false, length = 64)
    private String uploadToken;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected MediaAssetEntity() {
    }

    public MediaAssetEntity(
            UUID id,
            UUID userId,
            String purpose,
            String contentType,
            String uploadToken,
            Instant expiresAt,
            Instant createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.purpose = purpose;
        this.contentType = contentType;
        this.uploadToken = uploadToken;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getStoredPath() {
        return storedPath;
    }

    public void setStoredPath(String storedPath) {
        this.storedPath = storedPath;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUploadToken() {
        return uploadToken;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
