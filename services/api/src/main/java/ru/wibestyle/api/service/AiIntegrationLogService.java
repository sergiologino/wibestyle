package ru.wibestyle.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.ai.AiPayloadSanitizer;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AiIntegrationLogEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.repository.AiIntegrationLogRepository;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AiIntegrationLogService {

    private final AiIntegrationLogRepository repository;
    private final AiIntegrationProperties aiProperties;
    private final ObjectMapper objectMapper;

    public AiIntegrationLogService(
            AiIntegrationLogRepository repository,
            AiIntegrationProperties aiProperties,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.aiProperties = aiProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logOutboundRequest(TryOnSessionEntity session, Map<String, Object> requestBody) {
        String network = aiProperties.getVirtualTryOnNetwork();
        String modelLabel = humanModelLabel(network, null);
        Map<String, Object> sanitized = AiPayloadSanitizer.sanitize(requestBody);
        String body = "JSON запроса:\n" + toPrettyJson(sanitized);
        save(
                session,
                "request",
                "Отправка в ai-integration (" + aiProperties.getBaseUrl() + "), сеть " + network
                        + ", модель " + modelLabel + ".",
                body,
                network,
                null,
                "pending",
                null
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logInboundResponse(
            TryOnSessionEntity session,
            boolean success,
            String noteappRequestId,
            String networkUsed,
            String provider,
            long executionTimeMs,
            String errorMessage,
            Map<String, Object> responseSummary
    ) {
        String modelLabel = humanModelLabel(networkUsed, provider);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", success);
        payload.put("noteappRequestId", noteappRequestId);
        payload.put("networkUsed", networkUsed);
        payload.put("provider", provider);
        payload.put("executionTimeMs", executionTimeMs);
        if (errorMessage != null) {
            payload.put("errorMessage", errorMessage);
        }
        if (responseSummary != null) {
            payload.put("response", AiPayloadSanitizer.sanitize(responseSummary));
        }
        String routeHint = "";
        if (responseSummary != null) {
            Object reason = responseSummary.get("tryOnRouteReason");
            if (reason == null && responseSummary.get("response") instanceof Map<?, ?> nested) {
                reason = nested.get("tryOnRouteReason");
            }
            if (reason instanceof String str && !str.isBlank()) {
                routeHint = " Причина: " + str + ".";
            }
        }
        String title = success
                ? "Получен ответ от ai-integration, модель " + modelLabel + " (" + executionTimeMs + " мс)." + routeHint
                : "Ошибка от ai-integration, модель " + modelLabel + "." + routeHint;
        String body = "JSON ответа:\n" + toPrettyJson(payload);
        save(
                session,
                success ? "response" : "error",
                title,
                body,
                networkUsed != null ? networkUsed : aiProperties.getVirtualTryOnNetwork(),
                provider,
                success ? "success" : "failed",
                noteappRequestId
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSkipped(TryOnSessionEntity session, String reason) {
        save(
                session,
                "error",
                "Вызов ai-integration не выполнен: " + reason,
                "",
                aiProperties.getVirtualTryOnNetwork(),
                null,
                "skipped",
                null
        );
    }

    private void save(
            TryOnSessionEntity session,
            String phase,
            String title,
            String body,
            String modelName,
            String provider,
            String status,
            String noteappRequestId
    ) {
        AiIntegrationLogEntity entity = new AiIntegrationLogEntity();
        entity.setId(UUID.randomUUID());
        entity.setTryOnSessionId(session.getId());
        entity.setUserId(session.getUserId());
        entity.setPhase(phase);
        entity.setTitle(title);
        entity.setBody(body);
        entity.setModelName(modelName);
        entity.setProvider(provider);
        entity.setStatus(status);
        entity.setNoteappRequestId(noteappRequestId);
        entity.setCreatedAt(Instant.now());
        repository.save(entity);
    }

    public static String humanModelLabel(String network, String provider) {
        if (provider != null) {
            if (provider.contains("grok")) {
                return "Grok Imagine";
            }
            if (provider.contains("pollinations")) {
                return "Pollinations (только текст)";
            }
        }
        if (network != null && network.contains("vton")) {
            return "WibeStyle Virtual Try-On";
        }
        return network != null ? network : "—";
    }

    private String toPrettyJson(Object value) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return String.valueOf(value);
        }
    }
}
