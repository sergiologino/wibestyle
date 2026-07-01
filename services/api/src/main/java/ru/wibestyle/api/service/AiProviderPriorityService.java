package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AiOperations;
import ru.wibestyle.api.domain.AiProviderPriorityEntity;
import ru.wibestyle.api.dto.AiProviderPriorityRequest;
import ru.wibestyle.api.repository.AiProviderPriorityRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiProviderPriorityService {

    private static final List<ProviderDefinition> PHOTO_DEFAULTS = List.of(
            new ProviderDefinition("wibestyle-vton", "Grok Imagine", 10),
            new ProviderDefinition("fashn-try-on-photo", "FASHN Try-On Photo", 20),
            new ProviderDefinition("kling-try-on-photo", "Kling Virtual Try-On", 30)
    );
    private static final List<ProviderDefinition> VIDEO_DEFAULTS = List.of(
            new ProviderDefinition("wibestyle-season-video", "Grok Imagine Video", 10),
            new ProviderDefinition("fashn-try-on-video", "FASHN Try-On Video", 20),
            new ProviderDefinition("kling-try-on-video", "Kling Virtual Try-On Video", 30)
    );

    private final AiProviderPriorityRepository repository;
    private final AiIntegrationProperties aiProperties;

    public AiProviderPriorityService(AiProviderPriorityRepository repository, AiIntegrationProperties aiProperties) {
        this.repository = repository;
        this.aiProperties = aiProperties;
    }

    @Transactional(readOnly = true)
    public List<ProviderRoute> routeFor(String operation) {
        ensureKnownOperation(operation);
        List<AiProviderPriorityEntity> configuredRows =
                repository.findByOperationOrderByPriorityOrderAsc(operation);
        List<AiProviderPriorityEntity> enabled = repository.findByOperationAndEnabledTrueOrderByPriorityOrderAsc(operation);
        if (!enabled.isEmpty()) {
            return enabled.stream()
                    .sorted(providerComparator())
                    .map(ProviderRoute::from)
                    .toList();
        }

        // Once an operation has persisted rows, disabling every row is an explicit
        // admin choice. Do not silently reactivate the legacy env network.
        if (!configuredRows.isEmpty()) {
            return List.of();
        }

        String configured = AiOperations.VIRTUAL_TRY_ON_VIDEO.equals(operation)
                ? aiProperties.getSeasonVideoNetwork()
                : aiProperties.getVirtualTryOnNetwork();
        if (configured != null && !configured.isBlank()) {
            return List.of(new ProviderRoute(configured, labelFor(operation, configured), 10));
        }
        return defaultsFor(operation).stream()
                .map(def -> new ProviderRoute(def.networkName(), def.displayName(), def.priorityOrder()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> snapshot() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put(AiOperations.VIRTUAL_TRY_ON_PHOTO, listForOperation(AiOperations.VIRTUAL_TRY_ON_PHOTO));
        result.put(AiOperations.VIRTUAL_TRY_ON_VIDEO, listForOperation(AiOperations.VIRTUAL_TRY_ON_VIDEO));
        return result;
    }

    @Transactional
    public List<Map<String, Object>> update(String operation, AiProviderPriorityRequest request) {
        ensureKnownOperation(operation);
        Instant now = Instant.now();
        for (AiProviderPriorityRequest.AiProviderPriorityItemRequest item : request.items()) {
            AiProviderPriorityEntity entity = repository.findByOperationAndNetworkName(operation, item.networkName())
                    .orElseGet(() -> new AiProviderPriorityEntity(
                            UUID.randomUUID(),
                            operation,
                            item.networkName().trim(),
                            item.displayName().trim(),
                            item.priorityOrder(),
                            item.enabled(),
                            now
                    ));
            entity.setDisplayName(item.displayName().trim());
            entity.setPriorityOrder(item.priorityOrder());
            entity.setEnabled(item.enabled());
            entity.setUpdatedAt(now);
            repository.save(entity);
        }
        return listForOperation(operation);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listForOperation(String operation) {
        ensureKnownOperation(operation);
        List<AiProviderPriorityEntity> rows = new ArrayList<>(repository.findByOperationOrderByPriorityOrderAsc(operation));
        if (rows.isEmpty()) {
            return defaultsFor(operation).stream()
                    .map(def -> toMap(def.networkName(), def.displayName(), def.priorityOrder(), true))
                    .toList();
        }
        rows.sort(providerComparator());
        return rows.stream()
                .map(row -> toMap(row.getNetworkName(), row.getDisplayName(), row.getPriorityOrder(), row.isEnabled()))
                .toList();
    }

    public boolean shouldFallback(String errorCode) {
        if (errorCode == null || errorCode.isBlank()) {
            return true;
        }
        return switch (errorCode) {
            case "AI_NOT_CONFIGURED",
                 "AI_PROVIDER_TIMEOUT",
                 "AI_PROVIDER_MISMATCH",
                 "AI_GENERATION_FAILED",
                 "VTON_CONTENT_MODERATION",
                 "AI_PROVIDER_TOKENS_EXHAUSTED",
                 "AI_PROVIDER_QUOTA_EXCEEDED",
                 "EMPTY_RESPONSE" -> true;
            default -> false;
        };
    }

    public static String fallbackReason(String errorCode, String errorMessage) {
        String code = errorCode == null || errorCode.isBlank() ? "UNKNOWN_AI_ERROR" : errorCode;
        if (errorMessage == null || errorMessage.isBlank()) {
            return code;
        }
        String normalized = errorMessage.replaceAll("\\s+", " ").trim();
        return normalized.length() > 180 ? code + ": " + normalized.substring(0, 180) : code + ": " + normalized;
    }

    private List<ProviderDefinition> defaultsFor(String operation) {
        return AiOperations.VIRTUAL_TRY_ON_VIDEO.equals(operation) ? VIDEO_DEFAULTS : PHOTO_DEFAULTS;
    }

    private String labelFor(String operation, String networkName) {
        return defaultsFor(operation).stream()
                .filter(def -> def.networkName().equals(networkName))
                .map(ProviderDefinition::displayName)
                .findFirst()
                .orElse(networkName);
    }

    private static Map<String, Object> toMap(String networkName, String displayName, int priorityOrder, boolean enabled) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("networkName", networkName);
        item.put("displayName", displayName);
        item.put("priorityOrder", priorityOrder);
        item.put("enabled", enabled);
        return item;
    }

    private static Comparator<AiProviderPriorityEntity> providerComparator() {
        return Comparator.comparingInt(AiProviderPriorityEntity::getPriorityOrder)
                .thenComparing(AiProviderPriorityEntity::getNetworkName);
    }

    private static void ensureKnownOperation(String operation) {
        if (!AiOperations.VIRTUAL_TRY_ON_PHOTO.equals(operation) && !AiOperations.VIRTUAL_TRY_ON_VIDEO.equals(operation)) {
            throw new IllegalArgumentException("UNKNOWN_AI_OPERATION");
        }
    }

    private record ProviderDefinition(String networkName, String displayName, int priorityOrder) {
    }

    public record ProviderRoute(String networkName, String displayName, int priorityOrder) {
        static ProviderRoute from(AiProviderPriorityEntity entity) {
            return new ProviderRoute(entity.getNetworkName(), entity.getDisplayName(), entity.getPriorityOrder());
        }
    }
}
