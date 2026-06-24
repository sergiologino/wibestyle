package ru.wibestyle.api.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "push_devices")
public class PushDeviceEntity {
    @Id private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "expo_push_token", nullable = false, unique = true, length = 255) private String expoPushToken;
    @Column(nullable = false, length = 16) private String platform;
    @Column(nullable = false) private boolean enabled = true;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected PushDeviceEntity() {}
    public PushDeviceEntity(UUID id, UUID userId, String expoPushToken, String platform, Instant now) {
        this.id = id; this.userId = userId; this.expoPushToken = expoPushToken; this.platform = platform;
        this.createdAt = now; this.updatedAt = now;
    }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getExpoPushToken() { return expoPushToken; }
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
