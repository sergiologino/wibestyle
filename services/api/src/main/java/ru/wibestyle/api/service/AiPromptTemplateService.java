package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.AiPromptTemplateEntity;
import ru.wibestyle.api.repository.AiPromptTemplateRepository;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiPromptTemplateService {

    public static final String VTON_BASE_RU_KEY = "vton.base_ru";

    private final AiPromptTemplateRepository repository;

    public AiPromptTemplateService(AiPromptTemplateRepository repository) {
        this.repository = repository;
    }

    public String getBodyOrDefault(String templateKey, String fallback) {
        return repository.findById(templateKey)
                .map(AiPromptTemplateEntity::getBody)
                .filter(body -> !body.isBlank())
                .orElse(fallback);
    }

    public Map<String, Object> listTemplates() {
        List<Map<String, Object>> items = repository.findAll().stream()
                .map(this::toMap)
                .toList();
        return Map.of("items", items);
    }

    public Map<String, Object> getTemplate(String templateKey) {
        AiPromptTemplateEntity entity = repository.findById(templateKey)
                .orElseThrow(() -> new IllegalArgumentException("Prompt template not found: " + templateKey));
        return Map.of("template", toMap(entity));
    }

    @Transactional
    public Map<String, Object> updateBody(String templateKey, String body) {
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Prompt body must not be empty");
        }
        if (body.length() > 12_000) {
            throw new IllegalArgumentException("Prompt body is too long (max 12000 characters)");
        }
        AiPromptTemplateEntity entity = repository.findById(templateKey)
                .orElseThrow(() -> new IllegalArgumentException("Prompt template not found: " + templateKey));
        entity.setBody(body.trim());
        entity.setUpdatedAt(Instant.now());
        repository.save(entity);
        return Map.of("template", toMap(entity));
    }

    private Map<String, Object> toMap(AiPromptTemplateEntity entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("key", entity.getTemplateKey());
        map.put("title", entity.getTitle());
        map.put("description", entity.getDescription());
        map.put("body", entity.getBody());
        map.put("updatedAt", entity.getUpdatedAt().toString());
        return map;
    }
}
