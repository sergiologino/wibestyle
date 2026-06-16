package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_provider_priorities")
public class AiProviderPriorityEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 64)
    private String operation;

    @Column(name = "network_name", nullable = false, length = 128)
    private String networkName;

    @Column(name = "display_name", nullable = false, length = 160)
    private String displayName;

    @Column(name = "priority_order", nullable = false)
    private int priorityOrder;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AiProviderPriorityEntity() {
    }

    public AiProviderPriorityEntity(
            UUID id,
            String operation,
            String networkName,
            String displayName,
            int priorityOrder,
            boolean enabled,
            Instant updatedAt
    ) {
        this.id = id;
        this.operation = operation;
        this.networkName = networkName;
        this.displayName = displayName;
        this.priorityOrder = priorityOrder;
        this.enabled = enabled;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public String getOperation() {
        return operation;
    }

    public String getNetworkName() {
        return networkName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getPriorityOrder() {
        return priorityOrder;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setPriorityOrder(int priorityOrder) {
        this.priorityOrder = priorityOrder;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
