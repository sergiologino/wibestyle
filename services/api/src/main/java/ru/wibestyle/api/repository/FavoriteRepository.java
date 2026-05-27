package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.FavoriteEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<FavoriteEntity, UUID> {

    List<FavoriteEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<FavoriteEntity> findByUserIdAndMarketplaceAndExternalProductId(
            UUID userId,
            String marketplace,
            String externalProductId
    );
}
