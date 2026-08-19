package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.wibestyle.api.domain.ManualPushCampaignEntity;

import java.util.List;
import java.util.UUID;

public interface ManualPushCampaignRepository extends JpaRepository<ManualPushCampaignEntity, UUID> {
    List<ManualPushCampaignEntity> findTop50ByOrderByCreatedAtDesc();
}
