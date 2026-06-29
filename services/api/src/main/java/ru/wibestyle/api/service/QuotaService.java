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

    public QuotaService(
            UserProfileRepository userProfileRepository,
            TryOnSessionRepository tryOnSessionRepository,
            BillingProperties billingProperties
    ) {
        this.userProfileRepository = userProfileRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.billingProperties = billingProperties;
    }

    public boolean canStartGeneration(UserProfileEntity profile) {
        return availableUnits(profile) > activeReservations(profile.getUserId());
    }

    @Transactional
    public void reserve(TryOnSessionEntity session, UserProfileEntity profile) {
        if (!canStartGeneration(profile)) {
            throw new IllegalArgumentException("INSUFFICIENT_GENERATIONS");
        }
        session.setQuotaReserved(true);
        session.setUpdatedAt(Instant.now());
    }

    @Transactional
    public void consume(TryOnSessionEntity session) {
        if (session.isQuotaConsumed()) {
            return;
        }
        userProfileRepository.findById(session.getUserId()).ifPresent(profile -> {
            if ("trial".equals(profile.getPlan())) {
                if (profile.getTrialGenerationsLeft() > 0) {
                    profile.setTrialGenerationsLeft(profile.getTrialGenerationsLeft() - 1);
                }
            } else if (profile.getPlanGenerationsLeft() > 0) {
                profile.setPlanGenerationsLeft(profile.getPlanGenerationsLeft() - 1);
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
        if ("wibe".equals(profile.getPlan()) || "elite".equals(profile.getPlan())) {
            if (profile.getSubscriptionExpiresAt() != null
                    && profile.getSubscriptionExpiresAt().isBefore(Instant.now())) {
                return 0;
            }
            return profile.getPlanGenerationsLeft() + profile.getBonusGenerationsLeft();
        }
        return profile.getTrialGenerationsLeft();
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
