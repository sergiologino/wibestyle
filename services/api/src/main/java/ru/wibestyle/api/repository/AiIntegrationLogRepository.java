package ru.wibestyle.api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.AiIntegrationLogEntity;

import java.util.UUID;

public interface AiIntegrationLogRepository extends JpaRepository<AiIntegrationLogEntity, UUID> {

    Page<AiIntegrationLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
