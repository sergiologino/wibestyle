package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class QuotaServiceTest {

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
}
