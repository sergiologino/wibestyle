package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import ru.wibestyle.api.domain.BillingSubscriptionEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BillingSubscriptionRepository extends JpaRepository<BillingSubscriptionEntity, UUID> {
    List<BillingSubscriptionEntity> findByAutoRenewEnabledTrueAndCurrentPeriodEndBetween(Instant from, Instant to);
    List<BillingSubscriptionEntity> findByAutoRenewEnabledTrueAndCurrentPeriodEndLessThanEqual(Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select subscription from BillingSubscriptionEntity subscription where subscription.userId = :userId")
    java.util.Optional<BillingSubscriptionEntity> findLockedByUserId(UUID userId);
}
