package ru.wibestyle.api.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.ManualPushCampaignEntity;
import ru.wibestyle.api.domain.ManualPushRecipientEntity;
import ru.wibestyle.api.domain.PushDeviceEntity;
import ru.wibestyle.api.domain.UserNotificationEntity;
import ru.wibestyle.api.repository.ManualPushCampaignRepository;
import ru.wibestyle.api.repository.ManualPushRecipientRepository;
import ru.wibestyle.api.repository.PushDeviceRepository;
import ru.wibestyle.api.repository.UserNotificationRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class ManualPushService {
    public static final int TITLE_MAX_LENGTH = 80;
    public static final int BODY_MAX_LENGTH = 240;

    private static final String STATUS_SCHEDULED = "scheduled";
    private static final String STATUS_SENDING = "sending";
    private static final String STATUS_SENT = "sent";
    private static final String STATUS_QUEUED = "queued";
    private static final String STATUS_ACCEPTED = "accepted";
    private static final String ERROR_NO_PUSH_DEVICE = "NO_PUSH_DEVICE";

    private final ManualPushCampaignRepository campaignRepository;
    private final ManualPushRecipientRepository recipientRepository;
    private final UserProfileRepository userProfileRepository;
    private final PushDeviceRepository pushDeviceRepository;
    private final UserNotificationRepository notificationRepository;
    private final ExpoPushService expoPushService;
    private final RuStorePushService ruStorePushService;

    public ManualPushService(
            ManualPushCampaignRepository campaignRepository,
            ManualPushRecipientRepository recipientRepository,
            UserProfileRepository userProfileRepository,
            PushDeviceRepository pushDeviceRepository,
            UserNotificationRepository notificationRepository,
            ExpoPushService expoPushService,
            RuStorePushService ruStorePushService
    ) {
        this.campaignRepository = campaignRepository;
        this.recipientRepository = recipientRepository;
        this.userProfileRepository = userProfileRepository;
        this.pushDeviceRepository = pushDeviceRepository;
        this.notificationRepository = notificationRepository;
        this.expoPushService = expoPushService;
        this.ruStorePushService = ruStorePushService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list() {
        return campaignRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::toMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> create(String title, String body, String audience, Instant scheduledAt, String actionUrl) {
        Instant now = Instant.now();
        String normalizedTitle = normalizeRequired(title, "MANUAL_PUSH_TITLE_REQUIRED");
        String normalizedBody = normalizeRequired(body, "MANUAL_PUSH_BODY_REQUIRED");
        String normalizedAudience = normalizeAudience(audience);
        String normalizedActionUrl = normalizeOptional(actionUrl);

        if (normalizedTitle.length() > TITLE_MAX_LENGTH) {
            throw new IllegalArgumentException("MANUAL_PUSH_TITLE_TOO_LONG");
        }
        if (normalizedBody.length() > BODY_MAX_LENGTH) {
            throw new IllegalArgumentException("MANUAL_PUSH_BODY_TOO_LONG");
        }
        if (scheduledAt == null) {
            throw new IllegalArgumentException("MANUAL_PUSH_SCHEDULED_AT_REQUIRED");
        }
        if (scheduledAt.isBefore(now)) {
            throw new IllegalArgumentException("MANUAL_PUSH_SCHEDULED_AT_PAST");
        }

        UUID campaignId = UUID.randomUUID();
        List<UUID> targetUserIds = resolveTargetUserIds(normalizedAudience, now).stream()
                .distinct()
                .toList();
        ManualPushCampaignEntity campaign = new ManualPushCampaignEntity(
                campaignId,
                normalizedTitle,
                normalizedBody,
                normalizedActionUrl,
                normalizedAudience,
                targetUserIds.isEmpty() ? STATUS_SENT : STATUS_SCHEDULED,
                scheduledAt,
                now
        );
        campaign.setTargetedUsers(targetUserIds.size());
        campaign.setQueuedUsers(targetUserIds.size());
        if (targetUserIds.isEmpty()) {
            campaign.setFinishedAt(now);
        }
        campaignRepository.save(campaign);

        List<ManualPushRecipientEntity> recipients = targetUserIds.stream()
                .map(userId -> new ManualPushRecipientEntity(UUID.randomUUID(), campaignId, userId, scheduledAt, now))
                .toList();
        recipientRepository.saveAll(recipients);

        return toMap(campaign);
    }

    @Scheduled(fixedDelayString = "${wibestyle.push.manual-fixed-delay-ms:60000}")
    @Transactional
    public void processDueQueue() {
        Instant now = Instant.now();
        List<ManualPushRecipientEntity> recipients = recipientRepository.findDueQueued(now, PageRequest.of(0, 500));
        for (ManualPushRecipientEntity recipient : recipients) {
            processRecipient(recipient, now);
        }
    }

    private void processRecipient(ManualPushRecipientEntity recipient, Instant now) {
        ManualPushCampaignEntity campaign = campaignRepository.findById(recipient.getCampaignId()).orElse(null);
        if (campaign == null) {
            return;
        }
        if (STATUS_SCHEDULED.equals(campaign.getStatus())) {
            campaign.setStatus(STATUS_SENDING);
            campaign.setStartedAt(now);
        }

        ensureInAppNotification(campaign, recipient.getUserId(), now);
        List<PushDeviceEntity> devices = pushDeviceRepository.findByUserIdAndEnabledTrue(recipient.getUserId());
        if (devices.isEmpty()) {
            recipient.markRetry(ERROR_NO_PUSH_DEVICE, now.plusSeconds(30 * 60), now);
            campaign.setLastError(ERROR_NO_PUSH_DEVICE);
            refreshStats(campaign, now);
            return;
        }

        boolean accepted = false;
        for (PushDeviceEntity device : devices) {
            accepted = sendDevice(device, campaign) || accepted;
        }
        if (accepted) {
            recipient.markAccepted(now);
        } else {
            recipient.markRetry("PROVIDER_REQUEST_FAILED", now.plusSeconds(30 * 60), now);
            campaign.setLastError("PROVIDER_REQUEST_FAILED");
        }
        refreshStats(campaign, now);
    }

    private void ensureInAppNotification(ManualPushCampaignEntity campaign, UUID userId, Instant now) {
        String dedupeKey = "manual-push:" + campaign.getId();
        if (notificationRepository.existsByUserIdAndDedupeKey(userId, dedupeKey)) {
            return;
        }
        notificationRepository.save(new UserNotificationEntity(
                UUID.randomUUID(),
                userId,
                "manual_push",
                campaign.getTitle(),
                campaign.getBody(),
                campaign.getActionUrl(),
                dedupeKey,
                now
        ));
    }

    private boolean sendDevice(PushDeviceEntity device, ManualPushCampaignEntity campaign) {
        String provider = device.getProvider() == null ? "expo" : device.getProvider().toLowerCase(Locale.ROOT);
        if ("rustore".equals(provider)) {
            return ruStorePushService.sendDevice(device, campaign.getTitle(), campaign.getBody(), campaign.getActionUrl());
        }
        return expoPushService.sendDevice(device, campaign.getTitle(), campaign.getBody(), campaign.getActionUrl());
    }

    private void refreshStats(ManualPushCampaignEntity campaign, Instant now) {
        int total = recipientRepository.countByCampaignId(campaign.getId());
        int accepted = recipientRepository.countByCampaignIdAndStatus(campaign.getId(), STATUS_ACCEPTED);
        int queued = recipientRepository.countByCampaignIdAndStatus(campaign.getId(), STATUS_QUEUED);
        campaign.setTargetedUsers(total);
        campaign.setAcceptedUsers(accepted);
        campaign.setQueuedUsers(queued);
        campaign.setNoDeviceUsers(recipientRepository.countQueuedByLastError(campaign.getId(), ERROR_NO_PUSH_DEVICE));
        campaign.setErrorUsers(recipientRepository.countQueuedWithProviderError(campaign.getId()));
        if (queued == 0 && total > 0) {
            campaign.setStatus(STATUS_SENT);
            campaign.setFinishedAt(now);
        } else if (accepted > 0 || campaign.getStartedAt() != null) {
            campaign.setStatus(STATUS_SENDING);
        }
        campaign.setUpdatedAt(now);
    }

    private List<UUID> resolveTargetUserIds(String audience, Instant now) {
        return switch (audience) {
            case "all" -> userProfileRepository.findAllUserIds();
            case "paid" -> userProfileRepository.findPaidUserIds(now);
            case "wibe" -> userProfileRepository.findUserIdsByPlan("wibe");
            case "elite" -> userProfileRepository.findUserIdsByPlan("elite");
            case "trial" -> userProfileRepository.findUserIdsByPlan("trial");
            default -> throw new IllegalArgumentException("MANUAL_PUSH_AUDIENCE_INVALID");
        };
    }

    private String normalizeAudience(String audience) {
        String normalized = normalizeRequired(audience, "MANUAL_PUSH_AUDIENCE_REQUIRED").toLowerCase(Locale.ROOT);
        if (!List.of("all", "paid", "wibe", "elite", "trial").contains(normalized)) {
            throw new IllegalArgumentException("MANUAL_PUSH_AUDIENCE_INVALID");
        }
        return normalized;
    }

    private String normalizeRequired(String value, String errorCode) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException(errorCode);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Map<String, Object> toMap(ManualPushCampaignEntity campaign) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", campaign.getId());
        map.put("title", campaign.getTitle());
        map.put("body", campaign.getBody());
        map.put("actionUrl", campaign.getActionUrl());
        map.put("audience", campaign.getAudience());
        map.put("status", campaign.getStatus());
        map.put("scheduledAt", campaign.getScheduledAt());
        map.put("targetedUsers", campaign.getTargetedUsers());
        map.put("queuedUsers", campaign.getQueuedUsers());
        map.put("acceptedUsers", campaign.getAcceptedUsers());
        map.put("errorUsers", campaign.getErrorUsers());
        map.put("noDeviceUsers", campaign.getNoDeviceUsers());
        map.put("lastError", campaign.getLastError());
        map.put("createdAt", campaign.getCreatedAt());
        map.put("updatedAt", campaign.getUpdatedAt());
        map.put("startedAt", campaign.getStartedAt());
        map.put("finishedAt", campaign.getFinishedAt());
        return map;
    }
}
