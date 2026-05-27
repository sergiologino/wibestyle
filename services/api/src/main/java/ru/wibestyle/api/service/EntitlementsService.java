package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import ru.wibestyle.api.config.BillingProperties;
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
        Map<String, Object> entitlements = new HashMap<>();
        entitlements.put("singleTryOn", true);
        entitlements.put("multiItemTryOn", "elite".equals(plan));
        entitlements.put("priorityQueue", "elite".equals(plan));
        entitlements.put("eliteFrame", "elite".equals(plan));
        entitlements.put("earlyAccess", "elite".equals(plan));
        entitlements.put("videoTryOn", "elite".equals(plan) && featureFlagsProperties.isEnabled("videoTryOn"));
        entitlements.put("search", featureFlagsProperties.isEnabled("search"));
        entitlements.put("sizeAdvisory", featureFlagsProperties.isEnabled("sizeAdvisory"));
        entitlements.put("favorites", !"trial".equals(plan) || profile.getTrialGenerationsLeft() >= 0);
        entitlements.put("gallery", true);
        entitlements.put("history", !"trial".equals(plan));
        return entitlements;
    }
}
