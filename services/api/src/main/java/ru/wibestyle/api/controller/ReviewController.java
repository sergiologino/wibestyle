package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.dto.CreateReviewRequest;
import ru.wibestyle.api.service.ReviewService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/published")
    public Map<String, Object> listPublished() {
        return reviewService.listPublished();
    }

    @PostMapping
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        UUID userId = AuthSupport.requireUserId(authorization);
        return reviewService.createReview(userId, request);
    }
}
