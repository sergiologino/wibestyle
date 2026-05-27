package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gallery_reports")
public class GalleryReportEntity {

    @Id
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "reporter_user_id")
    private UUID reporterUserId;

    @Column(nullable = false, length = 64)
    private String reason;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false, length = 16)
    private String status = "open";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected GalleryReportEntity() {
    }

    public GalleryReportEntity(
            UUID id,
            UUID postId,
            UUID reporterUserId,
            String reason,
            String details,
            Instant createdAt
    ) {
        this.id = id;
        this.postId = postId;
        this.reporterUserId = reporterUserId;
        this.reason = reason;
        this.details = details;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPostId() {
        return postId;
    }

    public UUID getReporterUserId() {
        return reporterUserId;
    }

    public String getReason() {
        return reason;
    }

    public String getDetails() {
        return details;
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

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
