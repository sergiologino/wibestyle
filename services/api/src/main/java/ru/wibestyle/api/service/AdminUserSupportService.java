package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.domain.AvatarStatus;
import ru.wibestyle.api.domain.GalleryPostEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.dto.UpdateProfileRequest;
import ru.wibestyle.api.repository.AvatarRepository;
import ru.wibestyle.api.repository.GalleryPostRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserRepository;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminUserSupportService {

    public static final String LAST_AVATAR_CANNOT_DELETE = "LAST_AVATAR_CANNOT_DELETE";

    private final UserRepository userRepository;
    private final ProfileService profileService;
    private final AvatarService avatarService;
    private final AvatarRepository avatarRepository;
    private final TryOnSessionRepository tryOnSessionRepository;
    private final GalleryPostRepository galleryPostRepository;
    private final BlobStorage blobStorage;
    private final AvatarValidationService avatarValidationService;

    public AdminUserSupportService(
            UserRepository userRepository,
            ProfileService profileService,
            AvatarService avatarService,
            AvatarRepository avatarRepository,
            TryOnSessionRepository tryOnSessionRepository,
            GalleryPostRepository galleryPostRepository,
            BlobStorage blobStorage,
            AvatarValidationService avatarValidationService
    ) {
        this.userRepository = userRepository;
        this.profileService = profileService;
        this.avatarService = avatarService;
        this.avatarRepository = avatarRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.galleryPostRepository = galleryPostRepository;
        this.blobStorage = blobStorage;
        this.avatarValidationService = avatarValidationService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserDetail(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        profileService.ensureProfile(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("user", toUserMap(user));
        response.put("profile", profileService.getProfile(userId).get("profile"));
        response.put("avatars", listAvatarsForAdmin(userId));
        response.put("tryOnSessions", listTryOnSessionsForAdmin(userId));
        return response;
    }

    @Transactional
    public Map<String, Object> updateProfile(UUID userId, UpdateProfileRequest request) {
        requireUser(userId);
        return profileService.updateProfile(userId, request);
    }

    @Transactional
    public Map<String, Object> deleteAvatar(UUID userId, UUID avatarId) {
        requireUser(userId);
        List<AvatarEntity> activeAvatars = avatarRepository.findByUserIdAndStatusNotOrderByCreatedAtDesc(
                userId,
                AvatarStatus.DELETED
        );
        if (activeAvatars.size() <= 1) {
            throw new IllegalArgumentException(LAST_AVATAR_CANNOT_DELETE);
        }
        return avatarService.deleteAvatar(userId, avatarId);
    }

    @Transactional
    public Map<String, Object> deleteTryOnSession(UUID userId, UUID sessionId) {
        requireUser(userId);
        TryOnSessionEntity session = tryOnSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("SESSION_NOT_FOUND"));

        galleryPostRepository.findByTryOnSessionId(sessionId).ifPresent(galleryPostRepository::delete);
        tryOnSessionRepository.delete(session);

        try {
            blobStorage.deleteTryOnSessionFolder(userId, sessionId);
        } catch (IOException ex) {
            throw new IllegalArgumentException("ACCOUNT_DELETE_FAILED");
        }

        return Map.of("deleted", true, "sessionId", sessionId.toString());
    }

    @Transactional(readOnly = true)
    public AvatarEntity requireAvatar(UUID userId, UUID avatarId) {
        requireUser(userId);
        return avatarService.requireAvatar(userId, avatarId);
    }

    @Transactional(readOnly = true)
    public TryOnSessionEntity requireTryOnSession(UUID userId, UUID sessionId) {
        requireUser(userId);
        return tryOnSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new IllegalArgumentException("SESSION_NOT_FOUND"));
    }

    private void requireUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("USER_NOT_FOUND");
        }
    }

    private Map<String, Object> listAvatarsForAdmin(UUID userId) {
        List<Map<String, Object>> items = avatarRepository
                .findByUserIdAndStatusNotOrderByCreatedAtDesc(userId, AvatarStatus.DELETED)
                .stream()
                .map(avatar -> toAdminAvatarMap(userId, avatar))
                .toList();
        return Map.of("items", items);
    }

    private Map<String, Object> listTryOnSessionsForAdmin(UUID userId) {
        List<Map<String, Object>> items = tryOnSessionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(session -> toAdminTryOnMap(userId, session))
                .toList();
        return Map.of("items", items);
    }

    private Map<String, Object> toUserMap(UserEntity user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId().toString());
        if (user.getPhone() != null) map.put("phone", user.getPhone());
        if (user.getEmail() != null) map.put("email", user.getEmail());
        if (user.getLogin() != null) map.put("login", user.getLogin());
        map.put("primaryAuth", user.getPrimaryAuth());
        map.put("createdAt", user.getCreatedAt().toString());
        return map;
    }

    private Map<String, Object> toAdminAvatarMap(UUID userId, AvatarEntity avatar) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", avatar.getId().toString());
        map.put("status", avatar.getStatus().name());
        map.put("active", avatar.isActive());
        map.put("qualityScore", avatar.getQualityScore());
        map.put("warnings", avatarValidationService.deserializeWarnings(avatar.getQualityWarnings()));
        map.put("createdAt", avatar.getCreatedAt().toString());
        if (avatar.getPhotoOriginalPath() != null) {
            map.put("adminOriginalPhotoUrl",
                    "/api/v1/admin/users/" + userId + "/avatars/" + avatar.getId() + "/photo?variant=original");
        }
        if (avatar.getPhotoProcessedPath() != null) {
            map.put("adminProcessedPhotoUrl",
                    "/api/v1/admin/users/" + userId + "/avatars/" + avatar.getId() + "/photo?variant=processed");
        }
        return map;
    }

    private Map<String, Object> toAdminTryOnMap(UUID userId, TryOnSessionEntity session) {
        Map<String, Object> map = new HashMap<>();
        UUID sessionId = session.getId();
        map.put("sessionId", sessionId.toString());
        map.put("status", session.getStatus().name().toLowerCase());
        map.put("sourceType", sourceTypeJson(session.getSourceType()));
        map.put("visibility", session.getVisibility());
        map.put("productTitle", session.getProductTitle() != null ? session.getProductTitle() : "Примерка");
        map.put("productUrl", session.getProductUrl());
        map.put("marketplace", session.getMarketplace());
        map.put("selectedSize", session.getSelectedSize());
        map.put("errorCode", session.getErrorCode());
        map.put("errorMessage", session.getErrorMessage());
        map.put("createdAt", session.getCreatedAt().toString());

        galleryPostRepository.findByTryOnSessionId(sessionId).ifPresent(post -> {
            map.put("galleryPostId", post.getId().toString());
            map.put("galleryVisibility", post.getVisibility());
        });

        if (session.getStatus() == TryOnSessionStatus.READY && session.getAfterImageUrl() != null) {
            map.put("adminAfterPhotoUrl",
                    "/api/v1/admin/users/" + userId + "/try-on-sessions/" + sessionId + "/after-photo");
        }
        if (session.getGarmentPhotoPath() != null) {
            map.put("adminGarmentPhotoUrl",
                    "/api/v1/admin/users/" + userId + "/try-on-sessions/" + sessionId + "/garment-photo");
        }
        return map;
    }

    private static String sourceTypeJson(TryOnSourceType sourceType) {
        return switch (sourceType) {
            case MARKETPLACE_LINK -> "marketplace_link";
            case GARMENT_PHOTO -> "garment_photo";
            case GALLERY_UPLOAD -> "gallery_upload";
        };
    }
}
