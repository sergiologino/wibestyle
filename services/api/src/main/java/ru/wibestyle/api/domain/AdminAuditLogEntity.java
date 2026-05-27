package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLogEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 64)
    private String actor;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 64)
    private String entityType;

    @Column(name = "entity_id", length = 64)
    private String entityId;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(length = 512)
    private String details;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AdminAuditLogEntity() {
    }

    public AdminAuditLogEntity(
            UUID id,
            String actor,
            String action,
            String entityType,
            String entityId,
            String ipAddress,
            String details,
            Instant createdAt
    ) {
        this.id = id;
        this.actor = actor;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.ipAddress = ipAddress;
        this.details = details;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getActor() {
        return actor;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getDetails() {
        return details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
