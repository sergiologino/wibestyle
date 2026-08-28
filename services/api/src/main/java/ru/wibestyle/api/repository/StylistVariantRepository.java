package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.StylistVariantEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StylistVariantRepository extends JpaRepository<StylistVariantEntity, UUID> {

    List<StylistVariantEntity> findBySessionIdOrderBySortOrderAsc(UUID sessionId);

    Optional<StylistVariantEntity> findBySessionIdAndVariantKey(UUID sessionId, String variantKey);
}
