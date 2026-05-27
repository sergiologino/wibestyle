package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "avatar_snapshots")
public class AvatarSnapshotEntity {

    @Id
    private UUID id;

    @Column(name = "avatar_id", nullable = false)
    private UUID avatarId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "bust_cm")
    private Integer bustCm;

    @Column(name = "waist_cm")
    private Integer waistCm;

    @Column(name = "hips_cm")
    private Integer hipsCm;

    @Column(name = "shoe_size_eu")
    private Integer shoeSizeEu;

    @Column(name = "clothing_size", length = 8)
    private String clothingSize;

    @Column(name = "processed_image_path", length = 512)
    private String processedImagePath;

    @Column(name = "privacy_face_hidden", nullable = false)
    private boolean privacyFaceHidden;

    @Column(name = "privacy_background_hidden", nullable = false)
    private boolean privacyBackgroundHidden;

    @Column(name = "privacy_features_hidden", nullable = false)
    private boolean privacyFeaturesHidden;

    @Column(name = "quality_score")
    private Double qualityScore;

    @Column(name = "pipeline_version", nullable = false, length = 16)
    private String pipelineVersion;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AvatarSnapshotEntity() {
    }

    public AvatarSnapshotEntity(
            UUID id,
            UUID avatarId,
            UUID userId,
            Integer heightCm,
            Integer bustCm,
            Integer waistCm,
            Integer hipsCm,
            Integer shoeSizeEu,
            String clothingSize,
            String processedImagePath,
            boolean privacyFaceHidden,
            boolean privacyBackgroundHidden,
            boolean privacyFeaturesHidden,
            Double qualityScore,
            String pipelineVersion,
            Instant createdAt
    ) {
        this.id = id;
        this.avatarId = avatarId;
        this.userId = userId;
        this.heightCm = heightCm;
        this.bustCm = bustCm;
        this.waistCm = waistCm;
        this.hipsCm = hipsCm;
        this.shoeSizeEu = shoeSizeEu;
        this.clothingSize = clothingSize;
        this.processedImagePath = processedImagePath;
        this.privacyFaceHidden = privacyFaceHidden;
        this.privacyBackgroundHidden = privacyBackgroundHidden;
        this.privacyFeaturesHidden = privacyFeaturesHidden;
        this.qualityScore = qualityScore;
        this.pipelineVersion = pipelineVersion;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAvatarId() {
        return avatarId;
    }

    public UUID getUserId() {
        return userId;
    }

    public Integer getHeightCm() {
        return heightCm;
    }

    public Integer getBustCm() {
        return bustCm;
    }

    public Integer getWaistCm() {
        return waistCm;
    }

    public Integer getHipsCm() {
        return hipsCm;
    }

    public Integer getShoeSizeEu() {
        return shoeSizeEu;
    }

    public String getClothingSize() {
        return clothingSize;
    }

    public String getProcessedImagePath() {
        return processedImagePath;
    }
}
