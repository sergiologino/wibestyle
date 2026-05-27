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
@Table(name = "avatars")
public class AvatarEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AvatarStatus status;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "photo_original_path", length = 512)
    private String photoOriginalPath;

    @Column(name = "photo_processed_path", length = 512)
    private String photoProcessedPath;

    @Column(name = "quality_score")
    private Double qualityScore;

    @Column(name = "quality_warnings", length = 2000)
    private String qualityWarnings;

    @Column(name = "privacy_face_hidden", nullable = false)
    private boolean privacyFaceHidden = true;

    @Column(name = "privacy_background_hidden", nullable = false)
    private boolean privacyBackgroundHidden = false;

    @Column(name = "privacy_features_hidden", nullable = false)
    private boolean privacyFeaturesHidden = false;

    @Column(name = "pipeline_version", nullable = false, length = 16)
    private String pipelineVersion = "v1";

    @Column(name = "exif_removed", nullable = false)
    private boolean exifRemoved = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AvatarEntity() {
    }

    public AvatarEntity(
            UUID id,
            UUID userId,
            AvatarStatus status,
            boolean active,
            boolean privacyFaceHidden,
            boolean privacyBackgroundHidden,
            boolean privacyFeaturesHidden,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.status = status;
        this.active = active;
        this.privacyFaceHidden = privacyFaceHidden;
        this.privacyBackgroundHidden = privacyBackgroundHidden;
        this.privacyFeaturesHidden = privacyFeaturesHidden;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public AvatarStatus getStatus() {
        return status;
    }

    public void setStatus(AvatarStatus status) {
        this.status = status;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getPhotoOriginalPath() {
        return photoOriginalPath;
    }

    public void setPhotoOriginalPath(String photoOriginalPath) {
        this.photoOriginalPath = photoOriginalPath;
    }

    public String getPhotoProcessedPath() {
        return photoProcessedPath;
    }

    public void setPhotoProcessedPath(String photoProcessedPath) {
        this.photoProcessedPath = photoProcessedPath;
    }

    public Double getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(Double qualityScore) {
        this.qualityScore = qualityScore;
    }

    public String getQualityWarnings() {
        return qualityWarnings;
    }

    public void setQualityWarnings(String qualityWarnings) {
        this.qualityWarnings = qualityWarnings;
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

    public String getPipelineVersion() {
        return pipelineVersion;
    }

    public boolean isExifRemoved() {
        return exifRemoved;
    }

    public void setExifRemoved(boolean exifRemoved) {
        this.exifRemoved = exifRemoved;
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
