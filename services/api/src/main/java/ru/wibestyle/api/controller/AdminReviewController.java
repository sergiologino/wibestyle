package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.dto.UpdateReviewDisplayNameRequest;
import ru.wibestyle.api.service.ReviewService;
import ru.wibestyle.api.support.AdminSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/reviews")
public class AdminReviewController {

    private final ReviewService reviewService;
    private final AdminProperties adminProperties;

    public AdminReviewController(ReviewService reviewService, AdminProperties adminProperties) {
        this.reviewService = reviewService;
        this.adminProperties = adminProperties;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "X-Admin-Key", required = false) String adminKey) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return reviewService.listForAdmin();
    }

    @PostMapping("/{reviewId}/publish")
    public Map<String, Object> publish(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID reviewId
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return reviewService.publish(reviewId);
    }

    @PostMapping("/{reviewId}/reject")
    public Map<String, Object> reject(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID reviewId
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return reviewService.reject(reviewId);
    }

    @PatchMapping("/{reviewId}/display-name")
    public Map<String, Object> updateDisplayName(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey,
            @PathVariable UUID reviewId,
            @Valid @RequestBody UpdateReviewDisplayNameRequest request
    ) {
        AdminSupport.requireAdminKey(adminKey, adminProperties);
        return reviewService.updateDisplayName(reviewId, request.displayName());
    }
}
