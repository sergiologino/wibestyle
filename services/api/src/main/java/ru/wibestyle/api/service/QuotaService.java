package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSessionStatus;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.UUID;

@Service
public class QuotaService {

    private final UserProfileRepository userProfileRepository;
    private final TryOnSessionRepository tryOnSessionRepository;
    private final BillingProperties billingProperties;
    private final DeviceTrustService deviceTrustService;

    public QuotaService(
            UserProfileRepository userProfileRepository,
            TryOnSessionRepository tryOnSessionRepository,
            BillingProperties billingProperties,
            DeviceTrustService deviceTrustService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.billingProperties = billingProperties;
        this.deviceTrustService = deviceTrustService;
    }

    public boolean canStartGeneration(UserProfileEntity profile) {
        return canStartGeneration(profile, null);
    }

    public boolean canStartGeneration(UserProfileEntity profile, String deviceId) {
        long active = activeReservations(profile.getUserId());
        if (hasActivePaidPlan(profile) || profile.getBonusGenerationsLeft() > 0) {
            return availableUnits(profile) > active;
        }
        int accountTrialUnits = "trial".equals(profile.getPlan()) ? profile.getTrialGenerationsLeft() : 0;
        int deviceTrialUnits = deviceTrustService.availableTrialGenerations(profile.getUserId(), deviceId);
        return Math.min(accountTrialUnits, deviceTrialUnits) > active;
    }

    @Transactional
    public void reserve(TryOnSessionEntity session, UserProfileEntity profile, String deviceId) {
        if (!canStartGeneration(profile, deviceId)) {
            throw new IllegalArgumentException("INSUFFICIENT_GENERATIONS");
        }
        deviceTrustService.resolveDeviceHash(profile.getUserId(), deviceId).ifPresent(session::setDeviceHash);
        session.setQuotaReserved(true);
        session.setUpdatedAt(Instant.now());
    }

    @Transactional
    public void reserve(TryOnSessionEntity session, UserProfileEntity profile) {
        reserve(session, profile, null);
    }

    @Transactional
    public void consume(TryOnSessionEntity session) {
        if (session.isQuotaConsumed()) {
            return;
        }
        userProfileRepository.findById(session.getUserId()).ifPresent(profile -> {
            if (hasActivePaidPlan(profile) && profile.getPlanGenerationsLeft() > 0) {
                profile.setPlanGenerationsLeft(profile.getPlanGenerationsLeft() - 1);
            } else if ("trial".equals(profile.getPlan()) && profile.getTrialGenerationsLeft() > 0) {
                profile.setTrialGenerationsLeft(profile.getTrialGenerationsLeft() - 1);
                deviceTrustService.consumeTrialGenerationByHash(session.getDeviceHash());
            } else if (profile.getBonusGenerationsLeft() > 0) {
                profile.setBonusGenerationsLeft(profile.getBonusGenerationsLeft() - 1);
            }
            profile.setUpdatedAt(Instant.now());
            userProfileRepository.save(profile);
        });
        session.setQuotaConsumed(true);
        session.setUpdatedAt(Instant.now());
    }

    @Transactional
    public void refund(TryOnSessionEntity session) {
        if (!session.isQuotaReserved() || session.isQuotaConsumed()) {
            return;
        }
        session.setQuotaReserved(false);
        session.setUpdatedAt(Instant.now());
        tryOnSessionRepository.save(session);
    }

    private int availableUnits(UserProfileEntity profile) {
        if (hasActivePaidPlan(profile)) {
            return profile.getPlanGenerationsLeft() + profile.getBonusGenerationsLeft();
        }
        int trialUnits = "trial".equals(profile.getPlan()) ? profile.getTrialGenerationsLeft() : 0;
        return trialUnits + profile.getBonusGenerationsLeft();
    }

    private boolean hasActivePaidPlan(UserProfileEntity profile) {
        return ("wibe".equals(profile.getPlan()) || "elite".equals(profile.getPlan()))
                && (profile.getSubscriptionExpiresAt() == null
                    || profile.getSubscriptionExpiresAt().isAfter(Instant.now()));
    }

    private long activeReservations(UUID userId) {
        return tryOnSessionRepository.countByUserIdAndStatusAndQuotaReservedTrueAndQuotaConsumedFalse(
                userId,
                TryOnSessionStatus.GENERATING
        );
    }

    public int defaultGenerationsForPlan(String plan) {
        return switch (plan) {
            case "wibe" -> billingProperties.getWibeGenerations();
            case "elite" -> billingProperties.getEliteGenerations();
            default -> 0;
        };
    }

    public int generationsForPlanPeriod(String plan, String period) {
        int monthlyGenerations = defaultGenerationsForPlan(plan);
        return "annual".equals(period) ? Math.multiplyExact(monthlyGenerations, 12) : monthlyGenerations;
    }
}
