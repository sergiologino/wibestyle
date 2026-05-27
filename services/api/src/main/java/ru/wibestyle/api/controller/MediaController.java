package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
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
import ru.wibestyle.api.domain.MediaAssetEntity;
import ru.wibestyle.api.dto.CompleteUploadRequest;
import ru.wibestyle.api.dto.UploadUrlRequest;
import ru.wibestyle.api.service.LocalStorageService;
import ru.wibestyle.api.service.MediaService;
import ru.wibestyle.api.support.AuthSupport;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final MediaService mediaService;
    private final LocalStorageService localStorageService;

    public MediaController(MediaService mediaService, LocalStorageService localStorageService) {
        this.mediaService = mediaService;
        this.localStorageService = localStorageService;
    }

    @PostMapping("/upload-url")
    public Map<String, Object> createUploadUrl(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody UploadUrlRequest request
    ) {
        UUID userId = AuthSupport.requireUserId(authorization);
        return mediaService.createUploadUrl(userId, request);
    }

    @PostMapping("/assets/{assetId}/upload")
    public Map<String, Object> upload(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID assetId,
            @RequestParam("uploadToken") String uploadToken,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        UUID userId = AuthSupport.requireUserId(authorization);
        return mediaService.upload(userId, assetId, uploadToken, file);
    }

    @PostMapping("/complete-upload")
    public Map<String, Object> completeUpload(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CompleteUploadRequest request
    ) {
        UUID userId = AuthSupport.requireUserId(authorization);
        return mediaService.completeUpload(userId, request);
    }

    @GetMapping("/assets/{assetId}")
    public ResponseEntity<Resource> download(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID assetId,
            @RequestParam(value = "accessToken", required = false) String accessToken
    ) throws IOException {
        MediaAssetEntity asset = accessToken != null && !accessToken.isBlank()
                ? mediaService.requireReadableAssetByToken(assetId, accessToken)
                : mediaService.requireReadableAssetForOwner(AuthSupport.requireUserId(authorization), assetId);

        Path path = localStorageService.resolve(asset.getStoredPath());
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("MEDIA_NOT_FOUND");
        }

        String contentType = asset.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : asset.getContentType();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(new FileSystemResource(path));
    }
}
