package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.domain.UserProfileEntity;

import java.util.HashMap;
import java.util.Map;

@Service
public class EntitlementsService {

    private final FeatureFlagsProperties featureFlagsProperties;

    public EntitlementsService(FeatureFlagsProperties featureFlagsProperties) {
        this.featureFlagsProperties = featureFlagsProperties;
    }

    public Map<String, Object> forProfile(UserProfileEntity profile) {
        String plan = profile.getPlan();
        boolean paidAccess = "wibe".equals(plan) || "elite".equals(plan)
                || (!"trial".equals(plan) && profile.getPlanGenerationsLeft() > 0);
        Map<String, Object> entitlements = new HashMap<>();
        entitlements.put("singleTryOn", true);
        entitlements.put("multiItemTryOn", "elite".equals(plan));
        entitlements.put("priorityQueue", "elite".equals(plan));
        entitlements.put("eliteFrame", "elite".equals(plan));
        entitlements.put("earlyAccess", "elite".equals(plan));
        boolean videoEnabled = featureFlagsProperties.isEnabled("videoTryOn");
        boolean trialVideoAvailable = "trial".equals(plan) && profile.getTrialVideoGenerationsLeft() > 0;
        boolean packageVideoAvailable = BillingService.isPackagePlan(plan) && profile.getPlanGenerationsLeft() > 0;
        boolean bonusVideoAvailable = profile.getBonusGenerationsLeft() > 0;
        entitlements.put(
                "videoTryOn",
                videoEnabled && ("elite".equals(plan) || trialVideoAvailable || packageVideoAvailable || bonusVideoAvailable)
        );
        entitlements.put("trialVideoGenerationsLeft", profile.getTrialVideoGenerationsLeft());
        entitlements.put("search", featureFlagsProperties.isEnabled("search"));
        entitlements.put("sizeAdvisory", featureFlagsProperties.isEnabled("sizeAdvisory"));
        entitlements.put("favorites", paidAccess || profile.getTrialGenerationsLeft() >= 0);
        entitlements.put("gallery", true);
        entitlements.put("history", paidAccess);
        return entitlements;
    }
}
