package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.ai.HairstylePromptBuilder;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.repository.HairstyleCatalogRepository;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class HairstyleTryOnService {
    private static final int MAX_PORTRAIT_BYTES = 10 * 1024 * 1024;
    private final NoteappAiClient aiClient; private final AiIntegrationProperties ai; private final BlobStorage storage; private final HairstylePromptBuilder promptBuilder; private final HairstyleCatalogRepository catalog;
    public HairstyleTryOnService(NoteappAiClient aiClient, AiIntegrationProperties ai, BlobStorage storage, HairstylePromptBuilder promptBuilder, HairstyleCatalogRepository catalog) { this.aiClient = aiClient; this.ai = ai; this.storage = storage; this.promptBuilder = promptBuilder; this.catalog=catalog; }
    public Map<String, Object> generate(UUID userId, MultipartFile portrait, String styleId) throws IOException {
        if (portrait == null || portrait.isEmpty()) throw new IllegalArgumentException("PORTRAIT_REQUIRED");
        if (portrait.getSize() > MAX_PORTRAIT_BYTES) throw new IllegalArgumentException("PORTRAIT_TOO_LARGE");
        if (!ai.isNoteappConfigured()) throw new IllegalArgumentException("HAIRSTYLE_AI_NOT_CONFIGURED");
        var style = catalog.findBySlug(styleId).filter(s -> s.isActive()).orElseThrow(() -> new IllegalArgumentException("HAIRSTYLE_NOT_FOUND"));
        String portraitBase64 = Base64.getEncoder().encodeToString(portrait.getBytes());
        String referenceBase64;
        referenceBase64 = Base64.getEncoder().encodeToString(storage.readBytes(style.getImagePath()));
        String prompt = promptBuilder.build(style.getAiDirective());
        NoteappAiClient.AvatarEnhancementResult result = aiClient.applyHairstyle(ai.getVirtualTryOnNetwork(), userId + ":hairstyle:" + UUID.randomUUID(), portraitBase64, referenceBase64, prompt);
        UUID resultId = UUID.randomUUID();
        storage.put(BlobKeys.hairstyleResult(userId, resultId), new ByteArrayInputStream(result.imageBytes()));
        return Map.of("id", resultId.toString(), "styleId", style.getSlug(), "afterImageUrl", "/api/v1/hairstyles/results/" + resultId + "/after-photo");
    }
}
