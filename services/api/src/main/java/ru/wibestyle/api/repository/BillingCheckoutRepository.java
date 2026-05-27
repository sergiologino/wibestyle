package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.BillingCheckoutEntity;

import java.util.Optional;
import java.util.UUID;

public interface BillingCheckoutRepository extends JpaRepository<BillingCheckoutEntity, UUID> {
    Optional<BillingCheckoutEntity> findByIdAndUserId(UUID id, UUID userId);
}
