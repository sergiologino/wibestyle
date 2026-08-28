package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stylist_sessions")
public class StylistSessionEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "avatar_snapshot_id", nullable = false)
    private UUID avatarSnapshotId;

    @Column(name = "preset_id", nullable = false, length = 64)
    private String presetId;

    @Column(name = "preset_title", nullable = false, length = 120)
    private String presetTitle;

    @Column(nullable = false, length = 32)
    private String season;

    @Column(name = "avatar_analysis", columnDefinition = "TEXT")
    private String avatarAnalysis;

    @Column(name = "trend_note", columnDefinition = "TEXT")
    private String trendNote;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "selected_variant_id", length = 32)
    private String selectedVariantId;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "error_message", length = 512)
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StylistSessionEntity() {
    }

    public StylistSessionEntity(
            UUID id,
            UUID userId,
            UUID avatarSnapshotId,
            String presetId,
            String presetTitle,
            String season,
            String avatarAnalysis,
            String trendNote,
            String status,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.avatarSnapshotId = avatarSnapshotId;
        this.presetId = presetId;
        this.presetTitle = presetTitle;
        this.season = season;
        this.avatarAnalysis = avatarAnalysis;
        this.trendNote = trendNote;
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

    public String getPresetId() {
        return presetId;
    }

    public String getPresetTitle() {
        return presetTitle;
    }

    public String getSeason() {
        return season;
    }

    public String getAvatarAnalysis() {
        return avatarAnalysis;
    }

    public String getTrendNote() {
        return trendNote;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSelectedVariantId() {
        return selectedVariantId;
    }

    public void setSelectedVariantId(String selectedVariantId) {
        this.selectedVariantId = selectedVariantId;
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
