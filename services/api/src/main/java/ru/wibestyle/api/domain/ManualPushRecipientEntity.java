package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "manual_push_recipients")
public class ManualPushRecipientEntity {
    @Id
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "last_error", length = 500)
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ManualPushRecipientEntity() {
    }

    public ManualPushRecipientEntity(UUID id, UUID campaignId, UUID userId, Instant nextAttemptAt, Instant now) {
        this.id = id;
        this.campaignId = campaignId;
        this.userId = userId;
        this.status = "queued";
        this.nextAttemptAt = nextAttemptAt;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public UUID getCampaignId() { return campaignId; }
    public UUID getUserId() { return userId; }
    public String getStatus() { return status; }
    public int getAttemptCount() { return attemptCount; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public Instant getLastAttemptAt() { return lastAttemptAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public String getLastError() { return lastError; }

    public void markAccepted(Instant now) {
        this.status = "accepted";
        this.attemptCount++;
        this.lastAttemptAt = now;
        this.acceptedAt = now;
        this.lastError = null;
        this.updatedAt = now;
    }

    public void markRetry(String error, Instant nextAttemptAt, Instant now) {
        this.status = "queued";
        this.attemptCount++;
        this.lastAttemptAt = now;
        this.nextAttemptAt = nextAttemptAt;
        this.lastError = error;
        this.updatedAt = now;
    }
}
