package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.ai.HairstylePromptBuilder;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;
import ru.wibestyle.api.repository.UserRepository;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class HairstyleTryOnService {
    private static final int MAX_PORTRAIT_BYTES = 10 * 1024 * 1024;
    private final NoteappAiClient aiClient; private final AiIntegrationProperties ai; private final BlobStorage storage; private final HairstylePromptBuilder promptBuilder; private final HairstyleCatalogRepository catalog; private final HairColorCatalogRepository colors; private final TryOnSessionRepository sessions; private final UserActivityService userActivityService; private final QuotaService quotaService; private final UserProfileRepository userProfileRepository; private final UserRepository userRepository;
    public HairstyleTryOnService(NoteappAiClient aiClient, AiIntegrationProperties ai, BlobStorage storage, HairstylePromptBuilder promptBuilder, HairstyleCatalogRepository catalog, HairColorCatalogRepository colors, TryOnSessionRepository sessions, UserActivityService userActivityService, QuotaService quotaService, UserProfileRepository userProfileRepository, UserRepository userRepository) { this.aiClient = aiClient; this.ai = ai; this.storage = storage; this.promptBuilder = promptBuilder; this.catalog=catalog; this.colors=colors; this.sessions=sessions; this.userActivityService=userActivityService; this.quotaService=quotaService; this.userProfileRepository=userProfileRepository; this.userRepository=userRepository; }
    @Transactional
    public Map<String, Object> generate(UUID userId, MultipartFile portrait, String styleId, String colorId) throws IOException {
        if (!ai.isNoteappConfigured()) throw new IllegalArgumentException("HAIRSTYLE_AI_NOT_CONFIGURED");
        HairstyleCatalogEntity style = null;
        HairColorCatalogEntity color = null;
        if (styleId != null && !styleId.isBlank()) {
            style = catalog.findBySlug(styleId).filter(s -> s.isActive()).orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
        }
        if (colorId != null && !colorId.isBlank()) {
            color = colors.findBySlug(colorId).filter(c -> c.isActive()).orElseThrow(() -> new IllegalArgumentException("HAIR_COLOR_NOT_FOUND"));
        }
        if (style == null && color == null) throw new IllegalArgumentException("HAIR_CHANGE_REQUIRED");
        byte[] portraitBytes = resolvePortraitBytes(userId, portrait);
        String portraitBase64 = Base64.getEncoder().encodeToString(portraitBytes);
        String primaryReferencePath = style != null ? style.getImagePath() : color.getImagePath();
        String referenceBase64 = Base64.getEncoder().encodeToString(storage.readBytes(primaryReferencePath));
        String colorReferenceBase64 = style != null && color != null
                ? Base64.getEncoder().encodeToString(storage.readBytes(color.getImagePath()))
                : null;
        String prompt = promptBuilder.build(style == null ? null : style.getAiDirective(), color == null ? null : color.getAiDirective());
        UUID sessionId = UUID.randomUUID();
        Instant now = Instant.now();
        TryOnSessionEntity session = new TryOnSessionEntity(sessionId, userId, null, TryOnSourceType.HAIRSTYLE, TryOnSessionStatus.GENERATING, now, now);
        session.setMarketplace("other");
        session.setProductTitle(title(style, color));
        session.setProductBrand(color == null ? "AI-причёска" : "AI-причёска и цвет");
        session.setProductImageUrl(style != null ? "/api/v1/hairstyles/" + style.getSlug() + "/image" : "/api/v1/hair-colors/" + color.getSlug() + "/image");
        session.setProductSizes("[]");
        session.setBeforeImageUrl("/api/v1/try-on/sessions/" + sessionId + "/before-photo");
        session.setAfterImageUrl("/api/v1/try-on/sessions/" + sessionId + "/after-photo");
        session.setStyleCompliment(note(style, color));
        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        quotaService.reserve(session, profile);
        sessions.save(session);
        try {
            NoteappAiClient.AvatarEnhancementResult result = aiClient.applyHairstyle(
                    ai.getVirtualTryOnNetwork(),
                    userId + ":hairstyle:" + sessionId,
                    portraitBase64,
                    referenceBase64,
                    colorReferenceBase64,
                    prompt
            );
            storage.storeTryOnResult(userId, sessionId, "before", new ByteArrayInputStream(portraitBytes));
            storage.storeTryOnResult(userId, sessionId, "after", new ByteArrayInputStream(result.imageBytes()));
            session.setStatus(TryOnSessionStatus.READY);
            quotaService.consume(session);
            sessions.save(session);
        } catch (RuntimeException | IOException ex) {
            quotaService.refund(session);
            session.setStatus(TryOnSessionStatus.FAILED);
            session.setErrorCode("HAIRSTYLE_GENERATION_FAILED");
            session.setErrorMessage(ex.getMessage());
            sessions.save(session);
            throw ex;
        }
        userActivityService.recordTryOn(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("id", sessionId.toString());
        response.put("session", Map.of("id", sessionId.toString(), "sourceType", "hairstyle", "status", "ready"));
        if (style != null) response.put("styleId", style.getSlug());
        if (color != null) response.put("colorId", color.getSlug());
        response.put("beforeImageUrl", session.getBeforeImageUrl());
        response.put("afterImageUrl", session.getAfterImageUrl());
        return response;
    }

    @Transactional
    public Map<String, Object> generateForTryOnSession(UUID userId, UUID sourceSessionId, String styleId, String colorId) throws IOException {
        requireStylistFocusGroup(userId);
        if (!ai.isNoteappConfigured()) throw new IllegalArgumentException("HAIRSTYLE_AI_NOT_CONFIGURED");
        HairstyleCatalogEntity style = resolveStyle(styleId);
        HairColorCatalogEntity color = resolveColor(colorId);
        if (style == null && color == null) throw new IllegalArgumentException("HAIR_CHANGE_REQUIRED");

        TryOnSessionEntity sourceSession = sessions.findByIdAndUserId(sourceSessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("SESSION_NOT_FOUND"));
        if (sourceSession.getStatus() != TryOnSessionStatus.READY) {
            throw new IllegalArgumentException("TRYON_NOT_COMPLETED");
        }

        String sourceResultKey = storage.keyTryOnResult(userId, sourceSessionId, "after");
        if (!storage.exists(sourceResultKey)) {
            throw new IllegalArgumentException("PHOTO_NOT_FOUND");
        }
        String storedPortrait = BlobKeys.hairstylePortrait(userId);
        if (!storage.exists(storedPortrait)) throw new IllegalArgumentException("PORTRAIT_REQUIRED");

        byte[] tryOnResultBytes = storage.readBytes(sourceResultKey);
        byte[] portraitBytes = storage.readBytes(storedPortrait);
        String primaryReferencePath = style != null ? style.getImagePath() : color.getImagePath();
        String referenceBase64 = Base64.getEncoder().encodeToString(storage.readBytes(primaryReferencePath));
        String colorReferenceBase64 = style != null && color != null
                ? Base64.getEncoder().encodeToString(storage.readBytes(color.getImagePath()))
                : null;
        String prompt = buildAfterTryOnPrompt(style, color);

        UUID sessionId = UUID.randomUUID();
        Instant now = Instant.now();
        TryOnSessionEntity session = new TryOnSessionEntity(sessionId, userId, null, TryOnSourceType.HAIRSTYLE, TryOnSessionStatus.GENERATING, now, now);
        session.setMarketplace("other");
        session.setProductTitle(title(style, color) + " к образу");
        session.setProductBrand(color == null ? "AI-причёска" : "AI-причёска и цвет");
        session.setProductImageUrl(style != null ? "/api/v1/hairstyles/" + style.getSlug() + "/image" : "/api/v1/hair-colors/" + color.getSlug() + "/image");
        session.setProductSizes("[]");
        session.setBeforeImageUrl("/api/v1/try-on/sessions/" + sessionId + "/before-photo");
        session.setAfterImageUrl("/api/v1/try-on/sessions/" + sessionId + "/after-photo");
        session.setStyleCompliment(note(style, color));
        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        quotaService.reserve(session, profile);
        sessions.save(session);
        try {
            NoteappAiClient.AvatarEnhancementResult result = aiClient.applyHairstyleToTryOnResult(
                    ai.getVirtualTryOnNetwork(),
                    userId + ":tryon-hairstyle:" + sessionId,
                    Base64.getEncoder().encodeToString(tryOnResultBytes),
                    Base64.getEncoder().encodeToString(portraitBytes),
                    referenceBase64,
                    colorReferenceBase64,
                    prompt
            );
            storage.storeTryOnResult(userId, sessionId, "before", new ByteArrayInputStream(tryOnResultBytes));
            storage.storeTryOnResult(userId, sessionId, "after", new ByteArrayInputStream(result.imageBytes()));
            session.setStatus(TryOnSessionStatus.READY);
            quotaService.consume(session);
            sessions.save(session);
        } catch (RuntimeException | IOException ex) {
            quotaService.refund(session);
            session.setStatus(TryOnSessionStatus.FAILED);
            session.setErrorCode("HAIRSTYLE_GENERATION_FAILED");
            session.setErrorMessage("Не удалось примерить прическу. Попробуйте позже.");
            sessions.save(session);
            throw ex;
        }
        userActivityService.recordTryOn(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("id", sessionId.toString());
        response.put("sourceSessionId", sourceSessionId.toString());
        response.put("session", Map.of("id", sessionId.toString(), "sourceType", "hairstyle", "status", "ready"));
        if (style != null) response.put("styleId", style.getSlug());
        if (color != null) response.put("colorId", color.getSlug());
        response.put("beforeImageUrl", session.getBeforeImageUrl());
        response.put("afterImageUrl", session.getAfterImageUrl());
        return response;
    }

    private static String title(HairstyleCatalogEntity style, HairColorCatalogEntity color) {
        if (style != null && color != null) return style.getTitle() + " + " + color.getTitle();
        return style != null ? style.getTitle() : color.getTitle();
    }

    private static String note(HairstyleCatalogEntity style, HairColorCatalogEntity color) {
        if (style != null && color != null) return style.getMasterNote() + " Цвет: " + color.getDescription();
        return style != null ? style.getMasterNote() : color.getDescription();
    }

    private byte[] resolvePortraitBytes(UUID userId, MultipartFile portrait) throws IOException {
        if (portrait != null && !portrait.isEmpty()) {
            if (portrait.getSize() > MAX_PORTRAIT_BYTES) throw new IllegalArgumentException("PORTRAIT_TOO_LARGE");
            storage.put(BlobKeys.hairstylePortrait(userId), portrait.getInputStream());
            return portrait.getBytes();
        }
        String storedPortrait = BlobKeys.hairstylePortrait(userId);
        if (!storage.exists(storedPortrait)) throw new IllegalArgumentException("PORTRAIT_REQUIRED");
        return storage.readBytes(storedPortrait);
    }

    private HairstyleCatalogEntity resolveStyle(String styleId) {
        if (styleId == null || styleId.isBlank()) {
            return null;
        }
        return catalog.findBySlug(styleId).filter(HairstyleCatalogEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
    }

    private HairColorCatalogEntity resolveColor(String colorId) {
        if (colorId == null || colorId.isBlank()) {
            return null;
        }
        return colors.findBySlug(colorId).filter(HairColorCatalogEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("HAIR_COLOR_NOT_FOUND"));
    }

    private void requireStylistFocusGroup(UUID userId) {
        boolean allowed = userRepository.findById(userId)
                .map(user -> user.isStylistFocusGroup())
                .orElse(false);
        if (!allowed) {
            throw new IllegalArgumentException("STYLIST_FOCUS_GROUP_REQUIRED");
        }
    }

    private String buildAfterTryOnPrompt(HairstyleCatalogEntity style, HairColorCatalogEntity color) {
        return promptBuilder.build(style == null ? null : style.getAiDirective(), color == null ? null : color.getAiDirective())
                + "\n\nUse image 1 as the completed clothing try-on result and preserve its outfit, body, pose, background, lighting and framing. Use image 2 only as the customer's portrait identity and hairline reference. Apply only the selected hair change from the reference image(s). Do not change the clothes, body, hands, legs, shoes, room, camera angle or result framing.";
    }
}
