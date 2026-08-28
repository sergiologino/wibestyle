package ru.wibestyle.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.support.AuthSupport;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/features")
public class FeaturesController {

    private final FeatureFlagsProperties featureFlagsProperties;
    private final UserRepository userRepository;

    public FeaturesController(FeatureFlagsProperties featureFlagsProperties, UserRepository userRepository) {
        this.featureFlagsProperties = featureFlagsProperties;
        this.userRepository = userRepository;
    }

    @GetMapping
    public Map<String, Object> features() {
        Map<String, Object> result = new HashMap<>();
        result.put("flags", featureFlagsProperties.getFlags());
        result.put("stylistFocusGroupOnly", featureFlagsProperties.isStylistFocusGroupOnly());
        return result;
    }

    @GetMapping("/me")
    public Map<String, Object> myFeatures(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UUID userId = AuthSupport.optionalUserId(authorization);
        boolean inFocusGroup = userId != null
                && userRepository.findById(userId).map(user -> user.isStylistFocusGroup()).orElse(false);
        Map<String, Boolean> effectiveFlags = new HashMap<>(featureFlagsProperties.getFlags());
        effectiveFlags.put("stylist", featureFlagsProperties.isStylistAvailableFor(inFocusGroup));
        Map<String, Object> result = new HashMap<>();
        result.put("flags", effectiveFlags);
        result.put("stylistFocusGroupOnly", featureFlagsProperties.isStylistFocusGroupOnly());
        result.put("stylistFocusGroup", inFocusGroup);
        return result;
    }
}
