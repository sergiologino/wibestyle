package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_oauth_identities")
public class UserOAuthIdentityEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;

    @Column
    private String email;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected UserOAuthIdentityEntity() {
    }

    public UserOAuthIdentityEntity(UUID id, UUID userId, String provider, String providerUserId, String email, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.email = email;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getProvider() {
        return provider;
    }

    public String getProviderUserId() {
        return providerUserId;
    }

    public String getEmail() {
        return email;
    }
}
