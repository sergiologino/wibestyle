package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.AvatarStatus;
import ru.wibestyle.api.domain.DomainEvents;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.CreateAvatarRequest;
import ru.wibestyle.api.ai.NoteappAiClient;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.repository.AvatarRepository;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.storage.BlobKeys;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.Base64;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AvatarService {

    public static final int MAX_AVATARS_PER_USER = 3;
    public static final String AVATAR_LIMIT_REACHED = "AVATAR_LIMIT_REACHED";
    private static final Set<String> ENHANCEABLE_WARNINGS = Set.of("POOR_LIGHTING", "BUSY_BACKGROUND", "LOW_DETAIL");

    private final AvatarRepository avatarRepository;
    private final AvatarSnapshotRepository avatarSnapshotRepository;
    private final ProfileService profileService;
    private final BlobStorage blobStorage;
    private final AvatarValidationService avatarValidationService;
    private final AvatarPreprocessService avatarPreprocessService;
    private final NoteappAiClient noteappAiClient;
    private final AiIntegrationProperties aiProperties;

    public AvatarService(
            AvatarRepository avatarRepository,
            AvatarSnapshotRepository avatarSnapshotRepository,
            ProfileService profileService,
            BlobStorage blobStorage,
            AvatarValidationService avatarValidationService,
            AvatarPreprocessService avatarPreprocessService,
            NoteappAiClient noteappAiClient,
            AiIntegrationProperties aiProperties
    ) {
        this.avatarRepository = avatarRepository;
        this.avatarSnapshotRepository = avatarSnapshotRepository;
        this.profileService = profileService;
        this.blobStorage = blobStorage;
        this.avatarValidationService = avatarValidationService;
        this.avatarPreprocessService = avatarPreprocessService;
        this.noteappAiClient = noteappAiClient;
        this.aiProperties = aiProperties;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listAvatars(UUID userId) {
        List<AvatarEntity> avatars = avatarRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, AvatarStatus.READY);
        return Map.of(
                "items", avatars.stream().map(this::toAvatarMap).toList(),
                "limit", MAX_AVATARS_PER_USER,
                "count", avatars.size()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAvatar(UUID userId, UUID avatarId) {
        return Map.of("avatar", toAvatarMap(requireAvatar(userId, avatarId)));
    }

    @Transactional
    public Map<String, Object> createAvatar(UUID userId, CreateAvatarRequest request) {
        long existing = avatarRepository.countByUserIdAndStatus(userId, AvatarStatus.READY);
        if (existing >= MAX_AVATARS_PER_USER) {
            throw new IllegalArgumentException(AVATAR_LIMIT_REACHED);
        }

        UserProfileEntity profile = profileService.requireProfile(userId);
        Instant now = Instant.now();
        AvatarEntity avatar = new AvatarEntity(
                UUID.randomUUID(),
                userId,
                AvatarStatus.DRAFT,
                false,
                privacyOrDefault(request.privacyFaceHidden(), profile.isPrivacyFaceHidden()),
                privacyOrDefault(request.privacyBackgroundHidden(), profile.isPrivacyBackgroundHidden()),
                privacyOrDefault(request.privacyFeaturesHidden(), profile.isPrivacyFeaturesHidden()),
                now,
                now
        );
        avatarRepository.save(avatar);
        return Map.of("avatar", toAvatarMap(avatar), "event", DomainEvents.AVATAR_CREATED);
    }

    @Transactional
    public Map<String, Object> uploadPhoto(UUID userId, UUID avatarId, MultipartFile photo) throws IOException {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (avatar.getStatus() == AvatarStatus.DELETED || avatar.getStatus() == AvatarStatus.REJECTED) {
            throw new IllegalArgumentException("AVATAR_NOT_EDITABLE");
        }
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("PHOTO_REQUIRED");
        }

        String rejectCode = avatarValidationService.rejectCodeForFilename(photo.getOriginalFilename());
        if (rejectCode != null) {
            throw new IllegalArgumentException(rejectCode);
        }
        rejectCode = avatarValidationService.rejectCodeForContentType(photo.getContentType());
        if (rejectCode != null) {
            throw new IllegalArgumentException(rejectCode);
        }

        String extension = extensionFromContentType(photo.getContentType());
        String storedPath = blobStorage.storeAvatarOriginal(userId, avatarId, extension, photo.getInputStream());
        avatar.setPhotoOriginalPath(storedPath);
        avatar.setStatus(AvatarStatus.PHOTO_UPLOADED);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);
        return Map.of("avatar", toAvatarMap(avatar));
    }

    @Transactional
    public Map<String, Object> validateAvatar(UUID userId, UUID avatarId) throws IOException {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (avatar.getPhotoOriginalPath() == null) {
            throw new IllegalArgumentException("PHOTO_REQUIRED");
        }

        avatar.setStatus(AvatarStatus.VALIDATING);
        avatar.setUpdatedAt(Instant.now());

        Path storedPhoto = blobStorage.resolveLocalFile(avatar.getPhotoOriginalPath());
        String filename = storedPhoto.getFileName().toString();
        long sizeBytes = Files.size(storedPhoto);
        String contentType = contentTypeFromFilename(filename);
        AvatarValidationService.ValidationOutcome outcome = avatarValidationService.validate(
                visionValidationSubject(userId, avatarId), filename, sizeBytes, contentType, storedPhoto
        );
        if (outcome.rejected()) {
            avatar.setStatus(AvatarStatus.REJECTED);
            avatar.setQualityScore(0.0);
            avatar.setQualityWarnings("[]");
            avatarRepository.save(avatar);
            throw new IllegalArgumentException(outcome.rejectCode());
        }

        avatar.setStatus(outcome.status());
        avatar.setQualityScore(outcome.qualityScore());
        avatar.setQualityWarnings(avatarValidationService.serializeWarnings(outcome.warnings()));
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);

        Map<String, Object> response = new HashMap<>();
        response.put("avatar", toAvatarMap(avatar));
        response.put("qualityScore", outcome.qualityScore());
        response.put("warnings", outcome.warnings());
        response.put("guidanceTitle", outcome.guidanceTitle());
        response.put("guidanceMessage", outcome.guidanceMessage());
        response.put("recommendedAction", outcome.recommendedAction());
        return response;
    }

    @Transactional
    public Map<String, Object> preprocessAvatar(UUID userId, UUID avatarId) throws IOException {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (avatar.getStatus() != AvatarStatus.PHOTO_UPLOADED) {
            throw new IllegalArgumentException("AVATAR_NOT_READY_FOR_PREPROCESS");
        }

        avatar.setStatus(AvatarStatus.PREPROCESSING);
        avatar.setUpdatedAt(Instant.now());
        avatarPreprocessService.preprocess(avatar);
        avatar.setStatus(AvatarStatus.READY);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);
        return Map.of("avatar", toAvatarMap(avatar));
    }

    /** Produces a preview only. The original remains immutable until the user explicitly applies the result. */
    @Transactional
    public Map<String, Object> enhanceAvatar(UUID userId, UUID avatarId) throws IOException {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (!aiProperties.isAvatarEnhanceConfigured()) {
            throw new IllegalArgumentException("AVATAR_ENHANCEMENT_NOT_CONFIGURED");
        }
        if (avatar.getPhotoOriginalPath() == null || avatar.getStatus() == AvatarStatus.VALIDATION_FAILED
                || avatar.getStatus() == AvatarStatus.REJECTED || avatar.getStatus() == AvatarStatus.DELETED) {
            throw new IllegalArgumentException("AVATAR_NOT_ELIGIBLE_FOR_ENHANCEMENT");
        }
        if (!isEnhancementRecommended(avatar)) {
            throw new IllegalArgumentException("AVATAR_ENHANCEMENT_NOT_RECOMMENDED");
        }

        Path source = blobStorage.resolveLocalFile(avatar.getPhotoOriginalPath());
        byte[] sourceBytes = Files.readAllBytes(source);
        NoteappAiClient.AvatarEnhancementResult result;
        try {
            result = noteappAiClient.enhanceAvatar(
                    aiProperties.getAvatarEnhanceNetwork(),
                    visionValidationSubject(userId, avatarId) + ":enhancement",
                    Base64.getEncoder().encodeToString(sourceBytes),
                    contentTypeFromFilename(source.getFileName().toString())
            );
        } catch (RestClientException ex) {
            throw new IllegalArgumentException("AVATAR_ENHANCEMENT_FAILED", ex);
        }
        String path = blobStorage.put(
                BlobKeys.avatarEnhanced(userId, avatarId),
                new ByteArrayInputStream(result.imageBytes())
        );
        avatar.setPhotoEnhancedPath(path);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);
        return Map.of("avatar", toAvatarMap(avatar));
    }

    @Transactional
    public Map<String, Object> applyAvatarEnhancement(UUID userId, UUID avatarId) throws IOException {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (avatar.getPhotoEnhancedPath() == null || !blobStorage.exists(avatar.getPhotoEnhancedPath())) {
            throw new IllegalArgumentException("AVATAR_ENHANCEMENT_NOT_FOUND");
        }
        avatar.setUseEnhancedPhoto(true);
        avatarPreprocessService.preprocess(avatar);
        avatar.setStatus(AvatarStatus.READY);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);
        return Map.of("avatar", toAvatarMap(avatar));
    }

    @Transactional
    public Map<String, Object> revertAvatarEnhancement(UUID userId, UUID avatarId) throws IOException {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (avatar.getPhotoOriginalPath() == null) {
            throw new IllegalArgumentException("PHOTO_REQUIRED");
        }
        avatar.setUseEnhancedPhoto(false);
        avatarPreprocessService.preprocess(avatar);
        avatar.setStatus(AvatarStatus.READY);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);
        return Map.of("avatar", toAvatarMap(avatar));
    }

    @Transactional
    public Map<String, Object> activateAvatar(UUID userId, UUID avatarId) {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (avatar.getStatus() != AvatarStatus.READY) {
            throw new IllegalArgumentException("AVATAR_NOT_READY");
        }

        UserProfileEntity profile = profileService.requireProfile(userId);
        profileService.validateRequiredAnthropometry(profile);

        avatarRepository.findByUserIdAndActiveTrue(userId).ifPresent(existing -> {
            existing.setActive(false);
            existing.setUpdatedAt(Instant.now());
            avatarRepository.save(existing);
        });

        avatar.setActive(true);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);

        AvatarSnapshotEntity snapshot = new AvatarSnapshotEntity(
                UUID.randomUUID(),
                avatar.getId(),
                userId,
                profile.getHeightCm(),
                profile.getBustCm(),
                profile.getWaistCm(),
                profile.getHipsCm(),
                profile.getShoeSizeEu(),
                profile.getClothingSize(),
                avatar.getPhotoProcessedPath(),
                avatar.isPrivacyFaceHidden(),
                avatar.isPrivacyBackgroundHidden(),
                avatar.isPrivacyFeaturesHidden(),
                avatar.getQualityScore(),
                avatar.getPipelineVersion(),
                Instant.now()
        );
        avatarSnapshotRepository.save(snapshot);

        Map<String, Object> response = new HashMap<>();
        response.put("avatar", toAvatarMap(avatar));
        response.put("snapshotId", snapshot.getId().toString());
        response.put("event", DomainEvents.AVATAR_ACTIVATED);
        return response;
    }

    @Transactional
    public Map<String, Object> deleteAvatar(UUID userId, UUID avatarId) {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        avatar.setStatus(AvatarStatus.DELETED);
        avatar.setActive(false);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);
        return Map.of("avatar", toAvatarMap(avatar));
    }

    @Transactional(readOnly = true)
    public AvatarEntity requireAvatar(UUID userId, UUID avatarId) {
        return avatarRepository.findByIdAndUserId(avatarId, userId)
                .orElseThrow(() -> new IllegalArgumentException("AVATAR_NOT_FOUND"));
    }

    private Map<String, Object> toAvatarMap(AvatarEntity avatar) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", avatar.getId().toString());
        map.put("userId", avatar.getUserId().toString());
        map.put("status", avatar.getStatus().name());
        map.put("active", avatar.isActive());
        map.put("qualityScore", avatar.getQualityScore());
        map.put("warnings", avatarValidationService.deserializeWarnings(avatar.getQualityWarnings()));
        map.put("privacyFaceHidden", avatar.isPrivacyFaceHidden());
        map.put("privacyBackgroundHidden", avatar.isPrivacyBackgroundHidden());
        map.put("privacyFeaturesHidden", avatar.isPrivacyFeaturesHidden());
        map.put("exifRemoved", avatar.isExifRemoved());
        map.put("pipelineVersion", avatar.getPipelineVersion());
        if (avatar.getPhotoOriginalPath() != null) {
            map.put("photoOriginalUrl", "/api/v1/avatars/" + avatar.getId() + "/photo?variant=original");
        }
        if (avatar.getPhotoProcessedPath() != null) {
            map.put("photoProcessedUrl", "/api/v1/avatars/" + avatar.getId() + "/photo?variant=processed");
        }
        if (avatar.getPhotoEnhancedPath() != null) {
            map.put("photoEnhancedUrl", "/api/v1/avatars/" + avatar.getId() + "/photo?variant=enhanced");
        }
        map.put("useEnhancedPhoto", avatar.isUseEnhancedPhoto());
        map.put("enhancementRecommended", isEnhancementRecommended(avatar));
        map.put("createdAt", avatar.getCreatedAt().toString());
        map.put("updatedAt", avatar.getUpdatedAt().toString());
        return map;
    }

    private static boolean privacyOrDefault(Boolean requested, boolean profileDefault) {
        return requested != null ? requested : profileDefault;
    }

    private static String contentTypeFromFilename(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private static String extensionFromContentType(String contentType) {
        if (contentType == null) {
            return ".jpg";
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/jpeg", "image/jpg" -> ".jpg";
            default -> ".jpg";
        };
    }

    private boolean isEnhancementRecommended(AvatarEntity avatar) {
        return avatarValidationService.deserializeWarnings(avatar.getQualityWarnings())
                .stream()
                .anyMatch(ENHANCEABLE_WARNINGS::contains);
    }

    /**
     * A fresh subject for every uploaded avatar prevents an upstream AI gateway from
     * accidentally reusing a previous analysis for the same account.
     */
    static String visionValidationSubject(UUID userId, UUID avatarId) {
        return userId + ":avatar:" + avatarId;
    }
}
