package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import ru.wibestyle.api.domain.GalleryPostEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GalleryPostRepository extends JpaRepository<GalleryPostEntity, UUID> {

    List<GalleryPostEntity> findByVisibilityOrderByCreatedAtDesc(String visibility);

    List<GalleryPostEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<GalleryPostEntity> findByVisibilityAndModerationStatusOrderByCreatedAtDesc(String visibility, String moderationStatus);

    List<GalleryPostEntity> findByVisibilityAndModerationStatusOrderByCreatedAtDesc(String visibility, String moderationStatus, Pageable pageable);

    @Query("""
            select post from GalleryPostEntity post
            where post.visibility = :visibility
              and (post.moderationStatus is null or post.moderationStatus <> 'HIDDEN')
            order by post.createdAt desc
            """)
    List<GalleryPostEntity> findPublicVisible(String visibility, Pageable pageable);

    Optional<GalleryPostEntity> findBySlug(String slug);

    List<GalleryPostEntity> findTop100ByOrderByCreatedAtDesc();

    java.util.List<GalleryPostEntity> findAllByTryOnSessionIdOrderByCreatedAtDesc(UUID tryOnSessionId);
}
