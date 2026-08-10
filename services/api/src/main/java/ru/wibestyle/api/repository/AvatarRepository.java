package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.domain.AvatarStatus;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AvatarRepository extends JpaRepository<AvatarEntity, UUID> {

    List<AvatarEntity> findByUserIdAndStatusNotOrderByCreatedAtDesc(UUID userId, AvatarStatus status);

    List<AvatarEntity> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, AvatarStatus status);

    List<AvatarEntity> findByUserIdAndStatusInOrderByCreatedAtDesc(UUID userId, Collection<AvatarStatus> statuses);

    long countByUserIdAndStatusNot(UUID userId, AvatarStatus status);

    long countByUserIdAndStatus(UUID userId, AvatarStatus status);

    long countByUserIdAndStatusIn(UUID userId, Collection<AvatarStatus> statuses);

    Optional<AvatarEntity> findByIdAndUserId(UUID id, UUID userId);

    Optional<AvatarEntity> findByUserIdAndActiveTrue(UUID userId);
}
