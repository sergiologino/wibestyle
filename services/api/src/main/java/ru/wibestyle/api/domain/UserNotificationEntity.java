package ru.wibestyle.api.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_notifications", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "dedupe_key"}))
public class UserNotificationEntity {
    @Id private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "notification_type", nullable = false, length = 40) private String type;
    @Column(nullable = false, length = 160) private String title;
    @Column(nullable = false, length = 1000) private String body;
    @Column(name = "action_url", length = 512) private String actionUrl;
    @Column(name = "dedupe_key", nullable = false, length = 200) private String dedupeKey;
    @Column(name = "read_at") private Instant readAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    protected UserNotificationEntity() {}
    public UserNotificationEntity(UUID id, UUID userId, String type, String title, String body,
                                  String actionUrl, String dedupeKey, Instant createdAt) {
        this.id = id; this.userId = userId; this.type = type; this.title = title; this.body = body;
        this.actionUrl = actionUrl; this.dedupeKey = dedupeKey; this.createdAt = createdAt;
    }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getActionUrl() { return actionUrl; }
    public String getDedupeKey() { return dedupeKey; }
    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
    public Instant getCreatedAt() { return createdAt; }
}
