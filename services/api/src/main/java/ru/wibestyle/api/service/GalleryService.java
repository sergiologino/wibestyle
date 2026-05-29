package ru.wibestyle.api.service;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.domain.GalleryCommentEntity;
import ru.wibestyle.api.domain.GalleryLikeEntity;
import ru.wibestyle.api.domain.GalleryPostEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.CreateCommentRequest;
import ru.wibestyle.api.dto.CreateGalleryPostRequest;
import ru.wibestyle.api.repository.GalleryCommentRepository;
import ru.wibestyle.api.repository.GalleryLikeRepository;
import ru.wibestyle.api.repository.GalleryPostRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.storage.BlobStorage;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GalleryService {

    private static final String DEFAULT_AUTHOR = "Участник WibeStyle";

    private final GalleryPostRepository galleryPostRepository;
    private final GalleryLikeRepository galleryLikeRepository;
    private final GalleryCommentRepository galleryCommentRepository;
    private final TryOnSessionRepository tryOnSessionRepository;
    private final UserProfileRepository userProfileRepository;
    private final BlobStorage blobStorage;

    public GalleryService(
            GalleryPostRepository galleryPostRepository,
            GalleryLikeRepository galleryLikeRepository,
            GalleryCommentRepository galleryCommentRepository,
            TryOnSessionRepository tryOnSessionRepository,
            UserProfileRepository userProfileRepository,
            BlobStorage blobStorage
    ) {
        this.galleryPostRepository = galleryPostRepository;
        this.galleryLikeRepository = galleryLikeRepository;
        this.galleryCommentRepository = galleryCommentRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.userProfileRepository = userProfileRepository;
        this.blobStorage = blobStorage;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPublic() {
        List<GalleryPostEntity> posts = galleryPostRepository
                .findByVisibilityAndModerationStatusOrderByCreatedAtDesc("public", "PUBLIC");
        return Map.of("items", mapPosts(posts, false));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listMine(UUID userId) {
        List<GalleryPostEntity> posts = galleryPostRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return Map.of("items", mapPosts(posts, false));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBySlug(String slug, UUID viewerUserId) {
        GalleryPostEntity post = galleryPostRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));
        if (!"public".equals(post.getVisibility()) && !"unlisted".equals(post.getVisibility())) {
            if (viewerUserId == null || !viewerUserId.equals(post.getUserId())) {
                throw new IllegalArgumentException("POST_NOT_FOUND");
            }
        }
        if ("HIDDEN".equals(post.getModerationStatus()) && (viewerUserId == null || !viewerUserId.equals(post.getUserId()))) {
            throw new IllegalArgumentException("POST_NOT_FOUND");
        }
        boolean liked = viewerUserId != null && galleryLikeRepository.existsByPostIdAndUserId(post.getId(), viewerUserId);
        Map<String, Object> response = new HashMap<>();
        response.put("post", toMap(post, liked, resolveAuthorName(post.getUserId())));
        response.put("comments", galleryCommentRepository.findByPostIdOrderByCreatedAtAsc(post.getId()).stream().map(this::commentToMap).toList());
        return response;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> servePublicImage(UUID postId) throws IOException {
        GalleryPostEntity post = galleryPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));
        if (!isPubliclyReadable(post)) {
            throw new IllegalArgumentException("POST_NOT_FOUND");
        }

        String imageUrl = post.getImageUrl();
        if (imageUrl != null && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(imageUrl)).build();
        }

        if (post.getTryOnSessionId() != null) {
            String storedPath = blobStorage.keyTryOnResult(
                    post.getUserId(), post.getTryOnSessionId(), "after"
            );
            if (blobStorage.exists(storedPath)) {
                return serveStoredFile(storedPath);
            }
        }

        throw new IllegalArgumentException("IMAGE_NOT_FOUND");
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> servePublicVideo(UUID postId) throws IOException {
        GalleryPostEntity post = galleryPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));
        if (!isPubliclyReadable(post)) {
            throw new IllegalArgumentException("POST_NOT_FOUND");
        }

        if (post.getTryOnSessionId() != null) {
            String storedPath = blobStorage.keyTryOnVideo(
                    post.getUserId(), post.getTryOnSessionId()
            );
            if (blobStorage.exists(storedPath)) {
                Path path = blobStorage.resolveLocalFile(storedPath);
                Resource resource = new FileSystemResource(path);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"season-hit.mp4\"")
                        .contentType(MediaType.parseMediaType("video/mp4"))
                        .body(resource);
            }
        }

        throw new IllegalArgumentException("VIDEO_NOT_FOUND");
    }

    @Transactional
    public Map<String, Object> create(UUID userId, CreateGalleryPostRequest request) {
        Instant now = Instant.now();
        String slug = buildSlug(request.title());
        GalleryPostEntity post = new GalleryPostEntity(
                UUID.randomUUID(),
                userId,
                slug,
                normalizeVisibility(request.visibility()),
                "PUBLIC",
                now,
                now
        );

        if (request.tryOnSessionId() != null) {
            TryOnSessionEntity session = tryOnSessionRepository.findByIdAndUserId(request.tryOnSessionId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("SESSION_NOT_FOUND"));
            if (session.getStatus() != TryOnSessionStatus.READY) {
                throw new IllegalArgumentException("SESSION_NOT_READY");
            }
            post.setTryOnSessionId(session.getId());
            post.setImageUrl(session.getAfterImageUrl());
            if ("ready".equals(session.getVideoStatus()) && session.getAfterVideoUrl() != null) {
                post.setVideoUrl(session.getAfterVideoUrl());
                post.setMediaType("video");
            } else {
                post.setMediaType("image");
            }
            post.setTitle(request.title() != null ? request.title() : defaultTitle(session));
            post.setMarketplace(session.getMarketplace());
            post.setProductUrl(session.getProductUrl());
            post.setProductTitle(session.getProductTitle());
        } else {
            post.setTitle(request.title());
            post.setImageUrl(request.imageUrl());
            post.setMarketplace(request.marketplace());
            post.setProductUrl(request.productUrl());
            post.setProductTitle(request.productTitle());
        }

        post.setDescription(request.description());
        if (request.productLinkVisible() != null) {
            post.setProductLinkVisible(request.productLinkVisible());
        }
        if (request.productVisibility() != null) {
            post.setProductVisibility(request.productVisibility());
        }
        if (request.eliteFrame() != null) {
            post.setEliteFrame(request.eliteFrame());
        }

        galleryPostRepository.save(post);
        return Map.of("post", toMap(post, false, resolveAuthorName(userId)));
    }

    @Transactional
    public Map<String, Object> toggleLike(UUID userId, UUID postId) {
        GalleryPostEntity post = galleryPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));

        var existing = galleryLikeRepository.findByPostIdAndUserId(postId, userId);
        boolean liked;
        if (existing.isPresent()) {
            galleryLikeRepository.delete(existing.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            liked = false;
        } else {
            galleryLikeRepository.save(new GalleryLikeEntity(UUID.randomUUID(), postId, userId, Instant.now()));
            post.setLikeCount(post.getLikeCount() + 1);
            liked = true;
        }
        post.setUpdatedAt(Instant.now());
        galleryPostRepository.save(post);
        return Map.of("post", toMap(post, liked, resolveAuthorName(post.getUserId())));
    }

    @Transactional
    public Map<String, Object> addComment(UUID userId, UUID postId, CreateCommentRequest request) {
        GalleryPostEntity post = galleryPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("POST_NOT_FOUND"));

        GalleryCommentEntity comment = new GalleryCommentEntity(
                UUID.randomUUID(),
                postId,
                userId,
                request.body().trim(),
                Instant.now()
        );
        galleryCommentRepository.save(comment);
        post.setCommentCount(post.getCommentCount() + 1);
        post.setUpdatedAt(Instant.now());
        galleryPostRepository.save(post);
        return Map.of("comment", commentToMap(comment));
    }

    private List<Map<String, Object>> mapPosts(List<GalleryPostEntity> posts, boolean likedByViewer) {
        Map<UUID, String> authors = loadAuthorNames(posts);
        return posts.stream()
                .map(post -> toMap(post, likedByViewer, authors.getOrDefault(post.getUserId(), DEFAULT_AUTHOR)))
                .toList();
    }

    private Map<UUID, String> loadAuthorNames(List<GalleryPostEntity> posts) {
        List<UUID> userIds = posts.stream().map(GalleryPostEntity::getUserId).distinct().toList();
        return userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        UserProfileEntity::getUserId,
                        profile -> resolveAuthorName(profile),
                        (left, right) -> left
                ));
    }

    private String resolveAuthorName(UUID userId) {
        return userProfileRepository.findById(userId)
                .map(this::resolveAuthorName)
                .orElse(DEFAULT_AUTHOR);
    }

    private String resolveAuthorName(UserProfileEntity profile) {
        if (profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
            return profile.getDisplayName().trim();
        }
        return DEFAULT_AUTHOR;
    }

    private Map<String, Object> toMap(GalleryPostEntity post, boolean likedByViewer, String authorDisplayName) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId().toString());
        map.put("slug", post.getSlug());
        map.put("title", post.getTitle());
        map.put("description", post.getDescription());
        map.put("imageUrl", post.getImageUrl());
        map.put("videoUrl", post.getVideoUrl());
        map.put("mediaType", post.getMediaType() == null ? "image" : post.getMediaType());
        map.put("publicImageUrl", "/api/v1/gallery/posts/" + post.getId() + "/image");
        if (post.getVideoUrl() != null) {
            map.put("publicVideoUrl", "/api/v1/gallery/posts/" + post.getId() + "/video");
        }
        map.put("authorDisplayName", authorDisplayName);
        map.put("visibility", post.getVisibility());
        map.put("moderationStatus", post.getModerationStatus());
        map.put("productLinkVisible", post.isProductLinkVisible());
        map.put("productVisibility", post.getProductVisibility());
        map.put("marketplace", post.getMarketplace());
        map.put("productUrl", post.getProductUrl());
        map.put("productTitle", post.getProductTitle());
        map.put("likeCount", post.getLikeCount());
        map.put("commentCount", post.getCommentCount());
        map.put("eliteFrame", post.isEliteFrame());
        map.put("likedByViewer", likedByViewer);
        map.put("publicUrl", "/p/" + post.getSlug());
        map.put("createdAt", post.getCreatedAt().toString());
        return map;
    }

    private Map<String, Object> commentToMap(GalleryCommentEntity comment) {
        return Map.of(
                "id", comment.getId().toString(),
                "body", comment.getBody(),
                "createdAt", comment.getCreatedAt().toString()
        );
    }

    private static String normalizeVisibility(String visibility) {
        return switch (visibility) {
            case "public", "unlisted", "private" -> visibility;
            default -> "unlisted";
        };
    }

    private static String buildSlug(String title) {
        String base = title == null ? "look" : title.toLowerCase().replaceAll("[^a-z0-9а-яё]+", "-").replaceAll("^-|-$", "");
        if (base.isBlank()) base = "look";
        return base + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String defaultTitle(TryOnSessionEntity session) {
        if (session.getProductTitle() != null) {
            return session.getProductTitle();
        }
        return "Мой look";
    }

    private static boolean isPubliclyReadable(GalleryPostEntity post) {
        if ("HIDDEN".equals(post.getModerationStatus())) {
            return false;
        }
        return "public".equals(post.getVisibility()) || "unlisted".equals(post.getVisibility());
    }

    private ResponseEntity<Resource> serveStoredFile(String storedPath) throws IOException {
        Path path = blobStorage.resolveLocalFile(storedPath);
        String contentType = Files.probeContentType(path);
        MediaType mediaType = contentType == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(contentType);
        Resource resource = new FileSystemResource(path);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                .contentType(mediaType)
                .body(resource);
    }
}
