package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "wibestyle.features")
public class FeatureFlagsProperties {

    private Map<String, Boolean> flags = defaultFlags();

    public Map<String, Boolean> getFlags() {
        return flags;
    }

    public void setFlags(Map<String, Boolean> flags) {
        this.flags = flags;
    }

    public boolean isEnabled(String flag) {
        return flags.getOrDefault(flag, false);
    }

    private static Map<String, Boolean> defaultFlags() {
        Map<String, Boolean> map = new HashMap<>();
        map.put("videoTryOn", false);
        map.put("multiItemTryOn", false);
        map.put("search", false);
        map.put("sizeAdvisory", false);
        map.put("eliteFrame", false);
        map.put("futureStylist", false);
        map.put("futureMakeup", false);
        map.put("futureHairstyle", false);
        return map;
    }
}
