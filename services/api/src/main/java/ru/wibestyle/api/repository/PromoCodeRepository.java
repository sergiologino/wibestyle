package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.wibestyle.api.domain.PromoCodeEntity;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface PromoCodeRepository extends JpaRepository<PromoCodeEntity, UUID> {
    Optional<PromoCodeEntity> findByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select promo from PromoCodeEntity promo where promo.code = :code")
    Optional<PromoCodeEntity> findByCodeForUpdate(@Param("code") String code);
}
