package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AdminAuditLogEntity;

import java.util.List;
import java.util.UUID;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLogEntity, UUID> {
    List<AdminAuditLogEntity> findTop100ByOrderByCreatedAtDesc();
}
