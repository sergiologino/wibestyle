package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.HairColorCatalogEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HairColorCatalogRepository extends JpaRepository<HairColorCatalogEntity, UUID> {
    List<HairColorCatalogEntity> findByActiveTrueOrderBySortOrderAsc();
    List<HairColorCatalogEntity> findAllByOrderBySortOrderAsc();
    Optional<HairColorCatalogEntity> findBySlug(String slug);
}
