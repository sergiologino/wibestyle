package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.TryOnErrorCodes;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.UUID;

@Service
public class TrialVideoQuotaService {

    private final UserProfileRepository userProfileRepository;
    private final TryOnSessionRepository tryOnSessionRepository;

    public TrialVideoQuotaService(
            UserProfileRepository userProfileRepository,
            TryOnSessionRepository tryOnSessionRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
    }

    @Transactional
    public void reserve(UUID userId, TryOnSessionEntity session) {
        UserProfileEntity profile = userProfileRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        if ("elite".equals(profile.getPlan())) {
            return;
        }
        if (!"trial".equals(profile.getPlan())) {
            throw new IllegalArgumentException(TryOnErrorCodes.VIDEO_ELITE_REQUIRED);
        }
        if (session.isVideoQuotaConsumed()) {
            return;
        }
        if (session.isVideoQuotaReserved()) {
            return;
        }
        if (profile.getTrialVideoGenerationsLeft() <= 0) {
            throw new IllegalArgumentException(TryOnErrorCodes.VIDEO_TRIAL_EXHAUSTED);
        }

        profile.setTrialVideoGenerationsLeft(profile.getTrialVideoGenerationsLeft() - 1);
        profile.setUpdatedAt(Instant.now());
        session.setVideoQuotaReserved(true);
        session.setUpdatedAt(Instant.now());
        userProfileRepository.save(profile);
        tryOnSessionRepository.save(session);
    }

    @Transactional
    public void consume(TryOnSessionEntity session) {
        if (!session.isVideoQuotaReserved() || session.isVideoQuotaConsumed()) {
            return;
        }
        session.setVideoQuotaConsumed(true);
        session.setUpdatedAt(Instant.now());
        tryOnSessionRepository.save(session);
    }

    @Transactional
    public void refund(TryOnSessionEntity session) {
        if (!session.isVideoQuotaReserved() || session.isVideoQuotaConsumed()) {
            return;
        }
        UserProfileEntity profile = userProfileRepository.findByIdForUpdate(session.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
        profile.setTrialVideoGenerationsLeft(profile.getTrialVideoGenerationsLeft() + 1);
        profile.setUpdatedAt(Instant.now());
        session.setVideoQuotaReserved(false);
        session.setUpdatedAt(Instant.now());
        userProfileRepository.save(profile);
        tryOnSessionRepository.save(session);
    }
}
