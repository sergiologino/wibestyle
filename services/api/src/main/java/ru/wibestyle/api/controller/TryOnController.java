package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.dto.CreateLinkTryOnSessionRequest;
import ru.wibestyle.api.service.LocalStorageService;
import ru.wibestyle.api.service.TryOnService;
import ru.wibestyle.api.support.AuthSupport;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/try-on/sessions")
public class TryOnController {

    private final TryOnService tryOnService;
    private final LocalStorageService localStorageService;

    public TryOnController(TryOnService tryOnService, LocalStorageService localStorageService) {
        this.tryOnService = tryOnService;
        this.localStorageService = localStorageService;
    }

    @PostMapping("/link")
    public Map<String, Object> createLinkSession(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateLinkTryOnSessionRequest request
    ) {
        return tryOnService.createLinkSession(requireUserId(authorization), request.url(), request.selectedSize());
    }

    @PostMapping("/photo")
    public Map<String, Object> createPhotoSession(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("photo") MultipartFile photo,
            @RequestParam(defaultValue = "other") String category,
            @RequestParam(defaultValue = "gallery_upload") String sourceType
    ) throws IOException {
        TryOnSourceType parsedSourceType = parseSourceType(sourceType);
        return tryOnService.createPhotoSession(requireUserId(authorization), photo, category, parsedSourceType);
    }

    @PostMapping("/{sessionId}/generate")
    public Map<String, Object> generate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId
    ) {
        return tryOnService.generate(requireUserId(authorization), sessionId);
    }

    @GetMapping("/mine")
    public Map<String, Object> listMine(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return tryOnService.listMine(requireUserId(authorization));
    }

    @GetMapping("/{sessionId}")
    public Map<String, Object> getSession(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId
    ) {
        return tryOnService.getSession(requireUserId(authorization), sessionId);
    }

    @GetMapping("/{sessionId}/garment-photo")
    public ResponseEntity<Resource> garmentPhoto(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId
    ) throws IOException {
        UUID userId = requireUserId(authorization);
        TryOnSessionEntity session = tryOnService.requireSession(userId, sessionId);
        String storedPath = session.getGarmentPhotoPath();
        if (storedPath == null || !localStorageService.exists(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }

        return serveStoredFile(storedPath);
    }

    @GetMapping("/{sessionId}/after-photo")
    public ResponseEntity<Resource> afterPhoto(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId
    ) throws IOException {
        UUID userId = requireUserId(authorization);
        tryOnService.requireSession(userId, sessionId);
        String storedPath = localStorageService.resolveTryOnResultPath(userId, sessionId, "after");
        if (!localStorageService.exists(storedPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        return serveStoredFile(storedPath);
    }

    private ResponseEntity<Resource> serveStoredFile(String storedPath) throws IOException {
        Path path = localStorageService.resolve(storedPath);
        String contentType = Files.probeContentType(path);
        MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                .contentType(mediaType)
                .body(new FileSystemResource(path));
    }

    private UUID requireUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }

    private static TryOnSourceType parseSourceType(String sourceType) {
        return switch (sourceType) {
            case "garment_photo" -> TryOnSourceType.GARMENT_PHOTO;
            case "gallery_upload" -> TryOnSourceType.GALLERY_UPLOAD;
            default -> TryOnSourceType.GALLERY_UPLOAD;
        };
    }
}
