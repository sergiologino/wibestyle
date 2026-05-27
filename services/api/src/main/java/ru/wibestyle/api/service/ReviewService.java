package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.ReviewEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.dto.CreateReviewRequest;
import ru.wibestyle.api.repository.ReviewRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TryOnSessionRepository tryOnSessionRepository;

    public ReviewService(ReviewRepository reviewRepository, TryOnSessionRepository tryOnSessionRepository) {
        this.reviewRepository = reviewRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
    }

    @Transactional
    public Map<String, Object> createReview(UUID userId, CreateReviewRequest request) {
        if (request.tryOnSessionId() != null) {
            TryOnSessionEntity session = tryOnSessionRepository.findByIdAndUserId(request.tryOnSessionId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("SESSION_NOT_FOUND"));
            if (session.getStatus() != TryOnSessionStatus.READY) {
                throw new IllegalArgumentException("TRYON_NOT_COMPLETED");
            }
        }

        ReviewEntity review = new ReviewEntity(
                UUID.randomUUID(),
                userId,
                request.tryOnSessionId(),
                request.rating(),
                request.body().trim(),
                request.displayName(),
                request.allowPublish(),
                Instant.now()
        );
        reviewRepository.save(review);
        return Map.of("review", toReviewMap(review));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPublished() {
        List<Map<String, Object>> items = reviewRepository.findByStatusOrderByPublishedAtDesc("published").stream()
                .map(this::toPublicReviewMap)
                .toList();
        return Map.of("items", items);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listForAdmin() {
        List<Map<String, Object>> items = reviewRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toReviewMap)
                .toList();
        return Map.of("items", items);
    }

    @Transactional
    public Map<String, Object> publish(UUID reviewId) {
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("REVIEW_NOT_FOUND"));
        if (!review.isAllowPublish()) {
            throw new IllegalArgumentException("REVIEW_PUBLISH_NOT_ALLOWED");
        }
        review.setStatus("published");
        review.setPublishedAt(Instant.now());
        reviewRepository.save(review);
        return Map.of("review", toReviewMap(review));
    }

    @Transactional
    public Map<String, Object> reject(UUID reviewId) {
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("REVIEW_NOT_FOUND"));
        review.setStatus("rejected");
        reviewRepository.save(review);
        return Map.of("review", toReviewMap(review));
    }

    @Transactional
    public Map<String, Object> updateDisplayName(UUID reviewId, String displayName) {
        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("REVIEW_NOT_FOUND"));
        review.setDisplayName(displayName.trim());
        reviewRepository.save(review);
        return Map.of("review", toReviewMap(review));
    }

    private Map<String, Object> toReviewMap(ReviewEntity review) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", review.getId().toString());
        map.put("userId", review.getUserId().toString());
        map.put("rating", review.getRating());
        map.put("body", review.getBody());
        map.put("allowPublish", review.isAllowPublish());
        map.put("status", review.getStatus());
        map.put("createdAt", review.getCreatedAt().toString());
        if (review.getDisplayName() != null) {
            map.put("displayName", review.getDisplayName());
        }
        if (review.getTryOnSessionId() != null) {
            map.put("tryOnSessionId", review.getTryOnSessionId().toString());
        }
        if (review.getPublishedAt() != null) {
            map.put("publishedAt", review.getPublishedAt().toString());
        }
        return map;
    }

    private Map<String, Object> toPublicReviewMap(ReviewEntity review) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", review.getId().toString());
        map.put("rating", review.getRating());
        map.put("body", review.getBody());
        map.put("displayName", review.getDisplayName() == null ? "Пользователь WibeStyle" : review.getDisplayName());
        map.put("publishedAt", review.getPublishedAt().toString());
        return map;
    }
}
