package ru.wibestyle.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.wibestyle.api.domain.ManualPushRecipientEntity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ManualPushRecipientRepository extends JpaRepository<ManualPushRecipientEntity, UUID> {

    @Query("""
            select recipient
            from ManualPushRecipientEntity recipient
            join ManualPushCampaignEntity campaign on campaign.id = recipient.campaignId
            where recipient.status = 'queued'
              and recipient.nextAttemptAt <= :now
              and campaign.scheduledAt <= :now
              and campaign.status <> 'cancelled'
            order by recipient.nextAttemptAt asc
            """)
    List<ManualPushRecipientEntity> findDueQueued(@Param("now") Instant now, Pageable pageable);

    int countByCampaignId(UUID campaignId);

    int countByCampaignIdAndStatus(UUID campaignId, String status);

    @Query("""
            select count(recipient)
            from ManualPushRecipientEntity recipient
            where recipient.campaignId = :campaignId
              and recipient.status = 'queued'
              and recipient.lastError = :lastError
            """)
    int countQueuedByLastError(@Param("campaignId") UUID campaignId, @Param("lastError") String lastError);

    @Query("""
            select count(recipient)
            from ManualPushRecipientEntity recipient
            where recipient.campaignId = :campaignId
              and recipient.status = 'queued'
              and recipient.lastError is not null
              and recipient.lastError <> 'NO_PUSH_DEVICE'
            """)
    int countQueuedWithProviderError(@Param("campaignId") UUID campaignId);
}
