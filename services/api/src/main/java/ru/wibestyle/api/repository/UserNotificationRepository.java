package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.UserNotificationEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserNotificationRepository extends JpaRepository<UserNotificationEntity, UUID> {
    List<UserNotificationEntity> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<UserNotificationEntity> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByUserIdAndDedupeKey(UUID userId, String dedupeKey);
}
