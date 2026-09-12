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
    private static final String DISABLED_IMAGE_FALLBACK_MESSAGE =
            "Провайдер вернул запрещённый fallback. Результат не сохранён, попробуйте позже.";


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

    public String generateChatText(String networkName, String externalUserId, String systemPrompt, String userPrompt) {
        return generateChatText(networkName, externalUserId, systemPrompt, userPrompt, 180);
    }

    public String generateChatText(String networkName, String externalUserId, String systemPrompt, String userPrompt, int maxTokens) {
        Map<String, Object> payload = new HashMap<>();
        payload.put(
                "messages",
                java.util.List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );
        payload.put("settings", Map.of("temperature", 0.9, "maxTokens", maxTokens));

        Map<String, Object> body = buildChatRequestBody(networkName, externalUserId, payload);

        JsonNode response = restClient.post()
                .uri("/api/ai/process")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-API-Key", properties.getApiKey())
                .header("Cache-Control", "no-store")
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
            String externalUserId,
            String systemPrompt,
            String userText,
            String imageBase64,
            String mimeType
    ) {
        return generateVisionChatText(networkName, externalUserId, systemPrompt, userText, imageBase64, mimeType, 120);
    }

    public String generateVisionChatText(
            String networkName,
            String externalUserId,
            String systemPrompt,
            String userText,
            String imageBase64,
            String mimeType,
            int maxTokens
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
        payload.put("settings", Map.of("temperature", 0.2, "maxTokens", maxTokens));

        Map<String, Object> body = buildChatRequestBody(networkName, externalUserId, payload);

        JsonNode response = restClient.post()
                .uri("/api/ai/process")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-API-Key", properties.getApiKey())
                .header("Cache-Control", "no-store")
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

    public AvatarEnhancementResult enhanceAvatar(
            String networkName,
            String externalUserId,
            String imageBase64,
            String mimeType
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("imageBase64", imageBase64);
        payload.put("imageContentType", mimeType == null || mimeType.isBlank() ? "image/jpeg" : mimeType);
        payload.put("quality", "medium");
        payload.put("output_format", "jpeg");
        payload.put("input_fidelity", "high");
        payload.put("settings", Map.of("width", 1024, "height", 1536));
        payload.put("prompt", "Create an improved private virtual try-on avatar reference from this photo. The final image must be a vertical full-body avatar where the person is the main subject and fills most of the frame. If the original photo shows the person far away or too small, crop/reframe/zoom in and upscale so the full body from head to shoes is large, centered, and clearly visible, with only a small natural margin around the body. Remove unnecessary surrounding environment; keep only a calm, non-busy background. Preserve exactly the person's identity, face, hair, skin tone, body shape, proportions, pose direction, camera perspective, and full-body silhouette. Improve lighting, reduce noise, improve sharpness, and make the background less distracting. Replace the current outfit with a clean, form-fitting athletic outfit suitable for body-contour detection: long leggings and a fitted long-sleeve or short-sleeve top, modest, opaque, no logos, no busy patterns, no loose fabric. Choose outfit colors that clearly contrast with the background and skin while still looking natural: for dark green/nature/garden backgrounds prefer light neutral colors such as off-white, light beige, pale gray, or soft cream; for light backgrounds choose a medium saturated color such as muted blue, teal, burgundy, or gray, but never pure black. Keep shoes simple and light/neutral if visible. Do not slim, beautify, age, reshape, retouch facial features, change body proportions, or change the person's silhouette except for replacing clothing with the described fitted athletic outfit and reframing the image to make the full person fill the avatar.");

        Map<String, Object> body = new HashMap<>();
        body.put("userId", requireExternalUserId(externalUserId));
        body.put("networkName", networkName);
        body.put("requestType", "image_edit");
        body.put("payload", payload);

        JsonNode response = restClient.post()
                .uri("/api/ai/process")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-API-Key", properties.getApiKey())
                .header("Cache-Control", "no-store")
                .body(body)
                .retrieve()
                .body(JsonNode.class);
        if (response == null || !"success".equalsIgnoreCase(response.path("status").asText(""))) {
            throw new RestClientException(extractErrorMessage(response, "Avatar enhancement failed"));
        }
        String networkUsed = response.path("networkUsed").asText(null);
        if (isUnexpectedNetwork(networkName, networkUsed)) {
            throw new RestClientException("Avatar enhancement provider mismatch");
        }
        ImageResult image = extractImageResult(response.path("response"));
        byte[] imageBytes = image == null ? null : image.bytes();
        if ((imageBytes == null || imageBytes.length == 0) && image != null && image.sourceUrl() != null) {
            imageBytes = downloadImageBytes(image.sourceUrl());
        }
        if (imageBytes == null || imageBytes.length == 0) {
            throw new RestClientException("Avatar enhancement returned no image");
        }
        return new AvatarEnhancementResult(imageBytes, response.path("response").path("imageContentType").asText("image/jpeg"));
    }

    /** Image-to-image generation for the portrait-only hairstyle experience. */
    public AvatarEnhancementResult applyHairstyle(
            String networkName,
            String externalUserId,
            String portraitBase64,
            String referenceBase64,
            String colorReferenceBase64,
            String prompt
    ) {
        Map<String, Object> payload = buildHairstylePayload(prompt, portraitBase64, referenceBase64, colorReferenceBase64);
        Map<String, Object> body = new HashMap<>();
        body.put("userId", requireExternalUserId(externalUserId));
        body.put("networkName", networkName);
        body.put("requestType", "image_generation");
        body.put("payload", payload);
        try {
            rejectPollinationsNetwork(networkName, "Hairstyle generation");
            JsonNode response = restClient.post().uri("/api/ai/process").contentType(MediaType.APPLICATION_JSON)
                    .header("X-API-Key", properties.getApiKey()).body(body).retrieve().body(JsonNode.class);
            if (response == null || !"success".equalsIgnoreCase(response.path("status").asText(""))) {
                throw new RestClientException(extractErrorMessage(response, "Hairstyle generation failed"));
            }
            String networkUsed = response.path("networkUsed").asText(null);
            if (isUnexpectedNetwork(networkName, networkUsed)) throw new RestClientException("Hairstyle provider mismatch");
            ImageResult image = extractImageResult(response.path("response"));
            rejectPollinationsImageResult(response, image, "Hairstyle generation");
            byte[] bytes = image == null ? null : image.bytes();
            if ((bytes == null || bytes.length == 0) && image != null && image.sourceUrl() != null) bytes = downloadImageBytes(image.sourceUrl());
            if (bytes == null || bytes.length == 0) throw new RestClientException("Hairstyle generation returned no image");
            return new AvatarEnhancementResult(bytes, response.path("response").path("imageContentType").asText("image/jpeg"));
        } catch (RestClientException ex) {
            throw new IllegalArgumentException("HAIRSTYLE_GENERATION_FAILED", ex);
        }
    }

    /** Image-to-image generation for a clothing try-on result plus a separate hairstyle portrait reference. */
    public AvatarEnhancementResult applyHairstyleToTryOnResult(
            String networkName,
            String externalUserId,
            String tryOnResultBase64,
            String portraitBase64,
            String hairstyleReferenceBase64,
            String colorReferenceBase64,
            String prompt
    ) {
        Map<String, Object> payload = buildHairstyleAfterTryOnPayload(
                prompt,
                tryOnResultBase64,
                portraitBase64,
                hairstyleReferenceBase64,
                colorReferenceBase64
        );
        Map<String, Object> body = new HashMap<>();
        body.put("userId", requireExternalUserId(externalUserId));
        body.put("networkName", networkName);
        body.put("requestType", "image_generation");
        body.put("payload", payload);
        try {
            rejectPollinationsNetwork(networkName, "Hairstyle generation");
            JsonNode response = restClient.post().uri("/api/ai/process").contentType(MediaType.APPLICATION_JSON)
                    .header("X-API-Key", properties.getApiKey()).body(body).retrieve().body(JsonNode.class);
            if (response == null || !"success".equalsIgnoreCase(response.path("status").asText(""))) {
                throw new RestClientException(extractErrorMessage(response, "Hairstyle generation failed"));
            }
            String networkUsed = response.path("networkUsed").asText(null);
            if (isUnexpectedNetwork(networkName, networkUsed)) throw new RestClientException("Hairstyle provider mismatch");
            ImageResult image = extractImageResult(response.path("response"));
            rejectPollinationsImageResult(response, image, "Hairstyle generation");
            byte[] bytes = image == null ? null : image.bytes();
            if ((bytes == null || bytes.length == 0) && image != null && image.sourceUrl() != null) bytes = downloadImageBytes(image.sourceUrl());
            if (bytes == null || bytes.length == 0) throw new RestClientException("Hairstyle generation returned no image");
            return new AvatarEnhancementResult(bytes, response.path("response").path("imageContentType").asText("image/jpeg"));
        } catch (RestClientException ex) {
            throw new IllegalArgumentException("HAIRSTYLE_GENERATION_FAILED", ex);
        }
    }

    public ProcessResult generateStylistPreview(
            String networkName,
            String externalUserId,
            String prompt,
            String avatarImageBase64,
            String portraitImageBase64,
            Map<String, String> metadata
    ) {
        Map<String, Object> payload = buildStylistPreviewPayload(prompt, avatarImageBase64, portraitImageBase64);

        Map<String, Object> body = new HashMap<>();
        body.put("userId", requireExternalUserId(externalUserId));
        body.put("networkName", networkName);
        body.put("requestType", "image_generation");
        body.put("payload", payload);
        body.put("metadata", metadata == null ? Map.of() : metadata);

        try {
            if (isPollinationsNetwork(networkName)) {
                return ProcessResult.failed("AI_PROVIDER_FALLBACK_NOT_ALLOWED", DISABLED_IMAGE_FALLBACK_MESSAGE);
            }
            JsonNode response = restClient.post()
                    .uri("/api/ai/process")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-API-Key", properties.getApiKey())
                    .header("Cache-Control", "no-store")
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null || !"success".equalsIgnoreCase(response.path("status").asText(""))) {
                return ProcessResult.failed("AI_GENERATION_FAILED", extractErrorMessage(response, "Stylist preview generation failed"));
            }
            String requestId = response.path("requestId").asText(null);
            String networkUsed = response.path("networkUsed").asText(null);
            long executionTimeMs = response.path("executionTimeMs").asLong(0);
            String provider = response.path("response").path("provider").asText(null);
            ImageResult image = extractImageResult(response.path("response"));
            byte[] bytes = image == null ? null : image.bytes();
            String imageUrl = image == null ? null : image.sourceUrl();
            if (isPollinationsResult(provider, imageUrl, response.path("response"))) {
                String routeReason = response.path("response").path("tryOnRouteReason").asText(null);
                String reason = routeReason == null || routeReason.isBlank()
                        ? "Stylist preview requires Grok Imagine; disabled fallback is not allowed"
                        : "Stylist preview requires Grok Imagine; disabled fallback is not allowed: " + routeReason;
                return ProcessResult.failed("AI_PROVIDER_FALLBACK_NOT_ALLOWED", reason);
            }
            if ((bytes == null || bytes.length == 0) && image != null && image.sourceUrl() != null) {
                try {
                    bytes = downloadImageBytes(image.sourceUrl());
                } catch (RestClientException ex) {
                    log.warn("Stylist preview image download failed, keeping provider URL: {}", ex.getMessage());
                }
            }
            if ((bytes == null || bytes.length == 0) && (imageUrl == null || imageUrl.isBlank())) {
                return ProcessResult.failed("AI_GENERATION_FAILED", "Stylist preview generation returned no image");
            }
            return ProcessResult.success(requestId, provider != null ? provider : networkUsed, executionTimeMs, imageUrl, bytes);
        } catch (RestClientException ex) {
            return ProcessResult.failed("AI_GENERATION_FAILED", extractExceptionMessage(ex));
        }
    }

    static Map<String, Object> buildStylistPreviewPayload(String prompt, String avatarImageBase64, String portraitImageBase64) {
        String referenceImageBase64 = portraitImageBase64 == null || portraitImageBase64.isBlank()
                ? avatarImageBase64
                : portraitImageBase64;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("prompt", prompt);
        payload.put("personImageBase64", avatarImageBase64);
        payload.put("sourceImageBase64", avatarImageBase64);
        payload.put("modelImageBase64", avatarImageBase64);
        payload.put("image1Base64", avatarImageBase64);
        payload.put("image1Role", "customer_avatar_identity_body_face_hair_source");
        payload.put("garmentImageBase64", referenceImageBase64);
        payload.put("productImageBase64", referenceImageBase64);
        payload.put("image2Base64", referenceImageBase64);
        payload.put("image2Role", "customer portrait and hairstyle reference only; preserve face and hair details, ignore background and do not use as a clothing reference");
        payload.put("garmentTitle", "AI stylist complete outfit generated from the style brief");
        payload.put("garmentBrand", "WibeStyle AI Stylist");
        payload.put("garmentCategory", "complete_outfit");
        payload.put("garmentPromptProfile", "full_outfit_text_brief");
        payload.put("garmentCoverageLevel", "full_body");
        payload.put("garmentModerationRisk", "low");
        payload.put("garmentHasHumanModel", false);
        payload.put(
                "inputImageOrder",
                "image1/personImageBase64 is the only customer identity and body source. "
                        + "image2/garmentImageBase64 is the customer's portrait/hair reference required by the route; use it only to preserve face and hairstyle details, not as a clothing reference."
        );
        payload.put(
                "images",
                List.of(
                        Map.of(
                                "label", "image1",
                                "field", "personImageBase64",
                                "role", "customer avatar; preserve face, hair, skin tone, body proportions and pose",
                                "base64Field", "personImageBase64"
                        ),
                        Map.of(
                                "label", "image2",
                                "field", "garmentImageBase64",
                                "role", "customer portrait and hairstyle reference only; ignore clothing and background",
                                "base64Field", "garmentImageBase64"
                        )
                )
        );
        payload.put("negativePrompt", "animal, fox, wolf, mascot, furry character, forest, bushes, thickets, wilderness, fantasy creature, non-human subject, face replacement, body replacement");
        payload.put("output_format", "jpeg");
        payload.put("input_fidelity", "high");
        putDisabledFallbackPolicy(payload);
        payload.put("requiredProvider", "grok");
        payload.put("settings", Map.of("width", 1024, "height", 1365, "aspectRatio", "3:4"));
        return payload;
    }

    static Map<String, Object> buildHairstylePayload(
            String prompt,
            String portraitBase64,
            String referenceBase64,
            String colorReferenceBase64
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("prompt", prompt);
        putDisabledFallbackPolicy(payload);
        payload.put("personImageBase64", portraitBase64);
        payload.put("image1Base64", portraitBase64);
        payload.put("image1Role", "customer_portrait_identity_source_preserve_all_non_hair_pixels");
        payload.put("garmentImageBase64", referenceBase64);
        payload.put("image2Base64", referenceBase64);
        payload.put("image2Role", colorReferenceBase64 == null
                ? "selected_reference_hairstyle_or_hair_color_only_ignore_identity"
                : "hairstyle_reference_shape_length_bangs_parting_only_ignore_identity_and_color_when_conflicting");
        if (colorReferenceBase64 != null && !colorReferenceBase64.isBlank()) {
            payload.put("hairColorImageBase64", colorReferenceBase64);
            payload.put("image3Base64", colorReferenceBase64);
            payload.put("image3Role", "hair_color_texture_reference_only_ignore_shape_identity_face_body_background");
        }
        payload.put("inputImageOrder", colorReferenceBase64 == null
                ? "image1 is the user's portrait and identity source; image2 is the selected hairstyle or hair-color reference only"
                : "image1 is the user's portrait and identity source; image2 is hairstyle shape reference only; image3 is hair-color texture reference only");
        payload.put("images", colorReferenceBase64 == null
                ? List.of(
                Map.of(
                        "label", "image1",
                        "field", "personImageBase64",
                        "role", "customer portrait; preserve face, skin, pose, clothes, background and all non-hair pixels",
                        "base64Field", "personImageBase64"
                ),
                Map.of(
                        "label", "image2",
                        "field", "garmentImageBase64",
                        "role", "selected hairstyle or hair-color reference only; ignore identity and non-hair details",
                        "base64Field", "garmentImageBase64"
                )
        )
                : List.of(
                Map.of(
                        "label", "image1",
                        "field", "personImageBase64",
                        "role", "customer portrait; preserve face, skin, pose, clothes, background and all non-hair pixels",
                        "base64Field", "personImageBase64"
                ),
                Map.of(
                        "label", "image2",
                        "field", "garmentImageBase64",
                        "role", "hairstyle shape, length, bangs and parting reference only; ignore identity and color if image3 conflicts",
                        "base64Field", "garmentImageBase64"
                ),
                Map.of(
                        "label", "image3",
                        "field", "hairColorImageBase64",
                        "role", "hair-color texture reference only; ignore hairstyle shape, face, body, clothes and background",
                        "base64Field", "hairColorImageBase64"
                )
        ));
        payload.put("output_format", "jpeg");
        payload.put("input_fidelity", "high");
        payload.put("settings", Map.of("width", 1024, "height", 1024));
        return payload;
    }

    static Map<String, Object> buildHairstyleAfterTryOnPayload(
            String prompt,
            String tryOnResultBase64,
            String portraitBase64,
            String hairstyleReferenceBase64,
            String colorReferenceBase64
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("prompt", prompt);
        putDisabledFallbackPolicy(payload);
        payload.put("sourceImageBase64", tryOnResultBase64);
        payload.put("personImageBase64", tryOnResultBase64);
        payload.put("image1Base64", tryOnResultBase64);
        payload.put("image1Role", "ONLY_OUTPUT_CANVAS_completed_clothing_try_on_result_keep_person_face_body_clothes_pose_crop_background_camera_angle");
        payload.put("portraitImageBase64", portraitBase64);
        payload.put("hairstyleReferenceImageBase64", hairstyleReferenceBase64);
        payload.put("styleReferenceImageBase64", hairstyleReferenceBase64);
        if (colorReferenceBase64 != null && !colorReferenceBase64.isBlank()) {
            payload.put("image2Base64", hairstyleReferenceBase64);
            payload.put("image2Role", "hairstyle_shape_length_bangs_parting_reference_only_ignore_identity_and_color_when_conflicting");
            payload.put("hairColorImageBase64", colorReferenceBase64);
            payload.put("image3Base64", colorReferenceBase64);
            payload.put("image3Role", "hair_color_texture_reference_only_ignore_shape_identity_face_body_background");
        } else {
            payload.put("image2Base64", portraitBase64);
            payload.put("image2Role", "customer_portrait_identity_and_hairline_reference");
            payload.put("image3Base64", hairstyleReferenceBase64);
            payload.put("image3Role", "selected_hairstyle_or_hair_color_reference_only_ignore_identity");
        }
        payload.put("inputImageOrder", colorReferenceBase64 == null
                ? "image1 is the completed clothing try-on result and final person source; image2 is the user's portrait and identity reference; image3 is the selected hairstyle or hair-color reference only and must never become the output person"
                : "image1 is the completed clothing try-on result and final person source; image2 is hairstyle shape reference only and must never become the output person; image3 is hair-color texture reference only");
        payload.put("identitySourcePolicy", "FINAL_PERSON_BODY_CLOTHES_POSE_AND_BACKGROUND_MUST_REMAIN_IMAGE1_TRYON_RESULT");
        payload.put("referenceImagePolicy", colorReferenceBase64 == null
                ? "IMAGE3_IS_HAIR_REFERENCE_ONLY_NEVER_OUTPUT_REFERENCE_MODEL_FACE_BODY_OR_BACKGROUND"
                : "IMAGE2_AND_IMAGE3_ARE_HAIR_REFERENCES_ONLY_NEVER_OUTPUT_REFERENCE_MODEL_FACE_BODY_OR_BACKGROUND");
        payload.put("images", colorReferenceBase64 == null
                ? List.of(
                Map.of(
                        "label", "image1",
                        "field", "sourceImageBase64",
                        "role", "ONLY output canvas and final person source; keep face, body, clothes, pose, crop, camera angle, background and lighting",
                        "base64Field", "sourceImageBase64"
                ),
                Map.of(
                        "label", "image2",
                        "field", "portraitImageBase64",
                        "role", "customer portrait and hairline reference only; do not use as output canvas or crop",
                        "base64Field", "portraitImageBase64"
                ),
                Map.of(
                        "label", "image3",
                        "field", "hairstyleReferenceImageBase64",
                        "role", "selected hairstyle or hair-color reference only; ignore identity, face, body, clothes, hands, pose, crop and background; never output this model",
                        "base64Field", "hairstyleReferenceImageBase64"
                )
        )
                : List.of(
                Map.of(
                        "label", "image1",
                        "field", "sourceImageBase64",
                        "role", "ONLY output canvas and final person source; keep face, body, clothes, pose, crop, camera angle, background and lighting",
                        "base64Field", "sourceImageBase64"
                ),
                Map.of(
                        "label", "image2",
                        "field", "hairstyleReferenceImageBase64",
                        "role", "haircut shape, length, bangs and parting reference only; ignore identity, face, body, clothes, hands, pose, crop and background; never output this model",
                        "base64Field", "hairstyleReferenceImageBase64"
                ),
                Map.of(
                        "label", "image3",
                        "field", "hairColorImageBase64",
                        "role", "hair-color texture reference only; ignore face, body, clothes, pose, crop and background",
                        "base64Field", "hairColorImageBase64"
                )
        ));
        payload.put("output_format", "jpeg");
        payload.put("input_fidelity", "high");
        payload.put("settings", Map.of("width", 1024, "height", 1365, "aspectRatio", "3:4"));
        return payload;
    }

    private byte[] downloadImageBytes(String imageUrl) {
        try {
            return RestClient.create()
                    .get()
                    .uri(imageUrl)
                    .retrieve()
                    .body(byte[].class);
        } catch (RestClientException ex) {
            throw new RestClientException("Avatar enhancement image download failed", ex);
        }
    }

    private static String requireExternalUserId(String externalUserId) {
        if (externalUserId == null || externalUserId.isBlank()) {
            throw new IllegalArgumentException("NOTEAPP_EXTERNAL_USER_ID_REQUIRED");
        }
        return externalUserId.trim();
    }

    static Map<String, Object> buildChatRequestBody(
            String networkName,
            String externalUserId,
            Map<String, Object> payload
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", requireExternalUserId(externalUserId));
        body.put("networkName", networkName);
        body.put("requestType", "chat");
        body.put("payload", payload);
        return body;
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
        if (isPollinationsNetwork(networkName)) {
            return ProcessResult.failure("AI_PROVIDER_FALLBACK_NOT_ALLOWED", DISABLED_IMAGE_FALLBACK_MESSAGE);
        }

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
            if (isPollinationsResult(provider, imageResult.sourceUrl(), response.path("response"))) {
                String error = DISABLED_IMAGE_FALLBACK_MESSAGE;
                log.warn("Blocked disabled image fallback result for session {}", session.getId());
                logService.logInboundResponse(
                        session, false, requestId, networkUsed != null ? networkUsed : networkName, provider, executionTimeMs,
                        error, responseSummary, metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason
                );
                return ProcessResult.failure("AI_PROVIDER_FALLBACK_NOT_ALLOWED", error);
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

    static boolean isPollinationsResult(String provider, String imageUrl, JsonNode responseBody) {
        return containsIgnoreCase(provider, "pollinations")
                || containsIgnoreCase(imageUrl, "pollinations.ai")
                || containsIgnoreCase(responseBody == null ? null : responseBody.path("tryOnRoute").asText(null), "pollinations")
                || containsIgnoreCase(responseBody == null ? null : responseBody.path("tryOnRouteReason").asText(null), "pollinations");
    }

    private static boolean isPollinationsNetwork(String networkName) {
        return containsIgnoreCase(networkName, "pollinations");
    }

    private static void rejectPollinationsNetwork(String networkName, String operation) {
        if (isPollinationsNetwork(networkName)) {
            throw new RestClientException(operation + " rejected disabled image fallback network");
        }
    }

    private static void rejectPollinationsImageResult(JsonNode response, ImageResult image, String operation) {
        String provider = response == null ? null : response.path("response").path("provider").asText(null);
        JsonNode responseBody = response == null ? null : response.path("response");
        String imageUrl = image == null ? null : image.sourceUrl();
        if (isPollinationsResult(provider, imageUrl, responseBody)) {
            throw new RestClientException(operation + " rejected disabled image fallback");
        }
    }

    private static boolean containsIgnoreCase(String value, String needle) {
        return value != null && needle != null && value.toLowerCase(java.util.Locale.ROOT).contains(needle.toLowerCase(java.util.Locale.ROOT));
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
        putDisabledFallbackPolicy(payload);
        payload.put(
                "inputImageOrder",
                "image1/customer/avatar/personImageBase64 is the identity and body source; "
                        + "image2/product/garmentImageBase64 is only the garment reference; "
                        + "never use a person, face, hair, pose, limbs, background or identity from image2."
        );
        payload.put("identitySourcePolicy", "FINAL_PERSON_MUST_BE_IMAGE1_CUSTOMER_ONLY");
        payload.put("productImagePolicy", "USE_IMAGE2_FOR_GARMENT_ONLY_NEVER_OUTPUT_PRODUCT_MODEL_OR_PRODUCT_CARD_PHOTO");
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
            payload.put("sourceImageBase64", personImageBase64);
            payload.put("modelImageBase64", personImageBase64);
            payload.put("personImageBase64", personImageBase64);
            payload.put("image1Base64", personImageBase64);
            payload.put("image1Role", "customer_avatar_identity_body_face_hair_source_final_person");
        }
        if (garmentImageBase64 != null) {
            payload.put("garmentImageBase64", garmentImageBase64);
            payload.put("productImageBase64", garmentImageBase64);
            payload.put("image2Base64", garmentImageBase64);
            payload.put("image2Role", "product_garment_reference_only_ignore_any_person_never_output_image2");
        }
        if (personImageBase64 != null && garmentImageBase64 != null) {
            payload.put(
                    "images",
                    List.of(
                            Map.of(
                                    "label", "image1",
                                    "field", "personImageBase64",
                                    "role", "customer avatar; this is the only final person source; preserve face, hair, skin tone, body proportions and pose",
                                    "base64Field", "personImageBase64"
                            ),
                            Map.of(
                                    "label", "image2",
                                    "field", "garmentImageBase64",
                                    "role", "product garment reference only; ignore any face, body, hair, pose, limbs, skin tone, background or identity; never output this image or its model",
                                    "base64Field", "garmentImageBase64"
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

    private static void putDisabledFallbackPolicy(Map<String, Object> payload) {
        payload.put("allowFallback", false);
        payload.put("disableFallback", true);
        payload.put("fallbackPolicy", "disabled");
        payload.put("fallbackProviders", List.of());
        payload.put("disallowedProviders", List.of("pollinations"));
        payload.put("forbiddenFallbackProviders", List.of("pollinations"));
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
            String garmentImageBase64,
            Map<String, String> metadata
    ) {
        Map<String, Object> payload = buildSeasonHitVideoPayload(
                prompt,
                sourceImageBase64,
                garmentImageBase64
        );

        Map<String, Object> body = new HashMap<>();
        body.put("userId", session.getUserId().toString());
        body.put("networkName", networkName);
        body.put("requestType", "video_generation");
        body.put("payload", payload);
        body.put("metadata", metadata == null ? Map.of() : metadata);

        log.info(
                "Noteapp season video call baseUrl={} network={} sessionId={} imageChars={} garmentChars={} promptLen={}",
                properties.getBaseUrl(),
                networkName,
                session.getId(),
                sourceImageBase64 != null ? sourceImageBase64.length() : 0,
                garmentImageBase64 != null ? garmentImageBase64.length() : 0,
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
                ProviderErrorResolution resolution = resolveVideoProviderError(error);
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
            ProviderErrorResolution resolution = resolveVideoProviderError(rawError);
            logService.logInboundResponse(session, false, null, networkName, null, 0, rawError, Map.of("exception", ex.getClass().getSimpleName()), metadata == null ? null : metadata.get("operation"), attemptNumber, fallbackReason);
            return VideoProcessResult.failed(resolution.errorCode(), resolution.userMessage());
        }
    }

    static Map<String, Object> buildSeasonHitVideoPayload(
            String prompt,
            String sourceImageBase64,
            String garmentImageBase64
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("prompt", prompt);
        payload.put("sourceImageBase64", sourceImageBase64);
        payload.put("personImageBase64", sourceImageBase64);
        payload.put("modelImageBase64", sourceImageBase64);
        payload.put("image1Base64", sourceImageBase64);
        payload.put("garmentImageBase64", garmentImageBase64);
        payload.put("productImageBase64", garmentImageBase64);
        payload.put("image2Base64", garmentImageBase64);
        payload.put("resolution", "1k");
        payload.put("settings", Map.of("aspectRatio", "3:4", "resolution", "1k"));
        return payload;
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

    private ProviderErrorResolution resolveVideoProviderError(String errorMessage) {
        var configured = errorMappingService.match(errorMessage);
        if (configured.isPresent()) {
            var match = configured.get();
            return new ProviderErrorResolution(match.errorCode(), match.userMessage());
        }
        if (errorMessage == null || errorMessage.isBlank()) {
            return new ProviderErrorResolution("VIDEO_GENERATION_FAILED", "Не удалось создать видео. Попробуйте позже.");
        }
        String lower = errorMessage.toLowerCase();
        if (lower.contains("service_unavailable")
                || lower.contains("temporarily overloaded")
                || lower.contains("overloaded")
                || lower.contains("503")) {
            return new ProviderErrorResolution("VIDEO_PROVIDER_UNAVAILABLE", "Видео сейчас перегружено. Попробуйте создать его позже.");
        }
        if (lower.contains("extracting response")
                || lower.contains("content type")
                || lower.contains("application/octet-stream")
                || lower.contains("jsonnode")) {
            return new ProviderErrorResolution("VIDEO_PROVIDER_INVALID_RESPONSE", "Сервис видео вернул неожиданный ответ. Мы не списали видео, попробуйте позже.");
        }
        if (lower.contains("timeout") || lower.contains("timed out")) {
            return new ProviderErrorResolution("AI_PROVIDER_TIMEOUT", "Видео создаётся дольше обычного. Попробуйте позже.");
        }
        if (lower.contains("token")
                || lower.contains("tokens")
                || lower.contains("quota")
                || lower.contains("credits")
                || lower.contains("insufficient balance")
                || lower.contains("rate limit")
                || lower.contains("429")) {
            return new ProviderErrorResolution("AI_PROVIDER_TOKENS_EXHAUSTED", "Сервис видео временно ограничил запросы. Попробуйте позже.");
        }
        return new ProviderErrorResolution("VIDEO_GENERATION_FAILED", "Не удалось создать видео. Попробуйте позже.");
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

    public record AvatarEnhancementResult(byte[] imageBytes, String contentType) {
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
