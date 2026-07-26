package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.UserActivityEntity;
import ru.wibestyle.api.repository.UserActivityRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class UserActivityService {
    private static final Duration SEEN_WRITE_THROTTLE = Duration.ofMinutes(15);

    private final UserActivityRepository activityRepository;

    public UserActivityService(UserActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @Transactional
    public void recordSeen(UUID userId) {
        if (userId == null) {
            return;
        }
        Instant now = Instant.now();
        UserActivityEntity activity = activityRepository.findById(userId)
                .orElseGet(() -> new UserActivityEntity(userId, now));
        if (activity.getLastSeenAt() != null && activity.getLastSeenAt().isAfter(now.minus(SEEN_WRITE_THROTTLE))) {
            return;
        }
        activity.setLastSeenAt(now);
        activity.setUpdatedAt(now);
        activityRepository.save(activity);
    }

    @Transactional
    public void recordTryOn(UUID userId) {
        if (userId == null) {
            return;
        }
        Instant now = Instant.now();
        UserActivityEntity activity = activityRepository.findById(userId)
                .orElseGet(() -> new UserActivityEntity(userId, now));
        activity.setLastSeenAt(now);
        activity.setLastTryOnAt(now);
        activity.setUpdatedAt(now);
        activityRepository.save(activity);
    }

    @Transactional
    public void recordGallery(UUID userId) {
        if (userId == null) {
            return;
        }
        Instant now = Instant.now();
        UserActivityEntity activity = activityRepository.findById(userId)
                .orElseGet(() -> new UserActivityEntity(userId, now));
        activity.setLastSeenAt(now);
        activity.setLastGalleryAt(now);
        activity.setUpdatedAt(now);
        activityRepository.save(activity);
    }
}
