package ru.wibestyle.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.wibestyle.api.config.FeatureFlagsProperties;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/features")
public class FeaturesController {

    private final FeatureFlagsProperties featureFlagsProperties;

    public FeaturesController(FeatureFlagsProperties featureFlagsProperties) {
        this.featureFlagsProperties = featureFlagsProperties;
    }

    @GetMapping
    public Map<String, Object> features() {
        return Map.of("flags", featureFlagsProperties.getFlags());
    }
}
