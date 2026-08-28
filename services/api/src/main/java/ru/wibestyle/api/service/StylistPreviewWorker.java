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
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;
import ru.wibestyle.api.repository.StylistSessionRepository;
import ru.wibestyle.api.repository.StylistVariantRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.storage.BlobKeys;
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
    private final TryOnSessionRepository tryOnSessionRepository;
    private final AvatarSnapshotRepository avatarSnapshotRepository;
    private final AiPromptTemplateService promptTemplateService;
    private final NoteappAiClient aiClient;
    private final AiIntegrationProperties aiProperties;
    private final BlobStorage blobStorage;

    public StylistPreviewWorker(
            StylistSessionRepository sessionRepository,
            StylistVariantRepository variantRepository,
            TryOnSessionRepository tryOnSessionRepository,
            AvatarSnapshotRepository avatarSnapshotRepository,
            AiPromptTemplateService promptTemplateService,
            NoteappAiClient aiClient,
            AiIntegrationProperties aiProperties,
            BlobStorage blobStorage
    ) {
        this.sessionRepository = sessionRepository;
        this.variantRepository = variantRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
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
        log.info("Stylist preview worker started variantId={}", variantId);
        StylistVariantEntity variant = variantRepository.findById(variantId).orElse(null);
        if (variant == null) {
            log.warn("Stylist preview worker skipped: variant not found variantId={}", variantId);
            return;
        }
        StylistSessionEntity session = sessionRepository.findById(variant.getSessionId()).orElse(null);
        if (session == null) {
            log.warn("Stylist preview worker failed: session not found variantId={} sessionId={}", variantId, variant.getSessionId());
            markVariantFailed(variant, "STYLIST_SESSION_NOT_FOUND", "Stylist session not found");
            return;
        }
        if (!aiProperties.isStylistImageConfigured()) {
            log.warn("Stylist preview worker skipped: image generation is not configured enabled={} apiKeyPresent={} network='{}'",
                    aiProperties.isEnabled(),
                    aiProperties.getApiKey() != null && !aiProperties.getApiKey().isBlank(),
                    aiProperties.getStylistImageNetwork());
            markVariantSkipped(variant, "AI image generation is not configured");
            refreshSessionStatus(session);
            return;
        }
        AvatarSnapshotEntity avatar = avatarSnapshotRepository.findById(session.getAvatarSnapshotId()).orElse(null);
        if (avatar == null || avatar.getProcessedImagePath() == null || !blobStorage.exists(avatar.getProcessedImagePath())) {
            log.warn("Stylist preview worker failed before AI call: avatar not ready variantId={} sessionId={} avatarSnapshotId={} processedPath={}",
                    variantId,
                    session.getId(),
                    session.getAvatarSnapshotId(),
                    avatar == null ? null : avatar.getProcessedImagePath());
            markVariantFailed(variant, "AVATAR_NOT_READY", "Avatar image is not ready");
            refreshSessionStatus(session);
            return;
        }

        variant.setPreviewStatus("generating");
        variant.setUpdatedAt(Instant.now());
        variantRepository.save(variant);

        try {
            byte[] avatarBytes = blobStorage.readBytes(avatar.getProcessedImagePath());
            byte[] portraitBytes = readHairstylePortraitOrAvatar(session, avatarBytes);
            String prompt = buildPreviewPrompt(session, variant, avatar);
            log.info("Stylist preview AI call variantId={} sessionId={} network={} promptLength={} avatarBytes={} portraitBytes={}",
                    variantId,
                    session.getId(),
                    aiProperties.getStylistImageNetwork(),
                    prompt.length(),
                    avatarBytes.length,
                    portraitBytes.length);
            NoteappAiClient.ProcessResult result = aiClient.generateStylistPreview(
                    aiProperties.getStylistImageNetwork(),
                    session.getUserId().toString(),
                    prompt,
                    Base64.getEncoder().encodeToString(avatarBytes),
                    Base64.getEncoder().encodeToString(portraitBytes),
                    metadata(session, variant)
            );
            if (!result.success()) {
                markVariantFailed(variant, result.errorCode(), result.errorMessage());
                refreshSessionStatus(session);
                return;
            }
            if (result.imageBytes() != null && result.imageBytes().length > 0) {
                String storedPath = blobStorage.storeStylistVariantPreview(
                        session.getUserId(),
                        session.getId(),
                        variant.getVariantKey(),
                        new ByteArrayInputStream(result.imageBytes())
                );
                variant.setPreviewImagePath(storedPath);
                variant.setPreviewImageUrl("/api/v1/stylist/looks/" + session.getId() + "/variants/" + variant.getVariantKey() + "/preview");
            } else if (result.imageUrl() != null && !result.imageUrl().isBlank()) {
                variant.setPreviewImagePath(null);
                variant.setPreviewImageUrl(result.imageUrl());
            } else {
                markVariantFailed(variant, "AI_GENERATION_FAILED", "Stylist preview generation returned no image");
                refreshSessionStatus(session);
                return;
            }
            variant.setPreviewStatus("ready");
            variant.setProvider(result.provider());
            variant.setExternalRequestId(result.requestId());
            variant.setErrorCode(null);
            variant.setErrorMessage(null);
            variant.setUpdatedAt(Instant.now());
            variantRepository.save(variant);
            saveStylistIdeaTryOn(session, variant, avatar, avatarBytes, result);
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
                + "\n\nLOCATION AND MOOD: " + locationInstruction(session, variant)
                + "\n\nTECHNICAL INSTRUCTIONS: image1 is the full-body customer avatar and the main source for body, proportions, pose and identity. image2 is the customer's hairstyle portrait reference; use it only to preserve face and hair details, not as a clothing reference. Create the complete outfit from the text style brief. Generate a realistic full-body 3:4 fashion try-on photo of the same human customer. Do not create animals, foxes, mascots, fantasy characters, forest scenes, bushes or wilderness. Do not replace the person, face, body, pose, age, skin tone or silhouette. The clothes, shoes and accessories must look like a real marketplace outfit.";
    }

    private void saveStylistIdeaTryOn(
            StylistSessionEntity stylistSession,
            StylistVariantEntity variant,
            AvatarSnapshotEntity avatar,
            byte[] avatarBytes,
            NoteappAiClient.ProcessResult result
    ) throws Exception {
        UUID tryOnSessionId = UUID.randomUUID();
        blobStorage.storeTryOnResult(stylistSession.getUserId(), tryOnSessionId, "before", new ByteArrayInputStream(avatarBytes));
        String afterImageUrl = result.imageUrl();
        if (result.imageBytes() != null && result.imageBytes().length > 0) {
            blobStorage.storeTryOnResult(stylistSession.getUserId(), tryOnSessionId, "after", new ByteArrayInputStream(result.imageBytes()));
            afterImageUrl = "/api/v1/try-on/sessions/" + tryOnSessionId + "/after-photo";
        }
        Instant now = Instant.now();
        TryOnSessionEntity tryOnSession = new TryOnSessionEntity(
                tryOnSessionId,
                stylistSession.getUserId(),
                avatar.getId(),
                TryOnSourceType.STYLIST_IDEA,
                TryOnSessionStatus.READY,
                now,
                now
        );
        tryOnSession.setMarketplace("other");
        tryOnSession.setExternalProductId("stylist:" + stylistSession.getId() + ":" + variant.getVariantKey());
        tryOnSession.setProductTitle("Идея стилиста: " + stylistSession.getPresetTitle() + " - " + variant.getTitle());
        tryOnSession.setProductBrand("AI-стилист");
        tryOnSession.setProductImageUrl(variant.getPreviewImageUrl());
        tryOnSession.setProductSizes("[]");
        tryOnSession.setBeforeImageUrl("/api/v1/try-on/sessions/" + tryOnSessionId + "/before-photo");
        tryOnSession.setAfterImageUrl(afterImageUrl);
        tryOnSession.setStyleCompliment(limitText("Идея стилиста. " + variant.getStylistComment(), 512));
        tryOnSessionRepository.save(tryOnSession);
    }

    private static String limitText(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 1)).stripTrailing() + "…";
    }

    private static String locationInstruction(StylistSessionEntity session, StylistVariantEntity variant) {
        String eventScene = switch (session.getPresetId()) {
            case "date" -> "romantic city evening, warm restaurant entrance, quiet cocktail bar or softly lit walk after dinner";
            case "office" -> "modern office lobby, business district street, glass-and-stone architecture, composed professional light";
            case "interview" -> "calm corporate reception, clean conference center corridor, understated confidence, no visual noise";
            case "wedding_guest" -> "elegant wedding venue terrace, hotel ballroom foyer, summer garden reception, festive but not bridal";
            case "party" -> "loud energetic warehouse party, club lights, bold nightlife atmosphere, industrial edge, like a high-energy Prodigy track without showing text or performers";
            case "vacation" -> "resort promenade, coastal cafe, airport-to-city travel mood, sunlit but practical and relaxed";
            case "photoshoot" -> "editorial fashion location with controlled light, architectural backdrop, strong readable silhouette";
            case "city_weekend" -> "stylish urban weekend street, coffee-to-gallery route, relaxed movement and natural daylight";
            default -> "realistic fashion location matching the event";
        };
        String styleMood = switch (variant.getVariantKey()) {
            case "classic" -> "Keep the location restrained, elegant, balanced and quiet; premium natural light, minimal distractions.";
            case "modern" -> "Make the location brighter, more polished and expressive; contemporary fashion-week street style energy, richer color accents and a more cinematic setting.";
            case "rebel" -> "Make the location sharper, more provocative and high-contrast; nightlife, industrial, graphic light, confident attitude, but still realistic.";
            default -> "Match the location mood to the selected style direction.";
        };
        return eventScene + ". " + styleMood;
    }

    private byte[] readHairstylePortraitOrAvatar(StylistSessionEntity session, byte[] avatarBytes) {
        String portraitPath = BlobKeys.hairstylePortrait(session.getUserId());
        if (!blobStorage.exists(portraitPath)) {
            return avatarBytes;
        }
        try {
            return blobStorage.readBytes(portraitPath);
        } catch (Exception ex) {
            log.warn("Stylist preview portrait read failed, using avatar as second image sessionId={} path={}: {}",
                    session.getId(),
                    portraitPath,
                    ex.getMessage());
            return avatarBytes;
        }
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
