package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.ReferralAccountEntity;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface ReferralAccountRepository extends JpaRepository<ReferralAccountEntity, UUID> {
    Optional<ReferralAccountEntity> findByReferralCodeIgnoreCase(String referralCode);
    boolean existsByReferralCodeIgnoreCase(String referralCode);
    List<ReferralAccountEntity> findAllByReferredByUserIdIsNotNullOrderByReferredAtDesc();
}
