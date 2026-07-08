package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.AvatarRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminUserManagementService {

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
        List<Map<String, Object>> items = new ArrayList<>();
        for (UserEntity user : userRepository.findAll()) {
            items.add(toUserSummary(user));
        }
        return Map.of("items", items);
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
        map.put("createdAt", user.getCreatedAt().toString());
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
                    map.put("activeAvatarPhotoUrl", "/api/v1/admin/users/" + user.getId()
                            + "/avatars/" + avatar.getId() + "/photo?variant=processed");
                } else if (avatar.getPhotoOriginalPath() != null) {
                    map.put("activeAvatarPhotoUrl", "/api/v1/admin/users/" + user.getId()
                            + "/avatars/" + avatar.getId() + "/photo?variant=original");
                }
            });
        });
        return map;
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
