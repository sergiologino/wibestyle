package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TryOnSessionRepository extends JpaRepository<TryOnSessionEntity, UUID> {

    Optional<TryOnSessionEntity> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndStatusAndQuotaReservedTrueAndQuotaConsumedFalse(UUID userId, TryOnSessionStatus status);

    List<TryOnSessionEntity> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, TryOnSessionStatus status);

    List<TryOnSessionEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
