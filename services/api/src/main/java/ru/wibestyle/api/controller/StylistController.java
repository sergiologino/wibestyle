package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.CreateStylistLookRequest;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.service.StylistService;
import ru.wibestyle.api.support.AuthSupport;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/stylist")
public class StylistController {

    private static final CacheControl PRIVATE_MEDIA_CACHE = CacheControl.maxAge(7, TimeUnit.DAYS).cachePrivate();

    private final StylistService stylistService;
    private final BlobStorage blobStorage;

    public StylistController(StylistService stylistService, BlobStorage blobStorage) {
        this.stylistService = stylistService;
        this.blobStorage = blobStorage;
    }

    @GetMapping("/presets")
    public Map<String, Object> presets(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UUID userId = requireUser(authorization);
        try {
            return stylistService.listPresets(userId);
        } catch (IllegalArgumentException ex) {
            throw status(ex);
        }
    }

    @PostMapping("/looks")
    public Map<String, Object> createLook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateStylistLookRequest request
    ) {
        UUID userId = requireUser(authorization);
        try {
            return stylistService.createLook(userId, request.presetId());
        } catch (IllegalArgumentException ex) {
            throw status(ex);
        }
    }

    @GetMapping("/looks/{sessionId}")
    public Map<String, Object> getLook(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId
    ) {
        UUID userId = requireUser(authorization);
        try {
            return stylistService.getLook(userId, sessionId);
        } catch (IllegalArgumentException ex) {
            throw status(ex);
        }
    }

    @PostMapping("/looks/{sessionId}/variants/{variantKey}/select")
    public Map<String, Object> selectVariant(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId,
            @PathVariable String variantKey
    ) {
        UUID userId = requireUser(authorization);
        try {
            return stylistService.selectVariant(userId, sessionId, variantKey);
        } catch (IllegalArgumentException ex) {
            throw status(ex);
        }
    }

    @PostMapping("/looks/{sessionId}/variants/{variantKey}/products/search")
    public Map<String, Object> searchProducts(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId,
            @PathVariable String variantKey
    ) {
        UUID userId = requireUser(authorization);
        try {
            return stylistService.searchProductsForVariant(userId, sessionId, variantKey);
        } catch (IllegalArgumentException ex) {
            throw status(ex);
        }
    }

    @GetMapping("/looks/{sessionId}/variants/{variantKey}/preview")
    public ResponseEntity<Resource> variantPreview(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID sessionId,
            @PathVariable String variantKey
    ) throws IOException {
        UUID userId = requireUser(authorization);
        String storedPath;
        try {
            storedPath = stylistService.requirePreviewPath(userId, sessionId, variantKey);
        } catch (IllegalArgumentException ex) {
            throw status(ex);
        }
        Path path = blobStorage.resolveLocalFile(storedPath);
        String contentType = Files.probeContentType(path);
        MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                .cacheControl(PRIVATE_MEDIA_CACHE)
                .contentType(mediaType)
                .body(new FileSystemResource(path));
    }

    private static UUID requireUser(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }

    private static ResponseStatusException status(IllegalArgumentException ex) {
        return switch (ex.getMessage()) {
            case "STYLIST_DISABLED" -> new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage(), ex);
            case "AVATAR_NOT_READY" -> new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
            case "INVALID_STYLIST_PRESET" -> new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
            case "INVALID_STYLIST_VARIANT" -> new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
            case "STYLIST_SESSION_NOT_FOUND" -> new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
            case "STYLIST_PREVIEW_NOT_READY" -> new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
            default -> new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        };
    }
}
