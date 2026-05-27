package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.GalleryPostEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GalleryPostRepository extends JpaRepository<GalleryPostEntity, UUID> {

    List<GalleryPostEntity> findByVisibilityOrderByCreatedAtDesc(String visibility);

    List<GalleryPostEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<GalleryPostEntity> findByVisibilityAndModerationStatusOrderByCreatedAtDesc(String visibility, String moderationStatus);

    Optional<GalleryPostEntity> findBySlug(String slug);
}
