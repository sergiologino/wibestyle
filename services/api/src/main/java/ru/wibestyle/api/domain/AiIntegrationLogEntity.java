package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_integration_logs")
public class AiIntegrationLogEntity {

    @Id
    private UUID id;

    @Column(name = "try_on_session_id")
    private UUID tryOnSessionId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 32)
    private String phase;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "model_name", length = 128)
    private String modelName;

    @Column(length = 128)
    private String provider;

    @Column(length = 32)
    private String status;

    @Column(name = "noteapp_request_id", length = 64)
    private String noteappRequestId;

    @Column(length = 64)
    private String operation;

    @Column(name = "attempt_number")
    private Integer attemptNumber;

    @Column(name = "fallback_reason", length = 255)
    private String fallbackReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTryOnSessionId() {
        return tryOnSessionId;
    }

    public void setTryOnSessionId(UUID tryOnSessionId) {
        this.tryOnSessionId = tryOnSessionId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getPhase() {
        return phase;
    }

    public void setPhase(String phase) {
        this.phase = phase;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNoteappRequestId() {
        return noteappRequestId;
    }

    public void setNoteappRequestId(String noteappRequestId) {
        this.noteappRequestId = noteappRequestId;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public String getFallbackReason() {
        return fallbackReason;
    }

    public void setFallbackReason(String fallbackReason) {
        this.fallbackReason = fallbackReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
