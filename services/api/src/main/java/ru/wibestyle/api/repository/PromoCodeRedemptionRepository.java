package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.PromoCodeRedemptionEntity;

import java.util.Optional;
import java.util.UUID;

public interface PromoCodeRedemptionRepository extends JpaRepository<PromoCodeRedemptionEntity, UUID> {
    boolean existsByPromoCodeIdAndUserId(UUID promoCodeId, UUID userId);

    Optional<PromoCodeRedemptionEntity> findByUserIdAndPromoCodeId(UUID userId, UUID promoCodeId);
}
