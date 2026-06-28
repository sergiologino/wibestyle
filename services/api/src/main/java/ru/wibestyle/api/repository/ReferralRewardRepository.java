package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.ReferralRewardEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReferralRewardRepository extends JpaRepository<ReferralRewardEntity, UUID> {
    boolean existsByReferredUserId(UUID referredUserId);
    List<ReferralRewardEntity> findAllByReferrerUserIdOrderByRewardedAtDesc(UUID referrerUserId);
    Optional<ReferralRewardEntity> findByReferredUserId(UUID referredUserId);
}
