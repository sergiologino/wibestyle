package ru.wibestyle.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.domain.PlatformSettingEntity;
import ru.wibestyle.api.repository.PlatformSettingRepository;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
public class PlatformSettingsService {

    public static final String BLOCK_GOOGLE_OAUTH_KEY = "block_google_oauth";
    public static final String TRY_ON_SCENES_ENABLED_KEY = "try_on_scenes_enabled";
    public static final String TRY_ON_POSE_CHANGE_ENABLED_KEY = "try_on_pose_change_enabled";
    public static final String TRY_ON_SCENE_PROMPTS_KEY = "try_on_scene_prompts";

    private static final Set<String> SCENE_KEYS = Set.of(
            "outerwear", "office", "casual", "homewear", "sleepwear",
            "evening", "sportswear", "shoes", "revealing", "default"
    );
    private static final Map<String, String> DEFAULT_SCENE_PROMPTS = defaultScenePrompts();

    private final PlatformSettingRepository platformSettingRepository;
    private final ObjectMapper objectMapper;

    public PlatformSettingsService(PlatformSettingRepository platformSettingRepository, ObjectMapper objectMapper) {
        this.platformSettingRepository = platformSettingRepository;
        this.objectMapper = objectMapper;
    }

    public boolean isBlockGoogleOAuth() {
        return getBoolean(BLOCK_GOOGLE_OAUTH_KEY, false);
    }

    public boolean isTryOnScenesEnabled() {
        return getBoolean(TRY_ON_SCENES_ENABLED_KEY, true);
    }

    public boolean isTryOnPoseChangeEnabled() {
        return getBoolean(TRY_ON_POSE_CHANGE_ENABLED_KEY, true);
    }

    public Map<String, String> getTryOnScenePrompts() {
        Map<String, String> result = new LinkedHashMap<>(DEFAULT_SCENE_PROMPTS);
        platformSettingRepository.findById(TRY_ON_SCENE_PROMPTS_KEY).ifPresent(setting -> {
            try {
                Map<String, String> saved = objectMapper.readValue(setting.getValue(), new TypeReference<>() {
                });
                saved.forEach((key, value) -> {
                    if (SCENE_KEYS.contains(key) && value != null && !value.isBlank()) {
                        result.put(key, normalizePrompt(value));
                    }
                });
            } catch (JsonProcessingException ignored) {
                // Keep defaults if an old or manually edited value is malformed.
            }
        });
        return result;
    }

    @Transactional
    public void setBlockGoogleOAuth(boolean block) {
        setValue(BLOCK_GOOGLE_OAUTH_KEY, Boolean.toString(block));
    }

    @Transactional
    public void updateTryOnSceneSettings(Boolean enabled, Boolean allowPoseChange, Map<String, String> scenePrompts) {
        if (enabled != null) {
            setValue(TRY_ON_SCENES_ENABLED_KEY, Boolean.toString(enabled));
        }
        if (allowPoseChange != null) {
            setValue(TRY_ON_POSE_CHANGE_ENABLED_KEY, Boolean.toString(allowPoseChange));
        }
        if (scenePrompts == null) {
            return;
        }

        Map<String, String> normalized = new LinkedHashMap<>(getTryOnScenePrompts());
        scenePrompts.forEach((key, value) -> {
            if (!SCENE_KEYS.contains(key)) {
                throw new IllegalArgumentException("UNKNOWN_TRY_ON_SCENE");
            }
            if (value == null || value.isBlank()) {
                normalized.put(key, DEFAULT_SCENE_PROMPTS.get(key));
            } else {
                if (value.length() > 1000) {
                    throw new IllegalArgumentException("TRY_ON_SCENE_PROMPT_TOO_LONG");
                }
                normalized.put(key, normalizePrompt(value));
            }
        });
        try {
            setValue(TRY_ON_SCENE_PROMPTS_KEY, objectMapper.writeValueAsString(normalized));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize try-on scene prompts", ex);
        }
    }

    public Map<String, Object> snapshot() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("blockGoogleOAuth", isBlockGoogleOAuth());
        result.put("tryOnScenesEnabled", isTryOnScenesEnabled());
        result.put("tryOnPoseChangeEnabled", isTryOnPoseChangeEnabled());
        result.put("tryOnScenePrompts", getTryOnScenePrompts());
        return result;
    }

    private boolean getBoolean(String key, boolean defaultValue) {
        return platformSettingRepository.findById(key)
                .map(setting -> Boolean.parseBoolean(setting.getValue()))
                .orElse(defaultValue);
    }

    private void setValue(String key, String value) {
        PlatformSettingEntity setting = platformSettingRepository.findById(key)
                .orElseGet(() -> new PlatformSettingEntity(key, value, Instant.now()));
        setting.setValue(value);
        setting.setUpdatedAt(Instant.now());
        platformSettingRepository.save(setting);
    }

    private static String normalizePrompt(String value) {
        return value.lines()
                .map(line -> line.trim().replaceAll("\\s+", " "))
                .filter(line -> !line.isBlank())
                .reduce((left, right) -> left + "\n" + right)
                .orElse("");
    }

    private static Map<String, String> defaultScenePrompts() {
        Map<String, String> prompts = new LinkedHashMap<>();
        prompts.put("outerwear", """
                a stylish city street with natural daylight appropriate for the season
                a landscaped park or nature path with realistic seasonal light
                a modern urban square with premium fashion photography lighting
                """.trim());
        prompts.put("office", """
                a modern premium office with clean professional lighting
                a refined business lounge with large windows
                an elegant quiet cafe suitable for a business meeting
                """.trim());
        prompts.put("casual", """
                a lively urban street with natural lifestyle lighting
                a bright modern cafe with soft window light
                a stylish shopping gallery with realistic ambient light
                """.trim());
        prompts.put("homewear", """
                a bright tasteful living room with soft natural window light
                a modern comfortable kitchen with warm daylight
                a cozy minimalist home interior with realistic ambient light
                """.trim());
        prompts.put("sleepwear", """
                an elegant cozy bedroom with warm ambient light; tasteful, non-erotic catalog styling
                a refined dressing room with soft natural light; tasteful, non-erotic catalog styling
                a premium hotel room interior; tasteful, non-erotic catalog styling
                """.trim());
        prompts.put("evening", """
                an elegant restaurant interior with cinematic evening light
                a theatre foyer or art gallery with refined ambient lighting
                a premium hotel lobby with sophisticated evening light
                """.trim());
        prompts.put("sportswear", """
                a modern fitness studio with energetic professional lighting
                a green city park with bright natural daylight
                an outdoor sports area with realistic active lifestyle lighting
                """.trim());
        prompts.put("shoes", """
                a fashionable urban sidewalk with the footwear clearly visible
                a minimalist shopping gallery with the footwear clearly visible
                a clean architectural city setting with realistic ground contact and shadows
                """.trim());
        prompts.put("revealing", """
                a premium neutral fashion studio; strictly adult, PG-safe and non-erotic
                a tasteful resort terrace; strictly adult, PG-safe and non-erotic
                an elegant dressing room; strictly adult, PG-safe and non-erotic
                """.trim());
        prompts.put("default", """
                a refined lifestyle interior that naturally matches the garment
                a stylish city location that naturally matches the garment
                a minimalist premium fashion setting with realistic light
                """.trim());
        return Map.copyOf(prompts);
    }
}
