package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.CreateCommentRequest;
import ru.wibestyle.api.dto.CreateGalleryPostRequest;
import ru.wibestyle.api.dto.ReportGalleryPostRequest;
import ru.wibestyle.api.service.GalleryModerationService;
import ru.wibestyle.api.service.GalleryService;
import ru.wibestyle.api.support.AuthSupport;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gallery")
public class GalleryController {

    private final GalleryService galleryService;
    private final GalleryModerationService galleryModerationService;

    public GalleryController(GalleryService galleryService, GalleryModerationService galleryModerationService) {
        this.galleryService = galleryService;
        this.galleryModerationService = galleryModerationService;
    }

    @GetMapping("/posts")
    public Map<String, Object> listPublic() {
        return galleryService.listPublic();
    }

    @GetMapping("/posts/mine")
    public Map<String, Object> listMine(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return galleryService.listMine(requireUserId(authorization));
    }

    @GetMapping("/posts/{postId}/image")
    public ResponseEntity<Resource> postImage(@PathVariable UUID postId) {
        try {
            return galleryService.servePublicImage(postId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "IMAGE_NOT_FOUND", ex);
        }
    }

    @GetMapping("/posts/{postId}/video")
    public ResponseEntity<Resource> postVideo(@PathVariable UUID postId) {
        try {
            return galleryService.servePublicVideo(postId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "VIDEO_NOT_FOUND", ex);
        }
    }

    @GetMapping("/posts/slug/{slug}")
    public Map<String, Object> getBySlug(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String slug
    ) {
        UUID viewerId = tryUserId(authorization);
        try {
            return galleryService.getBySlug(slug, viewerId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    @PostMapping("/posts")
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateGalleryPostRequest request
    ) {
        try {
            return galleryService.create(requireUserId(authorization), request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    @PostMapping("/posts/{postId}/like")
    public Map<String, Object> toggleLike(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID postId
    ) {
        return galleryService.toggleLike(requireUserId(authorization), postId);
    }

    @PostMapping("/posts/{postId}/comments")
    public Map<String, Object> addComment(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return galleryService.addComment(requireUserId(authorization), postId, request);
    }

    @PostMapping("/posts/{postId}/report")
    public Map<String, Object> reportPost(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable UUID postId,
            @Valid @RequestBody ReportGalleryPostRequest request
    ) {
        return galleryModerationService.report(tryUserId(authorization), postId, request);
    }

    private UUID requireUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }

    private UUID tryUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
