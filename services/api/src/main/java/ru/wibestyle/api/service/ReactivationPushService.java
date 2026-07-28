package ru.wibestyle.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.ReactivationPushLogEntity;
import ru.wibestyle.api.domain.ReactivationPushTemplateEntity;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.domain.TryOnSourceType;
import ru.wibestyle.api.repository.ReactivationPushLogRepository;
import ru.wibestyle.api.repository.ReactivationPushTemplateRepository;
import ru.wibestyle.api.repository.TryOnSessionRepository;
import ru.wibestyle.api.repository.UserActivityRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReactivationPushService {
    private static final Logger log = LoggerFactory.getLogger(ReactivationPushService.class);
    private static final int BATCH_LIMIT = 200;

    private final UserActivityRepository activityRepository;
    private final ReactivationPushTemplateRepository templateRepository;
    private final ReactivationPushLogRepository logRepository;
    private final TryOnSessionRepository tryOnSessionRepository;
    private final NotificationService notificationService;

    public ReactivationPushService(
            UserActivityRepository activityRepository,
            ReactivationPushTemplateRepository templateRepository,
            ReactivationPushLogRepository logRepository,
            TryOnSessionRepository tryOnSessionRepository,
            NotificationService notificationService
    ) {
        this.activityRepository = activityRepository;
        this.templateRepository = templateRepository;
        this.logRepository = logRepository;
        this.tryOnSessionRepository = tryOnSessionRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "${wibestyle.push.reactivation-cron:0 35 * * * *}")
    public void sendScheduledReactivationPushes() {
        try {
            sendReactivationPushes(Instant.now());
        } catch (RuntimeException ex) {
            log.warn("Reactivation push scheduler failed: {}", ex.getMessage());
        }
    }

    @Transactional
    public int sendReactivationPushes(Instant now) {
        List<ReactivationPushTemplateEntity> templates = templateRepository.findByEnabledTrueOrderBySortOrderAsc();
        if (templates.isEmpty()) {
            return 0;
        }
        Instant inactiveBefore = now.minus(Duration.ofHours(36));
        Instant registeredBefore = now.minus(Duration.ofHours(24));
        Instant recentNotificationAfter = now.minus(Duration.ofHours(36));
        Instant epoch = Instant.parse("1970-01-01T00:00:00Z");
        List<UUID> candidates = activityRepository.findReactivationCandidates(
                registeredBefore,
                inactiveBefore,
                recentNotificationAfter,
                epoch,
                BATCH_LIMIT
        );
        int sent = 0;
        for (UUID userId : candidates) {
            ReactivationPushTemplateEntity template = chooseTemplate(userId, templates);
            if (template == null) {
                continue;
            }
            String actionUrl = chooseActionUrl(userId, template.getActionUrl());
            String dedupeKey = "reactivation:" + template.getId();
            boolean created = notificationService.create(
                    userId,
                    "reactivation_try_on",
                    template.getTitle(),
                    template.getBody(),
                    actionUrl,
                    dedupeKey
            );
            if (created) {
                logRepository.save(new ReactivationPushLogEntity(
                        UUID.randomUUID(),
                        userId,
                        template.getId(),
                        actionUrl,
                        dedupeKey,
                        now
                ));
                sent++;
            }
        }
        return sent;
    }

    private ReactivationPushTemplateEntity chooseTemplate(UUID userId, List<ReactivationPushTemplateEntity> templates) {
        int start = Math.floorMod(userId.hashCode(), templates.size());
        for (int i = 0; i < templates.size(); i++) {
            ReactivationPushTemplateEntity template = templates.get((start + i) % templates.size());
            if (!logRepository.existsByUserIdAndTemplateId(userId, template.getId())) {
                return template;
            }
        }
        return null;
    }

    private String chooseActionUrl(UUID userId, String fallback) {
        return tryOnSessionRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(TryOnSessionEntity::getSourceType)
                .map(source -> source == TryOnSourceType.MARKETPLACE_LINK ? "/try-on/link" : "/try-on/photo")
                .orElse(fallback == null || fallback.isBlank() ? "/try-on" : fallback);
    }
}
