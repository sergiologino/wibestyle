package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "manual_push_campaigns")
public class ManualPushCampaignEntity {
    @Id
    private UUID id;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(nullable = false, length = 240)
    private String body;

    @Column(name = "action_url", length = 512)
    private String actionUrl;

    @Column(nullable = false, length = 32)
    private String audience;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "targeted_users", nullable = false)
    private int targetedUsers;

    @Column(name = "queued_users", nullable = false)
    private int queuedUsers;

    @Column(name = "accepted_users", nullable = false)
    private int acceptedUsers;

    @Column(name = "error_users", nullable = false)
    private int errorUsers;

    @Column(name = "no_device_users", nullable = false)
    private int noDeviceUsers;

    @Column(name = "last_error", length = 500)
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    protected ManualPushCampaignEntity() {
    }

    public ManualPushCampaignEntity(UUID id, String title, String body, String actionUrl,
                                    String audience, String status, Instant scheduledAt, Instant now) {
        this.id = id;
        this.title = title;
        this.body = body;
        this.actionUrl = actionUrl;
        this.audience = audience;
        this.status = status;
        this.scheduledAt = scheduledAt;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getActionUrl() { return actionUrl; }
    public String getAudience() { return audience; }
    public String getStatus() { return status; }
    public Instant getScheduledAt() { return scheduledAt; }
    public int getTargetedUsers() { return targetedUsers; }
    public int getQueuedUsers() { return queuedUsers; }
    public int getAcceptedUsers() { return acceptedUsers; }
    public int getErrorUsers() { return errorUsers; }
    public int getNoDeviceUsers() { return noDeviceUsers; }
    public String getLastError() { return lastError; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getFinishedAt() { return finishedAt; }

    public void setStatus(String status) { this.status = status; }
    public void setTargetedUsers(int targetedUsers) { this.targetedUsers = targetedUsers; }
    public void setQueuedUsers(int queuedUsers) { this.queuedUsers = queuedUsers; }
    public void setAcceptedUsers(int acceptedUsers) { this.acceptedUsers = acceptedUsers; }
    public void setErrorUsers(int errorUsers) { this.errorUsers = errorUsers; }
    public void setNoDeviceUsers(int noDeviceUsers) { this.noDeviceUsers = noDeviceUsers; }
    public void setLastError(String lastError) { this.lastError = lastError; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }
}
