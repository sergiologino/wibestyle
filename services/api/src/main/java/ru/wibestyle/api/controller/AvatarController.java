package ru.wibestyle.api.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.dto.CreateAvatarRequest;
import ru.wibestyle.api.service.AvatarService;
import ru.wibestyle.api.service.LocalStorageService;
import ru.wibestyle.api.support.AuthSupport;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/avatars")
public class AvatarController {

    private final AvatarService avatarService;
    private final LocalStorageService localStorageService;

    public AvatarController(AvatarService avatarService, LocalStorageService localStorageService) {
        this.avatarService = avatarService;
        this.localStorageService = localStorageService;
    }

    @GetMapping
    public Map<String, Object> listAvatars(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return avatarService.listAvatars(requireUserId(authorization));
    }

    @PostMapping
    public Map<String, Object> createAvatar(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) CreateAvatarRequest request
    ) {
        CreateAvatarRequest payload = request == null ? new CreateAvatarRequest(null, null, null) : request;
        return avatarService.createAvatar(requireUserId(authorization), payload);
    }

    @GetMapping("/{avatarId}")
    public Map<String, Object> getAvatar(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID avatarId
    ) {
        return avatarService.getAvatar(requireUserId(authorization), avatarId);
    }

    @PostMapping("/{avatarId}/photo")
    public Map<String, Object> uploadPhoto(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID avatarId,
            @RequestParam("photo") MultipartFile photo
    ) throws IOException {
        return avatarService.uploadPhoto(requireUserId(authorization), avatarId, photo);
    }

    @GetMapping("/{avatarId}/photo")
    public ResponseEntity<Resource> downloadPhoto(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID avatarId,
            @RequestParam(defaultValue = "processed") String variant
    ) throws IOException {
        UUID userId = requireUserId(authorization);
        AvatarEntity avatar = avatarService.requireAvatar(userId, avatarId);
        String storedPath = "original".equals(variant) ? avatar.getPhotoOriginalPath() : avatar.getPhotoProcessedPath();
        if (storedPath == null || !localStorageService.exists(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }

        Path path = localStorageService.resolve(storedPath);
        String contentType = Files.probeContentType(path);
        MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
        Resource resource = new FileSystemResource(path);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                .contentType(mediaType)
                .body(resource);
    }

    @PostMapping("/{avatarId}/validate")
    public Map<String, Object> validateAvatar(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID avatarId
    ) throws IOException {
        return avatarService.validateAvatar(requireUserId(authorization), avatarId);
    }

    @PostMapping("/{avatarId}/preprocess")
    public Map<String, Object> preprocessAvatar(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID avatarId
    ) throws IOException {
        return avatarService.preprocessAvatar(requireUserId(authorization), avatarId);
    }

    @PostMapping("/{avatarId}/activate")
    public Map<String, Object> activateAvatar(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID avatarId
    ) {
        return avatarService.activateAvatar(requireUserId(authorization), avatarId);
    }

    @DeleteMapping("/{avatarId}")
    public Map<String, Object> deleteAvatar(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID avatarId
    ) {
        return avatarService.deleteAvatar(requireUserId(authorization), avatarId);
    }

    private UUID requireUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }
}
