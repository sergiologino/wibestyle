package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AvatarSnapshotEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AvatarSnapshotRepository extends JpaRepository<AvatarSnapshotEntity, UUID> {

    Optional<AvatarSnapshotEntity> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    List<AvatarSnapshotEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
