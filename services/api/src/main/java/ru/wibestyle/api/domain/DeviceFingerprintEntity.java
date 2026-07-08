package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "device_fingerprints")
public class DeviceFingerprintEntity {

    @Id
    @Column(name = "device_hash", length = 64)
    private String deviceHash;

    @Column(name = "first_seen_at", nullable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "first_account_created_at")
    private Instant firstAccountCreatedAt;

    @Column(name = "last_account_created_at")
    private Instant lastAccountCreatedAt;

    @Column(name = "last_account_deleted_at")
    private Instant lastAccountDeletedAt;

    @Column(name = "registration_count", nullable = false)
    private int registrationCount;

    @Column(name = "deleted_account_count", nullable = false)
    private int deletedAccountCount;

    @Column(name = "trial_generations_used", nullable = false)
    private int trialGenerationsUsed;

    @Column(name = "trial_video_generations_used", nullable = false)
    private int trialVideoGenerationsUsed;

    protected DeviceFingerprintEntity() {
    }

    public DeviceFingerprintEntity(String deviceHash, Instant now) {
        this.deviceHash = deviceHash;
        this.firstSeenAt = now;
        this.lastSeenAt = now;
    }

    public String getDeviceHash() {
        return deviceHash;
    }

    public Instant getFirstSeenAt() {
        return firstSeenAt;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    public Instant getFirstAccountCreatedAt() {
        return firstAccountCreatedAt;
    }

    public Instant getLastAccountCreatedAt() {
        return lastAccountCreatedAt;
    }

    public Instant getLastAccountDeletedAt() {
        return lastAccountDeletedAt;
    }

    public int getRegistrationCount() {
        return registrationCount;
    }

    public int getDeletedAccountCount() {
        return deletedAccountCount;
    }

    public int getTrialGenerationsUsed() {
        return trialGenerationsUsed;
    }

    public int getTrialVideoGenerationsUsed() {
        return trialVideoGenerationsUsed;
    }

    public void recordRegistration(Instant when) {
        if (firstAccountCreatedAt == null) {
            firstAccountCreatedAt = when;
        }
        lastAccountCreatedAt = when;
        registrationCount += 1;
        lastSeenAt = when;
    }

    public void recordDeletion(Instant when) {
        lastAccountDeletedAt = when;
        deletedAccountCount += 1;
        lastSeenAt = when;
    }

    public void consumeTrialGeneration(Instant when) {
        trialGenerationsUsed += 1;
        lastSeenAt = when;
    }
}
