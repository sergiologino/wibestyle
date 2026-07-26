package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.ReactivationPushTemplateEntity;

import java.util.List;
import java.util.UUID;

public interface ReactivationPushTemplateRepository extends JpaRepository<ReactivationPushTemplateEntity, UUID> {
    List<ReactivationPushTemplateEntity> findByEnabledTrueOrderBySortOrderAsc();
}
