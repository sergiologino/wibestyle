package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.GalleryLikeEntity;

import java.util.Optional;
import java.util.UUID;

public interface GalleryLikeRepository extends JpaRepository<GalleryLikeEntity, UUID> {

    Optional<GalleryLikeEntity> findByPostIdAndUserId(UUID postId, UUID userId);

    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
}
