package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QuotaServiceTest {

    @Test
    void trialUserCanSpendReferralBonusAfterFreeUnitsEnd() {
        UserProfileRepository profileRepository = mock(UserProfileRepository.class);
        TryOnSessionRepository sessionRepository = mock(TryOnSessionRepository.class);
        QuotaService service = new QuotaService(profileRepository, sessionRepository, new BillingProperties());
        UUID userId = UUID.randomUUID();
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        profile.setPlan("trial");
        profile.setTrialGenerationsLeft(0);
        profile.setBonusGenerationsLeft(3);
        when(sessionRepository.countByUserIdAndStatusAndQuotaReservedTrueAndQuotaConsumedFalse(
                userId, TryOnSessionStatus.GENERATING)).thenReturn(0L);
        when(profileRepository.findById(userId)).thenReturn(java.util.Optional.of(profile));
        TryOnSessionEntity session = session(userId);

        assertThat(service.canStartGeneration(profile)).isTrue();
        service.consume(session);

        assertThat(profile.getBonusGenerationsLeft()).isEqualTo(2);
        verify(profileRepository).save(profile);
    }

    @Test
    void expiredSubscriberCanSpendReferralBonusButNotExpiredPlanUnits() {
        UserProfileRepository profileRepository = mock(UserProfileRepository.class);
        TryOnSessionRepository sessionRepository = mock(TryOnSessionRepository.class);
        QuotaService service = new QuotaService(profileRepository, sessionRepository, new BillingProperties());
        UUID userId = UUID.randomUUID();
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        profile.setPlan("wibe");
        profile.setSubscriptionExpiresAt(Instant.now().minusSeconds(60));
        profile.setPlanGenerationsLeft(10);
        profile.setBonusGenerationsLeft(1);
        when(sessionRepository.countByUserIdAndStatusAndQuotaReservedTrueAndQuotaConsumedFalse(
                userId, TryOnSessionStatus.GENERATING)).thenReturn(0L);
        when(profileRepository.findById(userId)).thenReturn(java.util.Optional.of(profile));
        TryOnSessionEntity session = session(userId);

        assertThat(service.canStartGeneration(profile)).isTrue();
        service.consume(session);

        assertThat(profile.getPlanGenerationsLeft()).isEqualTo(10);
        assertThat(profile.getBonusGenerationsLeft()).isZero();
    }

    @Test
    void refundReleasesReservationWithoutChangingUserBalance() {
        UserProfileRepository profileRepository = mock(UserProfileRepository.class);
        TryOnSessionRepository sessionRepository = mock(TryOnSessionRepository.class);
        QuotaService service = new QuotaService(
                profileRepository,
                sessionRepository,
                new BillingProperties()
        );
        TryOnSessionEntity session = new TryOnSessionEntity(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.FAILED,
                Instant.now(),
                Instant.now()
        );
        session.setQuotaReserved(true);

        service.refund(session);

        assertThat(session.isQuotaReserved()).isFalse();
        assertThat(session.isQuotaConsumed()).isFalse();
        verify(profileRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(sessionRepository).save(session);
    }

    private static TryOnSessionEntity session(UUID userId) {
        return new TryOnSessionEntity(
                UUID.randomUUID(),
                userId,
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.GENERATING,
                Instant.now(),
                Instant.now()
        );
    }
}
