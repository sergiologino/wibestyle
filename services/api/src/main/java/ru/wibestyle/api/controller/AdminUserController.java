package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.dto.AdminSubscriptionPatchRequest;
import ru.wibestyle.api.dto.UpdateProfileRequest;
import ru.wibestyle.api.repository.AdminUserRepository;
import ru.wibestyle.api.service.AdminAuditService;
import ru.wibestyle.api.service.AdminUserManagementService;
import ru.wibestyle.api.service.AdminUserSupportService;
import ru.wibestyle.api.service.TryOnStoredMediaService;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.support.AdminSupport;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AdminUserManagementService adminUserManagementService;
    private final AdminUserSupportService adminUserSupportService;
    private final TryOnStoredMediaService tryOnStoredMediaService;
    private final BlobStorage blobStorage;
    private final AdminAuditService adminAuditService;
    private final AdminProperties adminProperties;
    private final AdminUserRepository adminUserRepository;
    private final JwtService jwtService;

    public AdminUserController(
            AdminUserManagementService adminUserManagementService,
            AdminUserSupportService adminUserSupportService,
            TryOnStoredMediaService tryOnStoredMediaService,
            BlobStorage blobStorage,
            AdminAuditService adminAuditService,
            AdminProperties adminProperties,
            AdminUserRepository adminUserRepository,
            JwtService jwtService
    ) {
        this.adminUserManagementService = adminUserManagementService;
        this.adminUserSupportService = adminUserSupportService;
        this.tryOnStoredMediaService = tryOnStoredMediaService;
        this.blobStorage = blobStorage;
        this.adminAuditService = adminAuditService;
        this.adminProperties = adminProperties;
        this.adminUserRepository = adminUserRepository;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireManageUsers(adminKey, authorization);
        return adminUserManagementService.listUsers();
    }

    @GetMapping("/{userId}")
    public Map<String, Object> getUser(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId
    ) {
        requireManageUsers(adminKey, authorization);
        try {
            return adminUserSupportService.getUserDetail(userId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    @PutMapping("/{userId}/profile")
    public Map<String, Object> updateProfile(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        try {
            Map<String, Object> result = adminUserSupportService.updateProfile(userId, request);
            adminAuditService.record(actor.id(), "profile_update", "user", userId.toString(), null, null);
            return result;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @DeleteMapping("/{userId}/avatars/{avatarId}")
    public Map<String, Object> deleteAvatar(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @PathVariable UUID avatarId
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        try {
            Map<String, Object> result = adminUserSupportService.deleteAvatar(userId, avatarId);
            adminAuditService.record(actor.id(), "delete_avatar", "avatar", avatarId.toString(), userId.toString(), null);
            return result;
        } catch (IllegalArgumentException ex) {
            HttpStatus status = "AVATAR_NOT_FOUND".equals(ex.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            throw new ResponseStatusException(status, ex.getMessage(), ex);
        }
    }

    @DeleteMapping("/{userId}/try-on-sessions/{sessionId}")
    public Map<String, Object> deleteTryOnSession(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @PathVariable UUID sessionId
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        try {
            Map<String, Object> result = adminUserSupportService.deleteTryOnSession(userId, sessionId);
            adminAuditService.record(actor.id(), "delete_try_on", "try_on_session", sessionId.toString(), userId.toString(), null);
            return result;
        } catch (IllegalArgumentException ex) {
            HttpStatus status = "SESSION_NOT_FOUND".equals(ex.getMessage()) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            throw new ResponseStatusException(status, ex.getMessage(), ex);
        }
    }

    @GetMapping("/{userId}/avatars/{avatarId}/photo")
    public ResponseEntity<Resource> avatarPhoto(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @PathVariable UUID avatarId,
            @RequestParam(defaultValue = "processed") String variant
    ) {
        requireManageUsers(adminKey, authorization);
        try {
            AvatarEntity avatar = adminUserSupportService.requireAvatar(userId, avatarId);
            String storedPath = "original".equals(variant) ? avatar.getPhotoOriginalPath() : avatar.getPhotoProcessedPath();
            return serveStoredFile(storedPath);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    @GetMapping("/{userId}/try-on-sessions/{sessionId}/after-photo")
    public ResponseEntity<Resource> tryOnAfterPhoto(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @PathVariable UUID sessionId
    ) {
        requireManageUsers(adminKey, authorization);
        try {
            TryOnSessionEntity session = adminUserSupportService.requireTryOnSession(userId, sessionId);
            return serveResolvedMedia(tryOnStoredMediaService.resolveAfterPhoto(userId, sessionId, session));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    @GetMapping("/{userId}/try-on-sessions/{sessionId}/garment-photo")
    public ResponseEntity<Resource> tryOnGarmentPhoto(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @PathVariable UUID sessionId
    ) {
        requireManageUsers(adminKey, authorization);
        try {
            TryOnSessionEntity session = adminUserSupportService.requireTryOnSession(userId, sessionId);
            return serveResolvedMedia(tryOnStoredMediaService.resolveGarmentPhoto(session));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    private ResponseEntity<Resource> serveResolvedMedia(TryOnStoredMediaService.ResolvedMedia resolved) {
        if (resolved instanceof TryOnStoredMediaService.ResolvedMedia.Stored stored) {
            return serveStoredPath(stored.media().path(), stored.media().contentType());
        }
        if (resolved instanceof TryOnStoredMediaService.ResolvedMedia.Remote remote) {
            return ResponseEntity.ok()
                    .contentType(remote.media().contentType())
                    .body(new org.springframework.core.io.ByteArrayResource(remote.media().bytes()));
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PHOTO_NOT_FOUND");
    }

    private ResponseEntity<Resource> serveStoredPath(Path path, MediaType mediaType) {
        try {
            Resource resource = new FileSystemResource(path);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                    .contentType(mediaType)
                    .body(resource);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PHOTO_NOT_FOUND", ex);
        }
    }

    private ResponseEntity<Resource> serveStoredFile(String storedPath) {
        if (storedPath == null || !blobStorage.exists(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PHOTO_NOT_FOUND");
        }
        try {
            Path path = blobStorage.resolveLocalFile(storedPath);
            String contentType = Files.probeContentType(path);
            MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
            return serveStoredPath(path, mediaType);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PHOTO_NOT_FOUND", ex);
        }
    }

    @PatchMapping("/{userId}/subscription")
    public Map<String, Object> updateSubscription(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId,
            @Valid @RequestBody AdminSubscriptionPatchRequest request
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        try {
            Map<String, Object> result = adminUserManagementService.updateSubscription(
                    userId,
                    new AdminUserManagementService.AdminSubscriptionUpdateRequest(
                            request.plan(),
                            request.trialGenerationsLeft(),
                            request.planGenerationsLeft(),
                            request.billingPeriod(),
                            request.subscriptionExpiresAt()
                    )
            );
            adminAuditService.record(actor.id(), "subscription_override", "user", userId.toString(), null, request.plan());
            return result;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/{userId}/impersonate")
    public Map<String, Object> impersonate(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        AdminSupport.requireRole(actor, role -> role.canImpersonate());
        try {
            Map<String, Object> result = adminUserManagementService.impersonate(userId);
            adminAuditService.record(actor.id(), "impersonate", "user", userId.toString(), null, null);
            return result;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @DeleteMapping("/{userId}")
    public Map<String, Object> deleteUser(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID userId
    ) {
        AdminSupport.AdminActor actor = requireManageUsers(adminKey, authorization);
        try {
            Map<String, Object> result = adminUserManagementService.deleteUser(userId);
            adminAuditService.record(actor.id(), "delete_user", "user", userId.toString(), null, null);
            return result;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    private AdminSupport.AdminActor requireManageUsers(String adminKey, String authorization) {
        try {
            AdminSupport.AdminActor actor = AdminSupport.resolve(adminKey, authorization, adminProperties, jwtService, adminUserRepository);
            AdminSupport.requireRole(actor, role -> role.canManageUsers());
            return actor;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    "ADMIN_FORBIDDEN".equals(ex.getMessage()) ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED,
                    ex.getMessage(),
                    ex
            );
        }
    }
}
