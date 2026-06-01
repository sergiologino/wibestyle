package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.dto.UpdateProfileRequest;
import ru.wibestyle.api.repository.AvatarRepository;
import ru.wibestyle.api.repository.UserProfileRepository;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.support.AuthSupport;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AvatarRepository avatarRepository;
    private final EntitlementsService entitlementsService;

    public ProfileService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            AvatarRepository avatarRepository,
            EntitlementsService entitlementsService
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.avatarRepository = avatarRepository;
        this.entitlementsService = entitlementsService;
    }

    public Map<String, Object> buildMeResponse(String authorization) {
        UUID userId = AuthSupport.requireUserId(authorization);
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));

        UserProfileEntity profile = requireProfile(userId);
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId().toString());
        if (user.getPhone() != null) {
            userMap.put("phone", user.getPhone());
        }
        if (user.getEmail() != null) {
            userMap.put("email", user.getEmail());
        }
        if (user.getLogin() != null) {
            userMap.put("login", user.getLogin());
        }
        response.put("user", userMap);
        response.put("profile", toProfileMap(profile));
        response.put("entitlements", entitlementsService.forProfile(profile));
        return response;
    }

    public UserProfileEntity anonymousProfile() {
        UserProfileEntity profile = new UserProfileEntity(UUID.randomUUID(), Instant.now());
        profile.setPlan("trial");
        profile.setTrialGenerationsLeft(5);
        return profile;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(UUID userId) {
        return Map.of("profile", toProfileMap(requireProfile(userId)));
    }

    /** Ensures profile row exists and returns the admin/user profile map. */
    @Transactional
    public Map<String, Object> ensureProfileMap(UUID userId) {
        return toProfileMap(ensureProfile(userId));
    }

    @Transactional
    public Map<String, Object> updateProfile(UUID userId, UpdateProfileRequest request) {
        UserProfileEntity profile = requireProfile(userId);
        applyProfileUpdate(profile, request);
        validateRequiredAnthropometryIfPresent(request);
        profile.setUpdatedAt(Instant.now());
        userProfileRepository.save(profile);
        return Map.of("profile", toProfileMap(profile));
    }

    @Transactional
    public Map<String, Object> resetProfile(UUID userId) {
        UserProfileEntity profile = requireProfile(userId);
        profile.setDisplayName(null);
        profile.setGender(null);
        profile.setHeightCm(null);
        profile.setWeightKg(null);
        profile.setBustCm(null);
        profile.setWaistCm(null);
        profile.setHipsCm(null);
        profile.setShoeSizeEu(null);
        profile.setClothingSize(null);
        profile.setProfileType(null);
        profile.setSizingSystem(null);
        profile.setPrivacyFaceHidden(true);
        profile.setPrivacyBackgroundHidden(false);
        profile.setPrivacyFeaturesHidden(false);
        profile.setUpdatedAt(Instant.now());
        userProfileRepository.save(profile);
        return Map.of("profile", toProfileMap(profile));
    }

    @Transactional
    public UserProfileEntity ensureProfile(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseGet(() -> userProfileRepository.save(new UserProfileEntity(userId, Instant.now())));
    }

    @Transactional(readOnly = true)
    public UserProfileEntity requireProfile(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("PROFILE_NOT_FOUND"));
    }

    public void validateRequiredAnthropometry(UserProfileEntity profile) {
        if (profile.getHeightCm() == null || profile.getBustCm() == null
                || profile.getWaistCm() == null || profile.getHipsCm() == null) {
            throw new IllegalArgumentException("ANTHROPOMETRY_REQUIRED");
        }
    }

    private void validateRequiredAnthropometryIfPresent(UpdateProfileRequest request) {
        if (request.heightCm() != null && (request.heightCm() < 120 || request.heightCm() > 230)) {
            throw new IllegalArgumentException("INVALID_HEIGHT");
        }
    }

    private void applyProfileUpdate(UserProfileEntity profile, UpdateProfileRequest request) {
        if (request.displayName() != null) profile.setDisplayName(request.displayName());
        if (request.gender() != null) profile.setGender(request.gender());
        if (request.heightCm() != null) profile.setHeightCm(request.heightCm());
        if (request.weightKg() != null) profile.setWeightKg(request.weightKg());
        if (request.bustCm() != null) profile.setBustCm(request.bustCm());
        if (request.waistCm() != null) profile.setWaistCm(request.waistCm());
        if (request.hipsCm() != null) profile.setHipsCm(request.hipsCm());
        if (request.shoeSizeEu() != null) profile.setShoeSizeEu(request.shoeSizeEu());
        if (request.clothingSize() != null) profile.setClothingSize(request.clothingSize());
        if (request.profileType() != null) profile.setProfileType(request.profileType());
        if (request.sizingSystem() != null) profile.setSizingSystem(request.sizingSystem());
        if (request.privacyFaceHidden() != null) profile.setPrivacyFaceHidden(request.privacyFaceHidden());
        if (request.privacyBackgroundHidden() != null) profile.setPrivacyBackgroundHidden(request.privacyBackgroundHidden());
        if (request.privacyFeaturesHidden() != null) profile.setPrivacyFeaturesHidden(request.privacyFeaturesHidden());
    }

    private Map<String, Object> toProfileMap(UserProfileEntity profile) {
        Map<String, Object> anthropometry = new HashMap<>();
        if (profile.getHeightCm() != null) anthropometry.put("heightCm", profile.getHeightCm());
        if (profile.getWeightKg() != null) anthropometry.put("weightKg", profile.getWeightKg());
        if (profile.getBustCm() != null) anthropometry.put("bustCm", profile.getBustCm());
        if (profile.getWaistCm() != null) anthropometry.put("waistCm", profile.getWaistCm());
        if (profile.getHipsCm() != null) anthropometry.put("hipsCm", profile.getHipsCm());
        if (profile.getShoeSizeEu() != null) anthropometry.put("shoeSizeEu", profile.getShoeSizeEu());
        if (profile.getClothingSize() != null) anthropometry.put("clothingSize", profile.getClothingSize());

        Map<String, Object> map = new HashMap<>();
        map.put("userId", profile.getUserId().toString());
        map.put("plan", profile.getPlan());
        map.put("trialGenerationsLeft", profile.getTrialGenerationsLeft());
        map.put("planGenerationsLeft", profile.getPlanGenerationsLeft());
        if (profile.getBillingPeriod() != null) {
            map.put("billingPeriod", profile.getBillingPeriod());
        }
        if (profile.getSubscriptionExpiresAt() != null) {
            map.put("subscriptionExpiresAt", profile.getSubscriptionExpiresAt().toString());
        }
        if (profile.getPromoDiscountPercent() != null && profile.getPromoDiscountPercent() > 0) {
            map.put("promoDiscountPercent", profile.getPromoDiscountPercent());
        }
        if (profile.getDisplayName() != null) map.put("displayName", profile.getDisplayName());
        if (profile.getGender() != null) map.put("gender", profile.getGender());
        if (!anthropometry.isEmpty()) map.put("anthropometry", anthropometry);
        map.put("privacy", Map.of(
                "faceHidden", profile.isPrivacyFaceHidden(),
                "backgroundHidden", profile.isPrivacyBackgroundHidden(),
                "featuresHidden", profile.isPrivacyFeaturesHidden()
        ));
        avatarRepository.findByUserIdAndActiveTrue(profile.getUserId())
                .ifPresent(avatar -> map.put("activeAvatarId", avatar.getId().toString()));
        return map;
    }
}
