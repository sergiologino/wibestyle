package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marketing_channels")
public class MarketingChannelEntity {
    @Id
    private UUID id;
    @Column(nullable = false, unique = true, length = 64)
    private String code;
    @Column(name = "display_name", nullable = false, length = 160)
    private String displayName;
    @Column(name = "utm_source", length = 100)
    private String utmSource;
    @Column(name = "utm_medium", length = 100)
    private String utmMedium;
    @Column(length = 500)
    private String description;
    @Column(nullable = false)
    private boolean enabled;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MarketingChannelEntity() {}

    public MarketingChannelEntity(UUID id, String code, String displayName, String utmSource, String utmMedium,
                                  String description, boolean enabled, Instant now) {
        this.id = id;
        this.code = code;
        this.displayName = displayName;
        this.utmSource = utmSource;
        this.utmMedium = utmMedium;
        this.description = description;
        this.enabled = enabled;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getDisplayName() { return displayName; }
    public String getUtmSource() { return utmSource; }
    public String getUtmMedium() { return utmMedium; }
    public String getDescription() { return description; }
    public boolean isEnabled() { return enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String code, String displayName, String utmSource, String utmMedium,
                       String description, boolean enabled, Instant now) {
        this.code = code;
        this.displayName = displayName;
        this.utmSource = utmSource;
        this.utmMedium = utmMedium;
        this.description = description;
        this.enabled = enabled;
        this.updatedAt = now;
    }
}
