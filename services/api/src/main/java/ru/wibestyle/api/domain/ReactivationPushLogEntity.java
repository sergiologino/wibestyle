package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reactivation_push_log")
public class ReactivationPushLogEntity {
    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "notification_id")
    private UUID notificationId;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @Column(name = "action_url", nullable = false, length = 512)
    private String actionUrl;

    @Column(name = "dedupe_key", nullable = false, length = 200)
    private String dedupeKey;

    protected ReactivationPushLogEntity() {
    }

    public ReactivationPushLogEntity(UUID id, UUID userId, UUID templateId, String actionUrl, String dedupeKey, Instant sentAt) {
        this.id = id;
        this.userId = userId;
        this.templateId = templateId;
        this.actionUrl = actionUrl;
        this.dedupeKey = dedupeKey;
        this.sentAt = sentAt;
    }
}
