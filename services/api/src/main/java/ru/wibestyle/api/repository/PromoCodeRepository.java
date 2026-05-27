package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.PromoCodeEntity;

import java.util.Optional;
import java.util.UUID;

public interface PromoCodeRepository extends JpaRepository<PromoCodeEntity, UUID> {
    Optional<PromoCodeEntity> findByCode(String code);
}
