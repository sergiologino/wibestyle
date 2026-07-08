package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@IdClass(UserDeviceLinkId.class)
@Table(name = "user_device_links")
public class UserDeviceLinkEntity {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "device_hash", nullable = false, length = 64)
    private String deviceHash;

    @Column(name = "first_seen_at", nullable = false)
    private Instant firstSeenAt;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    protected UserDeviceLinkEntity() {
    }

    public UserDeviceLinkEntity(UUID userId, String deviceHash, Instant now) {
        this.userId = userId;
        this.deviceHash = deviceHash;
        this.firstSeenAt = now;
        this.lastSeenAt = now;
    }

    public UUID getUserId() {
        return userId;
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
}
