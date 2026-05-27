package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.MediaAssetEntity;

import java.util.Optional;
import java.util.UUID;

public interface MediaAssetRepository extends JpaRepository<MediaAssetEntity, UUID> {
    Optional<MediaAssetEntity> findByIdAndUserId(UUID id, UUID userId);
}
