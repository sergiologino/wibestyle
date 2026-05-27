package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.GalleryCommentEntity;

import java.util.List;
import java.util.UUID;

public interface GalleryCommentRepository extends JpaRepository<GalleryCommentEntity, UUID> {

    List<GalleryCommentEntity> findByPostIdOrderByCreatedAtAsc(UUID postId);
}
