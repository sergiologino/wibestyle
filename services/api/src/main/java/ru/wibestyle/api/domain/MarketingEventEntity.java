package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marketing_events")
public class MarketingEventEntity {
    @Id
    private UUID id;
    @Column(name = "visitor_id", length = 64)
    private String visitorId;
    @Column(name = "user_id")
    private UUID userId;
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;
    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MarketingEventEntity() {}

    public MarketingEventEntity(UUID id, String visitorId, UUID userId, String eventType, String metadataJson, Instant createdAt) {
        this.id = id;
        this.visitorId = visitorId;
        this.userId = userId;
        this.eventType = eventType;
        this.metadataJson = metadataJson;
        this.createdAt = createdAt;
    }
}
