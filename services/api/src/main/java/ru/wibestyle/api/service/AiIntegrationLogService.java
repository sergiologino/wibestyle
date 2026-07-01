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
        String network = requestBody == null ? aiProperties.getVirtualTryOnNetwork() : String.valueOf(requestBody.getOrDefault("networkName", aiProperties.getVirtualTryOnNetwork()));
        logOutboundRequest(session, requestBody, null, network, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logOutboundRequest(
            TryOnSessionEntity session,
            Map<String, Object> requestBody,
            String operation,
            String network,
            Integer attemptNumber,
            String fallbackReason
    ) {
        String modelLabel = humanModelLabel(network, null);
        Map<String, Object> sanitized = AiPayloadSanitizer.sanitize(requestBody);
        String body = "JSON запроса:\n" + toPrettyJson(sanitized);
        String attemptText = attemptNumber == null ? "" : ", попытка " + attemptNumber;
        String fallbackText = fallbackReason == null || fallbackReason.isBlank() ? "" : " Причина fallback: " + fallbackReason + ".";
        save(
                session,
                "request",
                "Отправка в ai-integration (" + aiProperties.getBaseUrl() + "), сеть " + network
                        + ", модель " + modelLabel + attemptText + "." + fallbackText,
                body,
                network,
                null,
                "pending",
                null,
                operation,
                attemptNumber,
                fallbackReason
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
        logInboundResponse(session, success, noteappRequestId, networkUsed, provider, executionTimeMs, errorMessage, responseSummary, null, null, null);
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
            Map<String, Object> responseSummary,
            String operation,
            Integer attemptNumber,
            String fallbackReason
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
        if (operation != null) {
            payload.put("operation", operation);
        }
        if (attemptNumber != null) {
            payload.put("attemptNumber", attemptNumber);
        }
        if (fallbackReason != null && !fallbackReason.isBlank()) {
            payload.put("fallbackReason", fallbackReason);
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
        String attemptText = attemptNumber == null ? "" : ", попытка " + attemptNumber;
        String title = success
                ? "Получен ответ от ai-integration, модель " + modelLabel + attemptText + " (" + executionTimeMs + " мс)." + routeHint
                : "Ошибка от ai-integration, модель " + modelLabel + attemptText + "." + routeHint;
        String body = "JSON ответа:\n" + toPrettyJson(payload);
        save(
                session,
                success ? "response" : "error",
                title,
                body,
                networkUsed != null ? networkUsed : aiProperties.getVirtualTryOnNetwork(),
                provider,
                success ? "success" : "failed",
                noteappRequestId,
                operation,
                attemptNumber,
                fallbackReason
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
                null,
                null,
                null,
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
            String noteappRequestId,
            String operation,
            Integer attemptNumber,
            String fallbackReason
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
        entity.setOperation(operation);
        entity.setAttemptNumber(attemptNumber);
        entity.setFallbackReason(fallbackReason);
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
        if (network != null && network.contains("season-video")) {
            return "WibeStyle Season Hit Video";
        }
        if (network != null && network.contains("fashn-tryon-max")) {
            return "FASHN Try-On Photo";
        }
        if (network != null && network.contains("fashn-tryon-video")) {
            return "FASHN Try-On Video";
        }
        if (network != null && network.contains("kling-kolors-tryon")) {
            return "Kling Try-On Photo";
        }
        if (network != null && network.contains("kling-tryon-video")) {
            return "Kling Try-On Video";
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
