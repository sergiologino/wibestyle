package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.GalleryPostEntity;
import ru.wibestyle.api.domain.GalleryReportEntity;
import ru.wibestyle.api.dto.ReportGalleryPostRequest;
import ru.wibestyle.api.repository.GalleryPostRepository;
import ru.wibestyle.api.repository.GalleryReportRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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
