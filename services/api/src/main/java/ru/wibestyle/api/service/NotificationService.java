package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.PushDeviceEntity;
import ru.wibestyle.api.domain.UserNotificationEntity;
import ru.wibestyle.api.repository.PushDeviceRepository;
import ru.wibestyle.api.repository.UserNotificationRepository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {
    private final UserNotificationRepository notificationRepository;
    private final PushDeviceRepository pushDeviceRepository;
    private final ExpoPushService expoPushService;

    public NotificationService(UserNotificationRepository notificationRepository,
                               PushDeviceRepository pushDeviceRepository,
                               ExpoPushService expoPushService) {
        this.notificationRepository = notificationRepository;
        this.pushDeviceRepository = pushDeviceRepository;
        this.expoPushService = expoPushService;
    }

    @Transactional
    public boolean create(UUID userId, String type, String title, String body, String actionUrl, String dedupeKey) {
        if (notificationRepository.existsByUserIdAndDedupeKey(userId, dedupeKey)) return false;
        notificationRepository.saveAndFlush(new UserNotificationEntity(
                UUID.randomUUID(), userId, type, title, body, actionUrl, dedupeKey, Instant.now()));
        expoPushService.send(userId, title, body, actionUrl);
        return true;
    }

    public Map<String, Object> list(UUID userId) {
        List<Map<String, Object>> items = notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationService::toMap).toList();
        return Map.of("items", items);
    }

    @Transactional
    public Map<String, Object> markRead(UUID userId, UUID notificationId) {
        UserNotificationEntity entity = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("NOTIFICATION_NOT_FOUND"));
        if (entity.getReadAt() == null) {
            entity.setReadAt(Instant.now());
            notificationRepository.save(entity);
        }
        return toMap(entity);
    }

    @Transactional
    public void registerPushDevice(UUID userId, String token, String platform) {
        if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
            throw new IllegalArgumentException("INVALID_EXPO_PUSH_TOKEN");
        }
        Instant now = Instant.now();
        PushDeviceEntity device = pushDeviceRepository.findByExpoPushToken(token)
                .orElseGet(() -> new PushDeviceEntity(UUID.randomUUID(), userId, token, platform, now));
        device.setUserId(userId);
        device.setPlatform(platform);
        device.setEnabled(true);
        device.setUpdatedAt(now);
        pushDeviceRepository.save(device);
    }

    @Transactional
    public void unregisterPushDevice(UUID userId, String token) {
        pushDeviceRepository.findByExpoPushToken(token).filter(d -> d.getUserId().equals(userId)).ifPresent(device -> {
            device.setEnabled(false);
            device.setUpdatedAt(Instant.now());
            pushDeviceRepository.save(device);
        });
    }

    private static Map<String, Object> toMap(UserNotificationEntity entity) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", entity.getId().toString());
        map.put("type", entity.getType());
        map.put("title", entity.getTitle());
        map.put("body", entity.getBody());
        map.put("actionUrl", entity.getActionUrl());
        map.put("read", entity.getReadAt() != null);
        map.put("createdAt", entity.getCreatedAt().toString());
        return map;
    }
}
