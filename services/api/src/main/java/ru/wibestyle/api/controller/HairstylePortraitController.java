package ru.wibestyle.api.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ru.wibestyle.api.storage.BlobKeys;
import ru.wibestyle.api.storage.BlobStorage;
import ru.wibestyle.api.support.AuthSupport;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile/hairstyle-portrait")
public class HairstylePortraitController {
    private final BlobStorage storage;

    public HairstylePortraitController(BlobStorage storage) {
        this.storage = storage;
    }

    @GetMapping
    public Map<String, Object> get(@RequestHeader(value = "Authorization", required = false) String authorization) {
        UUID userId = user(authorization);
        boolean exists = storage.exists(BlobKeys.hairstylePortrait(userId));
        return Map.of(
                "exists", exists,
                "imageUrl", exists ? "/api/v1/profile/hairstyle-portrait/image" : ""
        );
    }

    @PostMapping
    public Map<String, Object> upload(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam MultipartFile portrait
    ) throws Exception {
        UUID userId = user(authorization);
        if (portrait.isEmpty() || portrait.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("PORTRAIT_INVALID");
        }
        storage.put(BlobKeys.hairstylePortrait(userId), portrait.getInputStream());
        return Map.of("exists", true, "imageUrl", "/api/v1/profile/hairstyle-portrait/image");
    }

    @GetMapping("/image")
    public ResponseEntity<Resource> image(@RequestHeader(value = "Authorization", required = false) String authorization) throws Exception {
        UUID userId = user(authorization);
        Path path = storage.resolveLocalFile(BlobKeys.hairstylePortrait(userId));
        String contentType = Files.probeContentType(path);
        return ResponseEntity.ok()
                .contentType(contentType == null ? MediaType.IMAGE_JPEG : MediaType.parseMediaType(contentType))
                .body(new FileSystemResource(path));
    }

    private UUID user(String authorization) {
        return AuthSupport.requireUserId(authorization);
    }
}
