package ru.wibestyle.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.service.AdminAuditService;
import ru.wibestyle.api.service.GalleryModerationService;
import ru.wibestyle.api.support.AdminActions;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/gallery")
public class AdminGalleryController {

    private final GalleryModerationService galleryModerationService;
    private final AdminAuditService adminAuditService;
    private final AdminProperties adminProperties;

    public AdminGalleryController(
            GalleryModerationService galleryModerationService,
            AdminAuditService adminAuditService,
            AdminProperties adminProperties
    ) {
        this.galleryModerationService = galleryModerationService;
        this.adminAuditService = adminAuditService;
        this.adminProperties = adminProperties;
    }

    @GetMapping("/reports")
    public Map<String, Object> listReports(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @RequestParam(required = false) String status
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return galleryModerationService.listReports(status);
    }

    @GetMapping("/posts")
    public Map<String, Object> listPosts(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return galleryModerationService.listPostsForModeration();
    }

    @PostMapping("/posts/{postId}/hide")
    public Map<String, Object> hidePost(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID postId,
            HttpServletRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        Map<String, Object> response = galleryModerationService.hidePost(postId);
        AdminActions.audit(adminAuditService, adminKey, adminProperties, request, "hide", "gallery_post", postId.toString(), null);
        return response;
    }

    @DeleteMapping("/posts/{postId}")
    public Map<String, Object> deletePost(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID postId,
            HttpServletRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        Map<String, Object> response = galleryModerationService.deletePost(postId);
        AdminActions.audit(adminAuditService, adminKey, adminProperties, request, "delete", "gallery_post", postId.toString(), null);
        return response;
    }
}
