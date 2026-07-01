package ru.wibestyle.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.service.AiIntegrationLogService;
import ru.wibestyle.api.service.AiProviderErrorMappingService;

import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class NoteappAiClient {

    private static final Logger log = LoggerFactory.getLogger(NoteappAiClient.class);

    private final RestClient restClient;
    private final AiIntegrationProperties properties;
    private final AiIntegrationLogService logService;
    private final AiProviderErrorMappingService errorMappingService;

    public NoteappAiClient(
            RestClient.Builder restClientBuilder,
            AiIntegrationProperties properties,
            AiIntegrationLogService logService,
            AiProviderErrorMappingService errorMappingService
    ) {
        this.properties = properties;
        this.logService = logService;
        this.errorMappingService = errorMappingService;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    public String generateChatText(String networkName, String systemPrompt, String userPrompt) {
        Map<String, Object> payload = new HashMap<>();
        payload.put(
                "messages",
                java.util.List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );
        payload.put("settings", Map.of("temperature", 0.9, "maxTokens", 180));

        Map<String, Object> body = new HashMap<>();
        body.put("networkName", networkName);
        body.put("requestType", "chat");
        body.put("payload", payload);

        JsonNode response = restClient.post()
                .uri("/api/ai/process")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-API-Key", properties.getApiKey())
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        if (response == null || !"success".equalsIgnoreCase(response.path("status").asText(""))) {
            throw new RestClientException("Chat generation failed");
        }
        JsonNode inner = response.path("response");
        JsonNode choices = inner.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            String content = choices.get(0).path("message").path("content").asText(null);
            if (content != null && !content.isBlank()) {
                return content.trim();
            }
        }
        String text = inner.path("text").asText(null);
        if (text != null && !text.isBlank()) {
            return text.trim();
        }
        throw new RestClientException("No text in chat response");
    }

    public String generateVisionChatText(
            String networkName,
            String systemPrompt,
            String userText,
            String imageBase64,
            String mimeType
    ) {
        String dataUrl = "data:" + (mimeType == null || mimeType.isBlank() ? "image/jpeg" : mimeType) + ";base64," + imageBase64;

        Map<String, Object> payload = new HashMap<>();
        payload.put(
                "messages",
                java.util.List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of(
                                "role", "user",
                                "content", java.util.List.of(
                                        Map.of("type", "text", "text", userText),
                                        Map.of("type", "image_url", "image_url", Map.of("url", dataUrl))
                                )
                        )
                )
        );
        payload.put("settings", Map.of("temperature", 0.2, "maxTokens", 120));

        Map<String, Object> body = new HashMap<>();
        body.put("networkName", networkName);
        body.put("requestType", "chat");
        body.put("payload", payload);

        JsonNode response = restClient.post()
                .uri("/api/ai/process")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-API-Key", properties.getApiKey())
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        if (response == null || !"success".equalsIgnoreCase(response.path("status").asText(""))) {
            throw new RestClientException("Vision chat generation failed");
        }
        JsonNode inner = response.path("response");
        JsonNode choices = inner.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            String content = choices.get(0).path("message").path("content").asText(null);
            if (content != null && !content.isBlank()) {
                return content.trim();
            }
        }
        String text = inner.path("text").asText(null);
        if (text != null && !text.isBlank()) {
            return text.trim();
        }
        throw new RestClientException("No text in vision chat response");
    }

    public ProcessResult processVirtualTryOn(
            String networkName,
            int attemptNumber,
            String fallbackReason,
            TryOnSessionEntity session,
            String prompt,
            String personImageBase64,
            String garmentImageBase64,
            Map<String, String> metadata,
            AvatarSnapshotEntity avatarSnapshot,
            String figureLockPrompt,
            String fitPromptHint
    ) {
        Map<String, Object> payload = buildVirtualTryOnPayload(
                session,
                prompt,
                personImageBase64,
                garmentImageBase64,
                avatarSnapshot,
                figureLockPrompt,
                fitPromptHint
        );

        Map<String, Object> body = new HashMap<>();
        body.put("userId", session.getUserId().toString());
        body.put("networkName", networkName);
        body.put("requestType", "image_generation");
        body.put("payload", payload);
        body.put("metadata", metadata == null ? Map.of() : metadata);

        log.info(
                "Noteapp try-on call baseUrl={} network={} userId={} personImageChars={} garmentImageChars={} garmentTitle={} promptLen={} promptPreview={}",
                properties.getBaseUrl(),
                networkName,
                session.getUserId(),
                personImageBase64 != null ? personImageBase64.length() : 0,
                garmentImageBase64 != null ? garmentImageBase64.length() : 0,
                session.getProductTitle(),
                prompt != null ? prompt.length() : 0,
                promptPreview(prompt)
        );
        logService.logOutboundRequest(
                session,
                body,
                metadata == null ? null : metadata.get("operation"),
                networkName,
                attemptNumber,
                fallbackReason
        );

        try {
            JsonNode response = restClient.post()
                    .uri("/api/ai/process")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-API-Key", properties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                log.warn("Noteapp try-on empty response");
                logService.logInboundResponse(session, false, null, networkName, null, 0, "Empty AI response", Map.of(), metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
                return ProcessResult.failure("EMPTY_RESPONSE", "Empty AI response");
            }

            String status = response.path("status").asText("");
            String requestId = response.path("requestId").asText(null);
            String networkUsed = response.path("networkUsed").asText(null);
            long executionTimeMs = response.path("executionTimeMs").asLong(0);
            String provider = response.path("response").path("provider").asText(null);
            Map<String, Object> responseSummary = responseSummary(response);
            log.info(
                    "Noteapp try-on response status={} requestId={} networkUsed={} provider={} ms={}",
                    status,
                    requestId,
                    networkUsed,
                    provider,
                    executionTimeMs
            );
            if (!"success".equalsIgnoreCase(status)) {
                String error = extractErrorMessage(response, "AI request failed");
                ProviderErrorResolution resolution = resolveProviderError(error);
                logService.logInboundResponse(session, false, requestId, networkUsed != null ? networkUsed : networkName, provider, executionTimeMs, error, responseSummary, metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
                return ProcessResult.failure(resolution.errorCode(), resolution.userMessage());
            }
            if (isUnexpectedNetwork(networkName, networkUsed)) {
                String error = "Requested network " + networkName + " but integration used " + networkUsed;
                log.warn("Noteapp try-on provider mismatch: {}", error);
                logService.logInboundResponse(
                        session, false, requestId, networkUsed, provider, executionTimeMs,
                        error, responseSummary, metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason
                );
                return ProcessResult.failure("AI_PROVIDER_MISMATCH", error);
            }

            ImageResult imageResult = extractImageResult(response.path("response"));
            if (imageResult == null) {
                log.warn("Noteapp try-on success but no image in response");
                logService.logInboundResponse(
                        session, false, requestId, networkUsed != null ? networkUsed : networkName, provider, executionTimeMs,
                        "No image in AI response", responseSummary, metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason
                );
                return ProcessResult.failure("AI_GENERATION_FAILED", "No image in AI response");
            }

            byte[] imageBytes = imageResult.bytes();
            String sourceUrl = imageResult.sourceUrl();
            Map<String, Object> successSummary = new LinkedHashMap<>(responseSummary);
            if (sourceUrl != null) {
                successSummary.put("sourceImageUrl", sourceUrl);
            }
            successSummary.put("imageBytes", imageBytes != null ? imageBytes.length : 0);
            logService.logInboundResponse(session, true, requestId, networkUsed != null ? networkUsed : networkName, provider, executionTimeMs, null, successSummary, metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
            return ProcessResult.success(requestId, networkUsed != null ? networkUsed : networkName, executionTimeMs, sourceUrl, imageBytes);
        } catch (RestClientException ex) {
            String rawError = extractExceptionMessage(ex);
            log.warn("Noteapp AI call failed baseUrl={}: {}", properties.getBaseUrl(), rawError);
            ProviderErrorResolution resolution = resolveProviderError(rawError);
            if ("AI_GENERATION_FAILED".equals(resolution.errorCode())) {
                resolution = new ProviderErrorResolution("AI_PROVIDER_TIMEOUT", rawError);
            }
            logService.logInboundResponse(session, false, null, networkName, null, 0, rawError, Map.of("exception", ex.getClass().getSimpleName()), metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
            return ProcessResult.failure(resolution.errorCode(), resolution.userMessage());
        }
    }

    static boolean isUnexpectedNetwork(String requestedNetwork, String networkUsed) {
        return requestedNetwork != null
                && !requestedNetwork.isBlank()
                && networkUsed != null
                && !networkUsed.isBlank()
                && !requestedNetwork.trim().equalsIgnoreCase(networkUsed.trim());
    }

    static Map<String, Object> buildVirtualTryOnPayload(
            TryOnSessionEntity session,
            String prompt,
            String personImageBase64,
            String garmentImageBase64,
            AvatarSnapshotEntity avatarSnapshot,
            String figureLockPrompt,
            String fitPromptHint
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("prompt", prompt);
        payload.put(
                "inputImageOrder",
                "image1/customer/avatar/personImageBase64 is the identity and body source; "
                        + "image2/product/garmentImageBase64 is only the garment reference."
        );
        payload.put("settings", Map.of("aspectRatio", "3:4", "width", 768, "height", 1024));
        payload.put("garmentTitle", GarmentTitleSanitizer.forPrompt(session.getProductTitle()));
        payload.put("garmentBrand", session.getProductBrand());
        if (session.getGarmentCategory() != null && !session.getGarmentCategory().isBlank()) {
            payload.put("garmentCategory", session.getGarmentCategory().trim());
        }
        payload.put("garmentPromptProfile", GarmentClassification.normalizePromptProfile(
                session.getGarmentPromptProfile(),
                session.getGarmentCategory()
        ));
        payload.put("garmentCoverageLevel", GarmentClassification.normalizeCoverageLevel(
                session.getGarmentCoverageLevel(),
                session.getGarmentCategory()
        ));
        payload.put("garmentModerationRisk", GarmentClassification.normalizeModerationRisk(
                session.getGarmentModerationRisk(),
                session.getGarmentCategory()
        ));
        payload.put("garmentHasHumanModel", session.isGarmentHasHumanModel());
        payload.put("selectedSize", session.getSelectedSize());
        if (personImageBase64 != null) {
            payload.put("personImageBase64", personImageBase64);
            payload.put("image1Base64", personImageBase64);
            payload.put("image1Role", "customer_avatar_identity_body_face_hair_source");
        }
        if (garmentImageBase64 != null) {
            payload.put("garmentImageBase64", garmentImageBase64);
            payload.put("image2Base64", garmentImageBase64);
            payload.put("image2Role", "product_garment_reference_only_ignore_any_person");
        }
        if (personImageBase64 != null && garmentImageBase64 != null) {
            payload.put(
                    "images",
                    List.of(
                            Map.of(
                                    "label", "image1",
                                    "field", "personImageBase64",
                                    "role", "customer avatar; preserve face, hair, skin tone, body proportions and pose",
                                    "base64", personImageBase64
                            ),
                            Map.of(
                                    "label", "image2",
                                    "field", "garmentImageBase64",
                                    "role", "product garment reference only; ignore any face, body, hair, pose or identity",
                                    "base64", garmentImageBase64
                            )
                    )
            );
        }
        if (avatarSnapshot != null) {
            if (avatarSnapshot.getHeightCm() != null) {
                payload.put("heightCm", avatarSnapshot.getHeightCm());
            }
            if (avatarSnapshot.getBustCm() != null) {
                payload.put("bustCm", avatarSnapshot.getBustCm());
            }
            if (avatarSnapshot.getWaistCm() != null) {
                payload.put("waistCm", avatarSnapshot.getWaistCm());
            }
            if (avatarSnapshot.getHipsCm() != null) {
                payload.put("hipsCm", avatarSnapshot.getHipsCm());
            }
            if (avatarSnapshot.getClothingSize() != null && !avatarSnapshot.getClothingSize().isBlank()) {
                payload.put("clothingSize", avatarSnapshot.getClothingSize().trim());
            }
        }
        if (figureLockPrompt != null && !figureLockPrompt.isBlank()) {
            payload.put("figureLockPrompt", figureLockPrompt);
        }
        if (fitPromptHint != null && !fitPromptHint.isBlank()) {
            payload.put("fitPromptHint", fitPromptHint);
        }
        return payload;
    }

    private ImageResult extractImageResult(JsonNode responseBody) {
        if (responseBody == null || responseBody.isMissingNode()) {
            return null;
        }

        String topLevelBase64 = responseBody.path("imageBase64").asText(null);
        if (topLevelBase64 != null && !topLevelBase64.isBlank()) {
            byte[] bytes = decodeBase64Payload(topLevelBase64);
            if (bytes != null && bytes.length > 0) {
                return new ImageResult(bytes, responseBody.path("sourceImageUrl").asText(null));
            }
        }

        JsonNode data = responseBody.path("data");
        if (data.isArray()) {
            for (JsonNode item : data) {
                ImageResult fromItem = imageFromNode(item);
                if (fromItem != null) {
                    return fromItem;
                }
            }
        }

        JsonNode output = responseBody.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                ImageResult fromItem = imageFromNode(item);
                if (fromItem != null) {
                    return fromItem;
                }
            }
        }

        String imageUrl = extractImageUrl(responseBody);
        if (imageUrl != null) {
            return ImageResult.fromUrl(imageUrl);
        }
        return null;
    }

    private ImageResult imageFromNode(JsonNode item) {
        if (item == null || item.isMissingNode()) {
            return null;
        }
        String base64 = item.path("base64").asText(null);
        if (base64 != null && !base64.isBlank()) {
            byte[] bytes = decodeBase64Payload(base64);
            if (bytes != null && bytes.length > 0) {
                return new ImageResult(bytes, item.path("sourceUrl").asText(null));
            }
        }
        String url = firstUrl(item);
        return url != null ? ImageResult.fromUrl(url) : null;
    }

    private static byte[] decodeBase64Payload(String value) {
        String trimmed = value.trim();
        if (trimmed.startsWith("data:")) {
            int comma = trimmed.indexOf(',');
            if (comma > 0 && comma < trimmed.length() - 1) {
                trimmed = trimmed.substring(comma + 1);
            }
        }
        try {
            return Base64.getDecoder().decode(trimmed);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private record ImageResult(byte[] bytes, String sourceUrl) {
        static ImageResult fromUrl(String url) {
            return new ImageResult(null, url);
        }
    }

    private String extractImageUrl(JsonNode responseBody) {
        if (responseBody == null || responseBody.isMissingNode()) {
            return null;
        }
        JsonNode data = responseBody.path("data");
        if (data.isArray()) {
            for (JsonNode item : data) {
                String url = firstUrl(item);
                if (url != null) {
                    return url;
                }
            }
        }
        JsonNode output = responseBody.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                String url = firstUrl(item);
                if (url != null) {
                    return url;
                }
            }
        }
        JsonNode assets = responseBody.path("assets");
        if (assets.isArray() && assets.size() > 0 && assets.get(0).isTextual()) {
            return assets.get(0).asText();
        }
        return firstUrl(responseBody);
    }

    public VideoProcessResult generateSeasonHitVideo(
            String networkName,
            int attemptNumber,
            String fallbackReason,
            TryOnSessionEntity session,
            String prompt,
            String sourceImageBase64,
            Map<String, String> metadata
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("prompt", prompt);
        payload.put("sourceImageBase64", sourceImageBase64);
        payload.put("settings", Map.of("aspectRatio", "3:4", "durationSec", 6));

        Map<String, Object> body = new HashMap<>();
        body.put("userId", session.getUserId().toString());
        body.put("networkName", networkName);
        body.put("requestType", "video_generation");
        body.put("payload", payload);
        body.put("metadata", metadata == null ? Map.of() : metadata);

        log.info(
                "Noteapp season video call baseUrl={} network={} sessionId={} imageChars={} promptLen={}",
                properties.getBaseUrl(),
                networkName,
                session.getId(),
                sourceImageBase64 != null ? sourceImageBase64.length() : 0,
                prompt != null ? prompt.length() : 0
        );
        logService.logOutboundRequest(
                session,
                body,
                metadata == null ? null : metadata.get("operation"),
                networkName,
                attemptNumber,
                fallbackReason
        );

        try {
            JsonNode response = restClient.post()
                    .uri("/api/ai/process")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-API-Key", properties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                logService.logInboundResponse(session, false, null, networkName, null, 0, "Empty AI response", Map.of(), metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
                return VideoProcessResult.failed("EMPTY_RESPONSE", "Empty AI response");
            }

            String status = response.path("status").asText("");
            String requestId = response.path("requestId").asText(null);
            String networkUsed = response.path("networkUsed").asText(null);
            long executionTimeMs = response.path("executionTimeMs").asLong(0);
            String provider = response.path("response").path("provider").asText(null);

            if (!"success".equalsIgnoreCase(status)) {
                String error = extractErrorMessage(response, "AI video request failed");
                ProviderErrorResolution resolution = resolveProviderError(error);
                logService.logInboundResponse(session, false, requestId, networkUsed != null ? networkUsed : networkName, provider, executionTimeMs, error, Map.of(), metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
                return VideoProcessResult.failed(resolution.errorCode(), resolution.userMessage());
            }

            VideoResult videoResult = extractVideoResult(response.path("response"));
            if (videoResult == null) {
                logService.logInboundResponse(
                        session, false, requestId, networkUsed != null ? networkUsed : networkName, provider, executionTimeMs,
                        "No video in AI response", Map.of(), metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason
                );
                return VideoProcessResult.failed("AI_GENERATION_FAILED", "No video in AI response");
            }

            byte[] videoBytes = videoResult.bytes();
            Map<String, Object> successSummary = new LinkedHashMap<>();
            successSummary.put("videoBytes", videoBytes != null ? videoBytes.length : 0);
            logService.logInboundResponse(session, true, requestId, networkUsed != null ? networkUsed : networkName, provider, executionTimeMs, null, successSummary, metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
            return VideoProcessResult.success(requestId, networkUsed != null ? networkUsed : networkName, executionTimeMs, videoBytes);
        } catch (RestClientException ex) {
            String rawError = extractExceptionMessage(ex);
            log.warn("Noteapp season video call failed: {}", rawError);
            ProviderErrorResolution resolution = resolveProviderError(rawError);
            if ("AI_GENERATION_FAILED".equals(resolution.errorCode())) {
                resolution = new ProviderErrorResolution("AI_PROVIDER_TIMEOUT", rawError);
            }
            logService.logInboundResponse(session, false, null, networkName, null, 0, rawError, Map.of("exception", ex.getClass().getSimpleName()), metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
            return VideoProcessResult.failed(resolution.errorCode(), resolution.userMessage());
        }
    }

    private VideoResult extractVideoResult(JsonNode responseBody) {
        if (responseBody == null || responseBody.isMissingNode()) {
            return null;
        }

        String topLevelBase64 = responseBody.path("videoBase64").asText(null);
        if (topLevelBase64 != null && !topLevelBase64.isBlank()) {
            byte[] bytes = decodeBase64Payload(topLevelBase64);
            if (bytes != null && bytes.length > 0) {
                return new VideoResult(bytes);
            }
        }

        JsonNode data = responseBody.path("data");
        if (data.isArray()) {
            for (JsonNode item : data) {
                VideoResult fromItem = videoFromNode(item);
                if (fromItem != null) {
                    return fromItem;
                }
            }
        }

        JsonNode output = responseBody.path("output");
        if (output.isArray()) {
            for (JsonNode item : output) {
                VideoResult fromItem = videoFromNode(item);
                if (fromItem != null) {
                    return fromItem;
                }
            }
        }
        return null;
    }

    private VideoResult videoFromNode(JsonNode item) {
        if (item == null || item.isMissingNode()) {
            return null;
        }
        String base64 = item.path("base64").asText(null);
        if (base64 != null && !base64.isBlank()) {
            byte[] bytes = decodeBase64Payload(base64);
            if (bytes != null && bytes.length > 0) {
                return new VideoResult(bytes);
            }
        }
        return null;
    }

    private record VideoResult(byte[] bytes) {
    }

    private static Map<String, Object> responseSummary(JsonNode response) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("status", response.path("status").asText(""));
        summary.put("requestId", response.path("requestId").asText(null));
        summary.put("networkUsed", response.path("networkUsed").asText(null));
        summary.put("executionTimeMs", response.path("executionTimeMs").asLong(0));
        JsonNode inner = response.path("response");
        if (!inner.isMissingNode()) {
            summary.put("provider", inner.path("provider").asText(null));
            summary.put("tryOnRoute", inner.path("tryOnRoute").asText(null));
            summary.put("tryOnRouteReason", inner.path("tryOnRouteReason").asText(null));
            summary.put("xaiKeySource", inner.path("xaiKeySource").asText(null));
            summary.put("promptLength", inner.path("prompt").asText("").length());
        }
        return summary;
    }

    private ProviderErrorResolution resolveProviderError(String errorMessage) {
        var configured = errorMappingService.match(errorMessage);
        if (configured.isPresent()) {
            var match = configured.get();
            return new ProviderErrorResolution(match.errorCode(), match.userMessage());
        }
        if (errorMessage == null) {
            return new ProviderErrorResolution("AI_GENERATION_FAILED", "AI request failed");
        }
        String lower = errorMessage.toLowerCase();
        if (lower.contains("token")
                || lower.contains("tokens")
                || lower.contains("quota")
                || lower.contains("credits")
                || lower.contains("insufficient balance")
                || lower.contains("rate limit")
                || lower.contains("429")) {
            return new ProviderErrorResolution("AI_PROVIDER_TOKENS_EXHAUSTED", errorMessage);
        }
        return new ProviderErrorResolution("AI_GENERATION_FAILED", errorMessage);
    }

    static String extractErrorMessage(JsonNode response, String fallback) {
        if (response == null || response.isMissingNode()) {
            return fallback;
        }
        String[] fields = {"errorMessage", "error", "message", "detail"};
        for (String field : fields) {
            String value = response.path(field).asText(null);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        JsonNode inner = response.path("response");
        if (!inner.isMissingNode()) {
            for (String field : fields) {
                String value = inner.path(field).asText(null);
                if (value != null && !value.isBlank()) {
                    return value;
                }
            }
        }
        return fallback;
    }

    private static String extractExceptionMessage(RestClientException ex) {
        if (ex instanceof RestClientResponseException responseException) {
            String body = responseException.getResponseBodyAsString();
            if (body != null && !body.isBlank()) {
                return body;
            }
        }
        return ex.getMessage() == null ? "AI request failed" : ex.getMessage();
    }

    private record ProviderErrorResolution(String errorCode, String userMessage) {
    }

    private static String promptPreview(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return "";
        }
        String oneLine = prompt.replace('\n', ' ').replaceAll("\\s+", " ").trim();
        return oneLine.length() <= 160 ? oneLine : oneLine.substring(0, 160) + "…";
    }

    private String firstUrl(JsonNode node) {
        if (node == null) {
            return null;
        }
        if (node.hasNonNull("url")) {
            return node.get("url").asText();
        }
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            if (entry.getValue().isTextual() && entry.getKey().toLowerCase().contains("url")) {
                return entry.getValue().asText();
            }
        }
        return null;
    }

    public record ProcessResult(
            boolean success,
            String requestId,
            String provider,
            long executionTimeMs,
            String imageUrl,
            byte[] imageBytes,
            String errorCode,
            String errorMessage
    ) {
        static ProcessResult success(String requestId, String provider, long executionTimeMs, String imageUrl, byte[] imageBytes) {
            return new ProcessResult(true, requestId, provider, executionTimeMs, imageUrl, imageBytes, null, null);
        }

        static ProcessResult failure(String errorCode, String errorMessage) {
            return new ProcessResult(false, null, null, 0, null, null, errorCode, errorMessage);
        }

        public static ProcessResult failed(String errorCode, String errorMessage) {
            return failure(errorCode, errorMessage);
        }
    }

    public record VideoProcessResult(
            boolean success,
            String requestId,
            String provider,
            long executionTimeMs,
            byte[] videoBytes,
            String errorCode,
            String errorMessage
    ) {
        static VideoProcessResult success(String requestId, String provider, long executionTimeMs, byte[] videoBytes) {
            return new VideoProcessResult(true, requestId, provider, executionTimeMs, videoBytes, null, null);
        }

        public static VideoProcessResult failed(String errorCode, String errorMessage) {
            return new VideoProcessResult(false, null, null, 0, null, errorCode, errorMessage);
        }
    }
}
