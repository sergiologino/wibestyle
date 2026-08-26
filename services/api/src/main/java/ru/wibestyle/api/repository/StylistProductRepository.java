package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.StylistProductEntity;

import java.util.List;
import java.util.UUID;

public interface StylistProductRepository extends JpaRepository<StylistProductEntity, UUID> {

    List<StylistProductEntity> findByVariantIdOrderBySortOrderAsc(UUID variantId);

    void deleteByVariantId(UUID variantId);
}
