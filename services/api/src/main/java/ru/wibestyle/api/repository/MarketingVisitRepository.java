package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.MarketingVisitEntity;

import java.util.Optional;
import java.util.UUID;

public interface MarketingVisitRepository extends JpaRepository<MarketingVisitEntity, UUID> {
    Optional<MarketingVisitEntity> findFirstByVisitorIdOrderByCreatedAtAsc(String visitorId);
    Optional<MarketingVisitEntity> findFirstByVisitorIdOrderByCreatedAtDesc(String visitorId);
}
