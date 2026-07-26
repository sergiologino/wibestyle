package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.ReactivationPushLogEntity;

import java.util.List;
import java.util.UUID;

public interface ReactivationPushLogRepository extends JpaRepository<ReactivationPushLogEntity, UUID> {
    List<ReactivationPushLogEntity> findByUserIdOrderBySentAtDesc(UUID userId);
    boolean existsByUserIdAndTemplateId(UUID userId, UUID templateId);
}
