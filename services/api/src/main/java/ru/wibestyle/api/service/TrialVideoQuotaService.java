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

    private static final String VIDEO_QUOTA_SOURCE_TRIAL = "trial_video";
    private static final String VIDEO_QUOTA_SOURCE_PLAN = "plan_generations";
    private static final String VIDEO_QUOTA_SOURCE_BONUS = "bonus_generations";

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
        if (session.isVideoQuotaConsumed()) {
            return;
        }
        if (session.isVideoQuotaReserved()) {
            return;
        }
        if (BillingService.isPackagePlan(profile.getPlan()) && profile.getPlanGenerationsLeft() > 0) {
            profile.setPlanGenerationsLeft(profile.getPlanGenerationsLeft() - 1);
            reserveVideo(profile, session, VIDEO_QUOTA_SOURCE_PLAN);
            return;
        }
        if (profile.getBonusGenerationsLeft() > 0) {
            profile.setBonusGenerationsLeft(profile.getBonusGenerationsLeft() - 1);
            reserveVideo(profile, session, VIDEO_QUOTA_SOURCE_BONUS);
            return;
        }
        if (!"trial".equals(profile.getPlan())) {
            throw new IllegalArgumentException(TryOnErrorCodes.INSUFFICIENT_GENERATIONS);
        }
        if (profile.getTrialVideoGenerationsLeft() <= 0) {
            throw new IllegalArgumentException(TryOnErrorCodes.VIDEO_TRIAL_EXHAUSTED);
        }

        profile.setTrialVideoGenerationsLeft(profile.getTrialVideoGenerationsLeft() - 1);
        reserveVideo(profile, session, VIDEO_QUOTA_SOURCE_TRIAL);
    }

    private void reserveVideo(UserProfileEntity profile, TryOnSessionEntity session, String source) {
        profile.setUpdatedAt(Instant.now());
        session.setVideoQuotaReserved(true);
        session.setVideoQuotaSource(source);
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
        if (VIDEO_QUOTA_SOURCE_TRIAL.equals(session.getVideoQuotaSource())) {
            profile.setTrialVideoGenerationsLeft(profile.getTrialVideoGenerationsLeft() + 1);
        } else if (VIDEO_QUOTA_SOURCE_PLAN.equals(session.getVideoQuotaSource())) {
            profile.setPlanGenerationsLeft(profile.getPlanGenerationsLeft() + 1);
        } else if (VIDEO_QUOTA_SOURCE_BONUS.equals(session.getVideoQuotaSource())) {
            profile.setBonusGenerationsLeft(profile.getBonusGenerationsLeft() + 1);
        }
        profile.setUpdatedAt(Instant.now());
        session.setVideoQuotaReserved(false);
        session.setVideoQuotaSource(null);
        session.setUpdatedAt(Instant.now());
        userProfileRepository.save(profile);
        tryOnSessionRepository.save(session);
    }
}
