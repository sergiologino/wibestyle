package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.GalleryReportEntity;

import java.util.List;
import java.util.UUID;

public interface GalleryReportRepository extends JpaRepository<GalleryReportEntity, UUID> {
    List<GalleryReportEntity> findByStatusOrderByCreatedAtDesc(String status);

    List<GalleryReportEntity> findAllByOrderByCreatedAtDesc();
}
