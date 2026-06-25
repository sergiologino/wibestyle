package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import ru.wibestyle.api.domain.BillingCheckoutEntity;

import java.util.Optional;
import java.util.UUID;

public interface BillingCheckoutRepository extends JpaRepository<BillingCheckoutEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<BillingCheckoutEntity> findByIdAndUserId(UUID id, UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<BillingCheckoutEntity> findByExternalPaymentId(String externalPaymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<BillingCheckoutEntity> findByRenewalKey(String renewalKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select checkout from BillingCheckoutEntity checkout where checkout.id = :id")
    Optional<BillingCheckoutEntity> findLockedById(UUID id);
}
