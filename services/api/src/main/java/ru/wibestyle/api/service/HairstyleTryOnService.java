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
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class HairstyleTryOnService {
    private static final int MAX_PORTRAIT_BYTES = 10 * 1024 * 1024;
    private final NoteappAiClient aiClient; private final AiIntegrationProperties ai; private final BlobStorage storage; private final HairstylePromptBuilder promptBuilder; private final HairstyleCatalogRepository catalog; private final TryOnSessionRepository sessions; private final UserActivityService userActivityService;
    public HairstyleTryOnService(NoteappAiClient aiClient, AiIntegrationProperties ai, BlobStorage storage, HairstylePromptBuilder promptBuilder, HairstyleCatalogRepository catalog, TryOnSessionRepository sessions, UserActivityService userActivityService) { this.aiClient = aiClient; this.ai = ai; this.storage = storage; this.promptBuilder = promptBuilder; this.catalog=catalog; this.sessions=sessions; this.userActivityService=userActivityService; }
    @Transactional
    public Map<String, Object> generate(UUID userId, MultipartFile portrait, String styleId) throws IOException {
        if (portrait == null || portrait.isEmpty()) throw new IllegalArgumentException("PORTRAIT_REQUIRED");
        if (portrait.getSize() > MAX_PORTRAIT_BYTES) throw new IllegalArgumentException("PORTRAIT_TOO_LARGE");
        if (!ai.isNoteappConfigured()) throw new IllegalArgumentException("HAIRSTYLE_AI_NOT_CONFIGURED");
        var style = catalog.findBySlug(styleId).filter(s -> s.isActive()).orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
        byte[] portraitBytes = portrait.getBytes();
        String portraitBase64 = Base64.getEncoder().encodeToString(portraitBytes);
        String referenceBase64;
        referenceBase64 = Base64.getEncoder().encodeToString(storage.readBytes(style.getImagePath()));
        String prompt = promptBuilder.build(style.getAiDirective());
        UUID sessionId = UUID.randomUUID();
        NoteappAiClient.AvatarEnhancementResult result = aiClient.applyHairstyle(ai.getVirtualTryOnNetwork(), userId + ":hairstyle:" + sessionId, portraitBase64, referenceBase64, prompt);
        storage.storeTryOnResult(userId, sessionId, "before", new ByteArrayInputStream(portraitBytes));
        storage.storeTryOnResult(userId, sessionId, "after", new ByteArrayInputStream(result.imageBytes()));
        Instant now = Instant.now();
        TryOnSessionEntity session = new TryOnSessionEntity(sessionId, userId, null, TryOnSourceType.HAIRSTYLE, TryOnSessionStatus.READY, now, now);
        session.setMarketplace("other");
        session.setProductTitle(style.getTitle());
        session.setProductBrand("AI-причёска");
        session.setProductImageUrl("/api/v1/hairstyles/" + style.getSlug() + "/image");
        session.setProductSizes("[]");
        session.setBeforeImageUrl("/api/v1/try-on/sessions/" + sessionId + "/before-photo");
        session.setAfterImageUrl("/api/v1/try-on/sessions/" + sessionId + "/after-photo");
        session.setStyleCompliment(style.getMasterNote());
        sessions.save(session);
        userActivityService.recordTryOn(userId);
        return Map.of(
                "id", sessionId.toString(),
                "session", Map.of(
                        "id", sessionId.toString(),
                        "sourceType", "hairstyle",
                        "status", "ready"
                ),
                "styleId", style.getSlug(),
                "beforeImageUrl", session.getBeforeImageUrl(),
                "afterImageUrl", session.getAfterImageUrl()
        );
    }
}
