package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.MarketingChannelEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarketingChannelRepository extends JpaRepository<MarketingChannelEntity, UUID> {
    Optional<MarketingChannelEntity> findByCodeIgnoreCase(String code);
    Optional<MarketingChannelEntity> findFirstByUtmSourceIgnoreCaseAndUtmMediumIgnoreCaseAndEnabledTrue(String source, String medium);
    List<MarketingChannelEntity> findAllByOrderByDisplayNameAsc();
}
