package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_provider_error_mappings")
public class AiProviderErrorMappingEntity {

    @Id
    private UUID id;

    @Column(name = "error_text", nullable = false, unique = true, length = 1000)
    private String errorText;

    @Column(nullable = false, length = 1500)
    private String description;

    @Column(name = "error_code", nullable = false, length = 64)
    private String errorCode;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AiProviderErrorMappingEntity() {
    }

    public AiProviderErrorMappingEntity(
            UUID id,
            String errorText,
            String description,
            String errorCode,
            boolean enabled,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.errorText = errorText;
        this.description = description;
        this.errorCode = errorCode;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public String getErrorText() {
        return errorText;
    }

    public String getDescription() {
        return description;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setErrorText(String errorText) {
        this.errorText = errorText;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
