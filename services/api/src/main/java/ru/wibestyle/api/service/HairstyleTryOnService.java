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
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.domain.HairColorCatalogEntity;
import ru.wibestyle.api.domain.HairstyleCatalogEntity;
import ru.wibestyle.api.repository.HairColorCatalogRepository;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;

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
    private final NoteappAiClient aiClient; private final AiIntegrationProperties ai; private final BlobStorage storage; private final HairstylePromptBuilder promptBuilder; private final HairstyleCatalogRepository catalog; private final HairColorCatalogRepository colors; private final TryOnSessionRepository sessions; private final UserActivityService userActivityService;
    public HairstyleTryOnService(NoteappAiClient aiClient, AiIntegrationProperties ai, BlobStorage storage, HairstylePromptBuilder promptBuilder, HairstyleCatalogRepository catalog, HairColorCatalogRepository colors, TryOnSessionRepository sessions, UserActivityService userActivityService) { this.aiClient = aiClient; this.ai = ai; this.storage = storage; this.promptBuilder = promptBuilder; this.catalog=catalog; this.colors=colors; this.sessions=sessions; this.userActivityService=userActivityService; }
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
        Instant now = Instant.now();
        TryOnSessionEntity session = new TryOnSessionEntity(sessionId, userId, null, TryOnSourceType.HAIRSTYLE, TryOnSessionStatus.READY, now, now);
        session.setMarketplace("other");
        session.setProductTitle(title(style, color));
        session.setProductBrand(color == null ? "AI-причёска" : "AI-причёска и цвет");
        session.setProductImageUrl(style != null ? "/api/v1/hairstyles/" + style.getSlug() + "/image" : "/api/v1/hair-colors/" + color.getSlug() + "/image");
        session.setProductSizes("[]");
        session.setBeforeImageUrl("/api/v1/try-on/sessions/" + sessionId + "/before-photo");
        session.setAfterImageUrl("/api/v1/try-on/sessions/" + sessionId + "/after-photo");
        session.setStyleCompliment(note(style, color));
        sessions.save(session);
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
}
