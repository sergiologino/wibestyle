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
@Table(name = "try_on_jobs")
public class TryOnJobEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "queue_name", nullable = false, length = 64)
    private String queueName;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(length = 64)
    private String provider;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(length = 64)
    private String operation;

    @Column(name = "idempotency_key", length = 128)
    private String idempotencyKey;

    @Column(name = "external_request_id", length = 128)
    private String externalRequestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_status", length = 32)
    private AiJobStatus aiStatus;

    @Column(length = 16)
    private String priority = "normal";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TryOnJobEntity() {
    }

    public TryOnJobEntity(
            UUID id,
            UUID sessionId,
            String queueName,
            String status,
            String provider,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.queueName = queueName;
        this.status = status;
        this.provider = provider;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public String getQueueName() {
        return queueName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public Integer getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Integer durationMs) {
        this.durationMs = durationMs;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getExternalRequestId() {
        return externalRequestId;
    }

    public void setExternalRequestId(String externalRequestId) {
        this.externalRequestId = externalRequestId;
    }

    public AiJobStatus getAiStatus() {
        return aiStatus;
    }

    public void setAiStatus(AiJobStatus aiStatus) {
        this.aiStatus = aiStatus;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
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
