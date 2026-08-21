package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.GalleryPostEntity;
import ru.wibestyle.api.domain.GalleryReportEntity;
import ru.wibestyle.api.dto.ReportGalleryPostRequest;
import ru.wibestyle.api.repository.GalleryPostRepository;
import ru.wibestyle.api.repository.GalleryReportRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GalleryModerationService {

    private static final Set<String> ALLOWED_REASONS = Set.of(
            "inappropriate", "harassment", "spam", "copyright", "other"
    );

    private final GalleryPostRepository galleryPostRepository;
    private final GalleryReportRepository galleryReportRepository;

    public GalleryModerationService(
            GalleryPostRepository galleryPostRepository,
            GalleryReportRepository galleryReportRepository
    ) {
        this.galleryPostRepository = galleryPostRepository;
        this.galleryReportRepository = galleryReportRepository;
    }

    @Transactional
    public Map<String, Object> report(UUID reporterUserId, UUID postId, ReportGalleryPostRequest request) {
        if (!ALLOWED_REASONS.contains(request.reason())) {
            throw new IllegalArgumentException("REPORT_REASON_INVALID");
        }
        galleryPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));

        GalleryReportEntity report = new GalleryReportEntity(
                UUID.randomUUID(),
                postId,
                reporterUserId,
                request.reason(),
                request.details(),
                Instant.now()
        );
        galleryReportRepository.save(report);
        return Map.of("report", toReportMap(report));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listReports(String status) {
        List<GalleryReportEntity> reports = status == null || status.isBlank()
                ? galleryReportRepository.findAllByOrderByCreatedAtDesc()
                : galleryReportRepository.findByStatusOrderByCreatedAtDesc(status.trim());
        return Map.of("items", reports.stream().map(this::toReportMap).toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPostsForModeration() {
        List<GalleryPostEntity> posts = galleryPostRepository.findTop100ByOrderByCreatedAtDesc();
        return Map.of("items", posts.stream().map(this::toModerationPostMap).toList());
    }

    @Transactional
    public Map<String, Object> deletePost(UUID postId) {
        GalleryPostEntity post = galleryPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));
        galleryPostRepository.delete(post);
        return Map.of("deleted", true, "postId", postId.toString());
    }

    @Transactional
    public Map<String, Object> cleanupDuplicateTryOnPosts(boolean dryRun) {
        List<GalleryPostEntity> posts = galleryPostRepository.findByTryOnSessionIdIsNotNullOrderByCreatedAtDesc();
        Map<String, List<GalleryPostEntity>> groups = posts.stream()
                .collect(Collectors.groupingBy(
                        this::duplicateKey,
                        LinkedHashMap::new,
                        Collectors.toCollection(ArrayList::new)
                ));

        List<Map<String, Object>> duplicateGroups = new ArrayList<>();
        List<GalleryPostEntity> toDelete = new ArrayList<>();
        groups.values().stream()
                .filter(group -> group.size() > 1)
                .forEach(group -> {
                    GalleryPostEntity keep = group.stream().max(duplicateKeeperComparator()).orElseThrow();
                    List<GalleryPostEntity> duplicates = group.stream()
                            .filter(post -> !post.getId().equals(keep.getId()))
                            .toList();
                    toDelete.addAll(duplicates);
                    duplicateGroups.add(Map.of(
                            "userId", keep.getUserId().toString(),
                            "tryOnSessionId", keep.getTryOnSessionId().toString(),
                            "mediaType", normalizeMediaType(keep.getMediaType()),
                            "keptPostId", keep.getId().toString(),
                            "deletedPostIds", duplicates.stream().map(post -> post.getId().toString()).toList(),
                            "totalInGroup", group.size()
                    ));
                });

        if (!dryRun && !toDelete.isEmpty()) {
            galleryPostRepository.deleteAll(toDelete);
        }

        return Map.of(
                "dryRun", dryRun,
                "duplicateGroups", duplicateGroups.size(),
                "postsToDelete", toDelete.size(),
                "deletedPosts", dryRun ? 0 : toDelete.size(),
                "groups", duplicateGroups
        );
    }

    @Transactional
    public Map<String, Object> hidePost(UUID postId) {
        GalleryPostEntity post = galleryPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));
        post.setModerationStatus("HIDDEN");
        post.setVisibility("private");
        post.setUpdatedAt(Instant.now());
        galleryPostRepository.save(post);

        galleryReportRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(report -> postId.equals(report.getPostId()) && "open".equals(report.getStatus()))
                .forEach(report -> {
                    report.setStatus("resolved");
                    report.setResolvedAt(Instant.now());
                    galleryReportRepository.save(report);
                });

        return Map.of("post", Map.of("id", post.getId().toString(), "moderationStatus", post.getModerationStatus()));
    }

    private Map<String, Object> toModerationPostMap(GalleryPostEntity post) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId().toString());
        map.put("slug", post.getSlug());
        map.put("title", post.getTitle());
        map.put("imageUrl", post.getImageUrl());
        map.put("publicImageUrl", "/api/v1/gallery/posts/" + post.getId() + "/image");
        map.put("visibility", post.getVisibility());
        map.put("moderationStatus", post.getModerationStatus());
        map.put("userId", post.getUserId().toString());
        map.put("createdAt", post.getCreatedAt().toString());
        return map;
    }

    private String duplicateKey(GalleryPostEntity post) {
        return post.getUserId() + ":" + post.getTryOnSessionId() + ":" + normalizeMediaType(post.getMediaType());
    }

    private static String normalizeMediaType(String mediaType) {
        return mediaType == null || mediaType.isBlank() ? "image" : mediaType;
    }

    private static Comparator<GalleryPostEntity> duplicateKeeperComparator() {
        return Comparator
                .comparingInt(GalleryModerationService::moderationRank)
                .thenComparingInt(GalleryModerationService::visibilityRank)
                .thenComparingInt(GalleryPostEntity::getLikeCount)
                .thenComparingInt(GalleryPostEntity::getCommentCount)
                .thenComparing(GalleryPostEntity::getCreatedAt);
    }

    private static int visibilityRank(GalleryPostEntity post) {
        return switch (post.getVisibility()) {
            case "public" -> 3;
            case "unlisted" -> 2;
            case "private" -> 1;
            default -> 0;
        };
    }

    private static int moderationRank(GalleryPostEntity post) {
        return "HIDDEN".equals(post.getModerationStatus()) ? 0 : 1;
    }

    private Map<String, Object> toReportMap(GalleryReportEntity report) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", report.getId().toString());
        map.put("postId", report.getPostId().toString());
        if (report.getReporterUserId() != null) {
            map.put("reporterUserId", report.getReporterUserId().toString());
        }
        map.put("reason", report.getReason());
        map.put("details", report.getDetails());
        map.put("status", report.getStatus());
        map.put("createdAt", report.getCreatedAt().toString());
        if (report.getResolvedAt() != null) {
            map.put("resolvedAt", report.getResolvedAt().toString());
        }
        return map;
    }
}
