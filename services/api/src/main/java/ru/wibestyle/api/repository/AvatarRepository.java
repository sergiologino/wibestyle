package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.domain.AvatarStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AvatarRepository extends JpaRepository<AvatarEntity, UUID> {

    List<AvatarEntity> findByUserIdAndStatusNotOrderByCreatedAtDesc(UUID userId, AvatarStatus status);

    Optional<AvatarEntity> findByIdAndUserId(UUID id, UUID userId);

    Optional<AvatarEntity> findByUserIdAndActiveTrue(UUID userId);
}
