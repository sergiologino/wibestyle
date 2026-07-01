package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TrialVideoQuotaServiceTest {

    @Test
    void reservesAndConsumesTheSingleTrialVideo() {
        UUID userId = UUID.randomUUID();
        UserProfileEntity profile = trialProfile(userId, 1);
        TryOnSessionEntity session = session(userId);
        UserProfileRepository profileRepository = mock(UserProfileRepository.class);
        TryOnSessionRepository sessionRepository = mock(TryOnSessionRepository.class);
        when(profileRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(profile));
        TrialVideoQuotaService service = new TrialVideoQuotaService(profileRepository, sessionRepository);

        service.reserve(userId, session);
        service.consume(session);

        assertThat(profile.getTrialVideoGenerationsLeft()).isZero();
        assertThat(session.isVideoQuotaReserved()).isTrue();
        assertThat(session.isVideoQuotaConsumed()).isTrue();
    }

    @Test
    void refundsTrialVideoAfterProviderFailure() {
        UUID userId = UUID.randomUUID();
        UserProfileEntity profile = trialProfile(userId, 1);
        TryOnSessionEntity session = session(userId);
        UserProfileRepository profileRepository = mock(UserProfileRepository.class);
        TryOnSessionRepository sessionRepository = mock(TryOnSessionRepository.class);
        when(profileRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(profile));
        TrialVideoQuotaService service = new TrialVideoQuotaService(profileRepository, sessionRepository);

        service.reserve(userId, session);
        service.refund(session);

        assertThat(profile.getTrialVideoGenerationsLeft()).isEqualTo(1);
        assertThat(session.isVideoQuotaReserved()).isFalse();
        assertThat(session.isVideoQuotaConsumed()).isFalse();
    }

    @Test
    void rejectsSecondTrialVideo() {
        UUID userId = UUID.randomUUID();
        UserProfileEntity profile = trialProfile(userId, 0);
        TryOnSessionEntity session = session(userId);
        UserProfileRepository profileRepository = mock(UserProfileRepository.class);
        TryOnSessionRepository sessionRepository = mock(TryOnSessionRepository.class);
        when(profileRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(profile));
        TrialVideoQuotaService service = new TrialVideoQuotaService(profileRepository, sessionRepository);

        assertThatThrownBy(() -> service.reserve(userId, session))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("VIDEO_TRIAL_EXHAUSTED");
    }

    private static UserProfileEntity trialProfile(UUID userId, int videosLeft) {
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        profile.setPlan("trial");
        profile.setTrialVideoGenerationsLeft(videosLeft);
        return profile;
    }

    private static TryOnSessionEntity session(UUID userId) {
        return new TryOnSessionEntity(
                UUID.randomUUID(),
                userId,
                UUID.randomUUID(),
                TryOnSourceType.MARKETPLACE_LINK,
                TryOnSessionStatus.READY,
                Instant.now(),
                Instant.now()
        );
    }
}
