package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import ru.wibestyle.api.domain.AvatarEntity;
import ru.wibestyle.api.domain.AvatarStatus;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.AvatarRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.repository.UserRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminUserManagementService {

    private static final List<AvatarStatus> FAILED_AVATAR_STATUSES = List.of(
            AvatarStatus.REJECTED,
            AvatarStatus.VALIDATION_FAILED
    );

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AvatarRepository avatarRepository;
    private final DeviceTrustService deviceTrustService;
    private final ProfileService profileService;
    private final TokenIssuanceService tokenIssuanceService;
    private final AccountDeletionService accountDeletionService;

    public AdminUserManagementService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            AvatarRepository avatarRepository,
            DeviceTrustService deviceTrustService,
            ProfileService profileService,
            TokenIssuanceService tokenIssuanceService,
            AccountDeletionService accountDeletionService
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.avatarRepository = avatarRepository;
        this.deviceTrustService = deviceTrustService;
        this.profileService = profileService;
        this.tokenIssuanceService = tokenIssuanceService;
        this.accountDeletionService = accountDeletionService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listUsers() {
        return listUsers(0, 30, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listUsers(int page, int limit, String query) {
        int safePage = Math.max(0, page);
        int safeLimit = Math.min(Math.max(1, limit), 100);
        String normalizedQuery = query == null || query.isBlank() ? "" : query.trim();
        Page<UserEntity> users = userRepository.searchAdminUsers(normalizedQuery, PageRequest.of(safePage, safeLimit));
        Map<String, Object> response = new HashMap<>();
        response.put("items", users.getContent().stream().map(this::toUserSummary).toList());
        response.put("page", safePage);
        response.put("limit", safeLimit);
        response.put("total", users.getTotalElements());
        response.put("totalPages", users.getTotalPages());
        response.put("hasMore", users.hasNext());
        return response;
    }

    @Transactional
    public Map<String, Object> updateSubscription(UUID userId, AdminSubscriptionUpdateRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        UserProfileEntity profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));

        String plan = request.plan() == null ? profile.getPlan() : request.plan();
        profile.setPlan(plan);
        if (request.trialGenerationsLeft() != null) {
            profile.setTrialGenerationsLeft(request.trialGenerationsLeft());
        }
        if (request.planGenerationsLeft() != null) {
            profile.setPlanGenerationsLeft(request.planGenerationsLeft());
        }
        if (request.billingPeriod() != null) {
            profile.setBillingPeriod(request.billingPeriod());
        }
        if (request.subscriptionExpiresAt() != null) {
            profile.setSubscriptionExpiresAt(request.subscriptionExpiresAt());
        }
        profile.setUpdatedAt(Instant.now());
        userProfileRepository.save(profile);

        Map<String, Object> response = new HashMap<>(toUserSummary(user));
        response.put("profile", profileService.getProfile(userId).get("profile"));
        return response;
    }

    @Transactional
    public Map<String, Object> impersonate(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        profileService.ensureProfile(userId);
        return tokenIssuanceService.issueImpersonationTokens(user);
    }

    @Transactional
    public Map<String, Object> deleteUser(UUID userId) {
        return accountDeletionService.deleteAccount(userId, "DELETE");
    }

    private Map<String, Object> toUserSummary(UserEntity user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId().toString());
        map.put("phone", user.getPhone());
        map.put("email", user.getEmail());
        map.put("login", user.getLogin());
        map.put("primaryAuth", user.getPrimaryAuth());
        map.put("stylistFocusGroup", user.isStylistFocusGroup());
        map.put("createdAt", user.getCreatedAt().toString());
        map.put("avatarUploadAttempts", avatarRepository.countByUserIdAndStatusNot(user.getId(), AvatarStatus.DELETED));
        map.put("avatarFailedAttempts", avatarRepository.countByUserIdAndStatusIn(user.getId(), FAILED_AVATAR_STATUSES));
        avatarRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(user.getId(), FAILED_AVATAR_STATUSES)
                .stream()
                .filter(avatar -> avatar.getPhotoOriginalPath() != null)
                .findFirst()
                .ifPresent(avatar -> map.put("lastFailedAvatarPhotoUrl", adminAvatarPhotoUrl(user.getId(), avatar, "original")));
        List<DeviceTrustService.DeviceAdminRecord> devices = deviceTrustService.listAdminDevices(user.getId());
        map.put("devices", devices.stream().map(device -> {
            Map<String, Object> deviceMap = new HashMap<>();
            deviceMap.put("deviceHash", device.deviceHash());
            deviceMap.put("deviceHashShort", device.deviceHash().substring(0, Math.min(12, device.deviceHash().length())));
            deviceMap.put("userFirstSeenAt", device.userFirstSeenAt().toString());
            deviceMap.put("userLastSeenAt", device.userLastSeenAt().toString());
            deviceMap.put("deviceFirstSeenAt", device.deviceFirstSeenAt().toString());
            deviceMap.put("deviceLastSeenAt", device.deviceLastSeenAt().toString());
            deviceMap.put("registrationCount", device.registrationCount());
            deviceMap.put("deletedAccountCount", device.deletedAccountCount());
            if (device.lastAccountDeletedAt() != null) {
                deviceMap.put("lastAccountDeletedAt", device.lastAccountDeletedAt().toString());
            }
            deviceMap.put("trialGenerationsUsed", device.trialGenerationsUsed());
            deviceMap.put("trialGenerationsLeft", device.trialGenerationsLeft());
            return deviceMap;
        }).toList());
        userProfileRepository.findById(user.getId()).ifPresent(profile -> {
            map.put("plan", profile.getPlan());
            map.put("trialGenerationsLeft", profile.getTrialGenerationsLeft());
            map.put("planGenerationsLeft", profile.getPlanGenerationsLeft());
            map.put("displayName", profile.getDisplayName());
            avatarRepository.findByUserIdAndActiveTrue(user.getId()).ifPresent(avatar -> {
                if (avatar.getPhotoProcessedPath() != null) {
                    map.put("activeAvatarPhotoUrl", adminAvatarPhotoUrl(user.getId(), avatar, "processed"));
                } else if (avatar.getPhotoOriginalPath() != null) {
                    map.put("activeAvatarPhotoUrl", adminAvatarPhotoUrl(user.getId(), avatar, "original"));
                }
            });
        });
        return map;
    }

    @Transactional
    public Map<String, Object> updateStylistFocusGroup(UUID userId, boolean enabled) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        user.setStylistFocusGroup(enabled);
        userRepository.save(user);
        return toUserSummary(user);
    }

    private static String adminAvatarPhotoUrl(UUID userId, AvatarEntity avatar, String variant) {
        return "/api/v1/admin/users/" + userId + "/avatars/" + avatar.getId() + "/photo?variant=" + variant;
    }

    public record AdminSubscriptionUpdateRequest(
            String plan,
            Integer trialGenerationsLeft,
            Integer planGenerationsLeft,
            String billingPeriod,
            Instant subscriptionExpiresAt
    ) {
    }
}
