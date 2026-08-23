package ru.wibestyle.api.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.ai.HairstylePromptBuilder;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class HairstyleTryOnService {
    private static final int MAX_PORTRAIT_BYTES = 10 * 1024 * 1024;
    private final NoteappAiClient aiClient; private final AiIntegrationProperties ai; private final BlobStorage storage; private final HairstylePromptBuilder promptBuilder;
    public HairstyleTryOnService(NoteappAiClient aiClient, AiIntegrationProperties ai, BlobStorage storage, HairstylePromptBuilder promptBuilder) { this.aiClient = aiClient; this.ai = ai; this.storage = storage; this.promptBuilder = promptBuilder; }
    public Map<String, Object> generate(UUID userId, MultipartFile portrait, String styleId) throws IOException {
        if (portrait == null || portrait.isEmpty()) throw new IllegalArgumentException("PORTRAIT_REQUIRED");
        if (portrait.getSize() > MAX_PORTRAIT_BYTES) throw new IllegalArgumentException("PORTRAIT_TOO_LARGE");
        if (!ai.isNoteappConfigured()) throw new IllegalArgumentException("HAIRSTYLE_AI_NOT_CONFIGURED");
        HairstyleCatalog.Style style = HairstyleCatalog.require(styleId);
        ClassPathResource reference = new ClassPathResource("static/assets/hairstyles/" + style.fileName());
        if (!reference.exists()) throw new IllegalArgumentException("HAIRSTYLE_REFERENCE_MISSING");
        String portraitBase64 = Base64.getEncoder().encodeToString(portrait.getBytes());
        String referenceBase64;
        try (var stream = reference.getInputStream()) {
            referenceBase64 = Base64.getEncoder().encodeToString(stream.readAllBytes());
        }
        String prompt = promptBuilder.build(style);
        NoteappAiClient.AvatarEnhancementResult result = aiClient.applyHairstyle(ai.getVirtualTryOnNetwork(), userId + ":hairstyle:" + UUID.randomUUID(), portraitBase64, referenceBase64, prompt);
        UUID resultId = UUID.randomUUID();
        storage.put(BlobKeys.hairstyleResult(userId, resultId), new ByteArrayInputStream(result.imageBytes()));
        return Map.of("id", resultId.toString(), "styleId", style.id(), "afterImageUrl", "/api/v1/hairstyles/results/" + resultId + "/after-photo");
    }
}
