package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.AiProviderErrorMappingEntity;
import ru.wibestyle.api.domain.TryOnErrorCodes;
import ru.wibestyle.api.dto.AiProviderErrorMappingRequest;
import ru.wibestyle.api.repository.AiProviderErrorMappingRepository;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AiProviderErrorMappingService {

    private final AiProviderErrorMappingRepository repository;

    public AiProviderErrorMappingService(AiProviderErrorMappingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<MatchedProviderError> match(String rawError) {
        if (rawError == null || rawError.isBlank()) {
            return Optional.empty();
        }
        String normalizedError = normalize(rawError);
        return repository.findByEnabledTrueOrderByCreatedAtAsc().stream()
                .filter(mapping -> normalizedError.contains(normalize(mapping.getErrorText())))
                .findFirst()
                .map(mapping -> new MatchedProviderError(
                        mapping.getErrorCode(),
                        mapping.getDescription()
                ));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list() {
        return repository.findAllByOrderByCreatedAtAsc().stream()
                .map(AiProviderErrorMappingService::toMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> create(AiProviderErrorMappingRequest request) {
        String errorText = request.errorText().trim();
        if (repository.findByErrorTextIgnoreCase(errorText).isPresent()) {
            throw new IllegalArgumentException("AI_PROVIDER_ERROR_MAPPING_ALREADY_EXISTS");
        }
        Instant now = Instant.now();
        AiProviderErrorMappingEntity entity = new AiProviderErrorMappingEntity(
                UUID.randomUUID(),
                errorText,
                request.description().trim(),
                TryOnErrorCodes.VTON_CONTENT_MODERATION,
                request.enabled(),
                now,
                now
        );
        return toMap(repository.save(entity));
    }

    @Transactional
    public Map<String, Object> update(UUID id, AiProviderErrorMappingRequest request) {
        AiProviderErrorMappingEntity entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("AI_PROVIDER_ERROR_MAPPING_NOT_FOUND"));
        String errorText = request.errorText().trim();
        repository.findByErrorTextIgnoreCase(errorText)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("AI_PROVIDER_ERROR_MAPPING_ALREADY_EXISTS");
                });
        entity.setErrorText(errorText);
        entity.setDescription(request.description().trim());
        entity.setEnabled(request.enabled());
        entity.setUpdatedAt(Instant.now());
        return toMap(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("AI_PROVIDER_ERROR_MAPPING_NOT_FOUND");
        }
        repository.deleteById(id);
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private static Map<String, Object> toMap(AiProviderErrorMappingEntity entity) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", entity.getId().toString());
        item.put("errorText", entity.getErrorText());
        item.put("description", entity.getDescription());
        item.put("enabled", entity.isEnabled());
        item.put("updatedAt", entity.getUpdatedAt().toString());
        return item;
    }

    public record MatchedProviderError(String errorCode, String userMessage) {
    }
}
