package ru.wibestyle.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.domain.AiOperations;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.StylistSessionEntity;
import ru.wibestyle.api.domain.StylistVariantEntity;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;
import ru.wibestyle.api.repository.StylistSessionRepository;
import ru.wibestyle.api.repository.StylistVariantRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class StylistPreviewWorker {

    private static final Logger log = LoggerFactory.getLogger(StylistPreviewWorker.class);

    private final StylistSessionRepository sessionRepository;
    private final StylistVariantRepository variantRepository;
    private final AvatarSnapshotRepository avatarSnapshotRepository;
    private final AiPromptTemplateService promptTemplateService;
    private final NoteappAiClient aiClient;
    private final AiIntegrationProperties aiProperties;
    private final BlobStorage blobStorage;

    public StylistPreviewWorker(
            StylistSessionRepository sessionRepository,
            StylistVariantRepository variantRepository,
            AvatarSnapshotRepository avatarSnapshotRepository,
            AiPromptTemplateService promptTemplateService,
            NoteappAiClient aiClient,
            AiIntegrationProperties aiProperties,
            BlobStorage blobStorage
    ) {
        this.sessionRepository = sessionRepository;
        this.variantRepository = variantRepository;
        this.avatarSnapshotRepository = avatarSnapshotRepository;
        this.promptTemplateService = promptTemplateService;
        this.aiClient = aiClient;
        this.aiProperties = aiProperties;
        this.blobStorage = blobStorage;
    }

    @Async("aiTaskExecutor")
    public void generateAsync(UUID variantId) {
        generate(variantId);
    }

    @Transactional
    public void generate(UUID variantId) {
        StylistVariantEntity variant = variantRepository.findById(variantId).orElse(null);
        if (variant == null) {
            return;
        }
        StylistSessionEntity session = sessionRepository.findById(variant.getSessionId()).orElse(null);
        if (session == null) {
            markVariantFailed(variant, "STYLIST_SESSION_NOT_FOUND", "Stylist session not found");
            return;
        }
        if (!aiProperties.isStylistImageConfigured()) {
            markVariantSkipped(variant, "AI image generation is not configured");
            refreshSessionStatus(session);
            return;
        }
        AvatarSnapshotEntity avatar = avatarSnapshotRepository.findById(session.getAvatarSnapshotId()).orElse(null);
        if (avatar == null || avatar.getProcessedImagePath() == null || !blobStorage.exists(avatar.getProcessedImagePath())) {
            markVariantFailed(variant, "AVATAR_NOT_READY", "Avatar image is not ready");
            refreshSessionStatus(session);
            return;
        }

        variant.setPreviewStatus("generating");
        variant.setUpdatedAt(Instant.now());
        variantRepository.save(variant);

        try {
            byte[] avatarBytes = blobStorage.readBytes(avatar.getProcessedImagePath());
            String prompt = buildPreviewPrompt(session, variant, avatar);
            NoteappAiClient.ProcessResult result = aiClient.generateStylistPreview(
                    aiProperties.getStylistImageNetwork(),
                    session.getUserId().toString(),
                    prompt,
                    Base64.getEncoder().encodeToString(avatarBytes),
                    metadata(session, variant)
            );
            if (!result.success()) {
                markVariantFailed(variant, result.errorCode(), result.errorMessage());
                refreshSessionStatus(session);
                return;
            }
            String storedPath = blobStorage.storeStylistVariantPreview(
                    session.getUserId(),
                    session.getId(),
                    variant.getVariantKey(),
                    new ByteArrayInputStream(result.imageBytes())
            );
            variant.setPreviewImagePath(storedPath);
            variant.setPreviewImageUrl("/api/v1/stylist/looks/" + session.getId() + "/variants/" + variant.getVariantKey() + "/preview");
            variant.setPreviewStatus("ready");
            variant.setProvider(result.provider());
            variant.setExternalRequestId(result.requestId());
            variant.setErrorCode(null);
            variant.setErrorMessage(null);
            variant.setUpdatedAt(Instant.now());
            variantRepository.save(variant);
        } catch (Exception ex) {
            log.warn("Stylist preview generation failed for variant {}: {}", variantId, ex.getMessage());
            markVariantFailed(variant, "AI_GENERATION_FAILED", ex.getMessage());
        }
        refreshSessionStatus(session);
    }

    private String buildPreviewPrompt(StylistSessionEntity session, StylistVariantEntity variant, AvatarSnapshotEntity avatar) {
        String base = promptTemplateService.getBodyOrDefault(
                AiPromptTemplateService.STYLIST_PREVIEW_TRYON_RU_KEY,
                "Создай фотореалистичную визуализацию полного образа на аватаре пользователя."
        );
        return base
                + "\n\nСобытие: " + session.getPresetTitle()
                + "\nСезон: " + session.getSeason()
                + "\nНаправление: " + variant.getTitle()
                + "\nОписание образа: " + variant.getStyleDirection()
                + "\nКомментарий стилиста: " + variant.getStylistComment()
                + "\nАнтропометрия: " + anthropometrySummary(avatar)
                + "\nТехнически важно: не меняй фигуру, возраст, лицо, тон кожи, позу и рост; одежда должна выглядеть как реальный комплект, покупаемый на маркетплейсе.";
    }

    private static Map<String, String> metadata(StylistSessionEntity session, StylistVariantEntity variant) {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("operation", AiOperations.STYLIST_PREVIEW);
        metadata.put("stylistSessionId", session.getId().toString());
        metadata.put("variantKey", variant.getVariantKey());
        metadata.put("presetId", session.getPresetId());
        return metadata;
    }

    private void markVariantFailed(StylistVariantEntity variant, String errorCode, String message) {
        variant.setPreviewStatus("failed");
        variant.setErrorCode(errorCode == null || errorCode.isBlank() ? "AI_GENERATION_FAILED" : errorCode);
        variant.setErrorMessage(message);
        variant.setUpdatedAt(Instant.now());
        variantRepository.save(variant);
    }

    private void markVariantSkipped(StylistVariantEntity variant, String message) {
        variant.setPreviewStatus("skipped");
        variant.setErrorCode("AI_NOT_CONFIGURED");
        variant.setErrorMessage(message);
        variant.setUpdatedAt(Instant.now());
        variantRepository.save(variant);
    }

    private void refreshSessionStatus(StylistSessionEntity session) {
        List<StylistVariantEntity> variants = variantRepository.findBySessionIdOrderBySortOrderAsc(session.getId());
        boolean anyGenerating = variants.stream().anyMatch(variant -> "queued".equals(variant.getPreviewStatus()) || "generating".equals(variant.getPreviewStatus()));
        boolean anyReady = variants.stream().anyMatch(variant -> "ready".equals(variant.getPreviewStatus()));
        boolean allTerminal = variants.stream().allMatch(variant ->
                "ready".equals(variant.getPreviewStatus()) || "failed".equals(variant.getPreviewStatus()) || "skipped".equals(variant.getPreviewStatus()));
        if (anyGenerating) {
            session.setStatus("generating");
        } else if (anyReady) {
            session.setStatus("ready");
        } else if (allTerminal) {
            session.setStatus("failed");
            session.setErrorCode("STYLIST_PREVIEW_FAILED");
            session.setErrorMessage("No stylist preview variants were generated");
        }
        session.setUpdatedAt(Instant.now());
        sessionRepository.save(session);
    }

    private static String anthropometrySummary(AvatarSnapshotEntity avatar) {
        return "heightCm=" + avatar.getHeightCm()
                + ", bustCm=" + avatar.getBustCm()
                + ", waistCm=" + avatar.getWaistCm()
                + ", hipsCm=" + avatar.getHipsCm()
                + ", shoeSizeEu=" + avatar.getShoeSizeEu()
                + ", clothingSize=" + avatar.getClothingSize();
    }
}
