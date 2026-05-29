package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;
import ru.wibestyle.api.domain.AvatarStatus;
import ru.wibestyle.api.domain.DomainEvents;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.CreateAvatarRequest;
import ru.wibestyle.api.repository.AvatarRepository;
import ru.wibestyle.api.repository.AvatarSnapshotRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AvatarService {

    public static final int MAX_AVATARS_PER_USER = 3;
    public static final String AVATAR_LIMIT_REACHED = "AVATAR_LIMIT_REACHED";

    private final AvatarRepository avatarRepository;
    private final AvatarSnapshotRepository avatarSnapshotRepository;
    private final ProfileService profileService;
    private final BlobStorage blobStorage;
    private final AvatarValidationService avatarValidationService;
    private final AvatarPreprocessService avatarPreprocessService;

    public AvatarService(
            AvatarRepository avatarRepository,
            AvatarSnapshotRepository avatarSnapshotRepository,
            ProfileService profileService,
            BlobStorage blobStorage,
            AvatarValidationService avatarValidationService,
            AvatarPreprocessService avatarPreprocessService
    ) {
        this.avatarRepository = avatarRepository;
        this.avatarSnapshotRepository = avatarSnapshotRepository;
        this.profileService = profileService;
        this.blobStorage = blobStorage;
        this.avatarValidationService = avatarValidationService;
        this.avatarPreprocessService = avatarPreprocessService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listAvatars(UUID userId) {
        List<AvatarEntity> avatars = avatarRepository.findByUserIdAndStatusNotOrderByCreatedAtDesc(userId, AvatarStatus.DELETED);
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
        long existing = avatarRepository.countByUserIdAndStatusNot(userId, AvatarStatus.DELETED);
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
        AvatarValidationService.ValidationOutcome outcome = avatarValidationService.validate(filename, sizeBytes, contentType);
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
        return response;
    }

    @Transactional
    public Map<String, Object> preprocessAvatar(UUID userId, UUID avatarId) throws IOException {
        AvatarEntity avatar = requireAvatar(userId, avatarId);
        if (avatar.getStatus() != AvatarStatus.PHOTO_UPLOADED && avatar.getStatus() != AvatarStatus.VALIDATION_FAILED) {
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
}
