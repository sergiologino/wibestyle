package ru.wibestyle.api.ai;

import org.springframework.stereotype.Component;
import ru.wibestyle.api.domain.TryOnSessionEntity;
import ru.wibestyle.api.service.PlatformSettingsService;

import java.util.Locale;
import java.util.Map;
import java.util.List;

@Component
public class TryOnScenePromptBuilder {

    private final PlatformSettingsService settingsService;

    public TryOnScenePromptBuilder(PlatformSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    public String build(TryOnSessionEntity session) {
        if (!settingsService.isTryOnScenesEnabled()) {
            return """
                    SCENE DIRECTIVE: keep the original image1 background and pose.
                    Preserve identity, body proportions, garment accuracy and vertical 3:4 framing.
                    """.trim().replaceAll("\\s+", " ");
        }

        String location = resolveSelectedLocation(session);
        String seasonalContext = seasonalContext(session);
        String pose = settingsService.isTryOnPoseChangeEnabled()
                ? """
                  You may slightly change the customer's pose to a natural catalog or lifestyle pose appropriate for this location.
                  Keep the full body proportions and height impression identical to image1. Do not copy the pose from image2.
                  Keep the garment unobstructed: no crossed arms, bags or objects covering its important details.
                  """
                : "Keep the original pose from image1.";

        return """
                SCENE AND POSE DIRECTIVE, HIGH PRIORITY:
                This directive overrides any earlier request for a neutral studio background, original background, calm stance or original pose.
                Place the customer in: %s.
                %s
                %s
                Preserve the exact face, hair, age impression, body shape and anthropometry from image1.
                Preserve the exact garment color, cut, material, print and details from image2.
                Photorealistic premium fashion photography, coherent lighting and shadows, vertical 3:4 framing, PG-safe styling.
                """.formatted(location, seasonalContext, pose).trim().replaceAll("\\s+", " ");
    }

    private String resolveSelectedLocation(TryOnSessionEntity session) {
        String custom = sanitizeCustomScene(session.getCustomScene());
        if (custom != null) {
            return custom;
        }
        String preset = session.getScenePreset() == null ? "" : session.getScenePreset().trim().toLowerCase(Locale.ROOT);
        String presetLocation = locationForPreset(preset);
        if (presetLocation != null) {
            return presetLocation;
        }

        String sceneKey = resolveSceneKey(session);
        Map<String, String> prompts = settingsService.getTryOnScenePrompts();
        return selectStableOption(
                prompts.getOrDefault(sceneKey, prompts.get("default")),
                session
        );
    }

    private static String locationForPreset(String preset) {
        return switch (preset) {
            case "studio_front" -> "a clean premium fitting studio with soft neutral lighting, standing front-facing in a calm catalog pose";
            case "city_walk" -> "a modern city street in daylight, standing or gently walking in a natural lifestyle pose";
            case "cafe_turn" -> "a stylish cafe terrace or boutique interior, three-quarter turn pose with the full outfit clearly visible";
            case "park_walk" -> "a calm green park path in daylight, relaxed full-body walking pose with uncluttered background";
            case "evening_event" -> "an elegant evening lobby or restaurant entrance, confident full-body pose with premium lighting";
            default -> null;
        };
    }

    private static String sanitizeCustomScene(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.length() > 512 ? normalized.substring(0, 512) : normalized;
    }

    private static String selectStableOption(String configured, TryOnSessionEntity session) {
        if (configured == null || configured.isBlank()) {
            return "a refined lifestyle setting that naturally matches the garment";
        }
        List<String> options = configured.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .toList();
        if (options.isEmpty()) {
            return "a refined lifestyle setting that naturally matches the garment";
        }
        int seed = session.getId() == null ? 0 : session.getId().hashCode();
        return options.get(Math.floorMod(seed, options.size()));
    }

    static String resolveSceneKey(TryOnSessionEntity session) {
        String category = GarmentClassification.normalizeCategory(session.getGarmentCategory());
        String profile = GarmentClassification.normalizePromptProfile(
                session.getGarmentPromptProfile(),
                session.getGarmentCategory()
        );
        String haystack = (category + " " + profile + " "
                + (session.getProductTitle() == null ? "" : session.getProductTitle()))
                .toLowerCase(Locale.ROOT);

        if ("homewear_safe".equals(profile) || matchesAny(haystack,
                "sleepwear", "nightgown", "nightshirt", "pyjama", "pajama",
                "пижам", "ночн", "пеньюар")) {
            return "sleepwear";
        }
        if ("outerwear".equals(profile) || "jacket".equals(category)) {
            return "outerwear";
        }
        if ("revealing_safe".equals(profile)) {
            return "revealing";
        }
        if ("shoes".equals(profile)) {
            return "shoes";
        }
        if (matchesAny(haystack, "sport", "fitness", "running", "training",
                "спорт", "фитнес", "бег", "трениров")) {
            return "sportswear";
        }
        if (matchesAny(haystack, "office", "business", "blazer", "suit",
                "офис", "делов", "блейзер", "костюм")) {
            return "office";
        }
        if (matchesAny(haystack, "homewear", "lounge", "robe",
                "домаш", "халат")) {
            return "homewear";
        }
        if (matchesAny(haystack, "evening", "cocktail", "party", "formal",
                "вечер", "коктейл", "празднич", "нарядн")) {
            return "evening";
        }
        return "casual";
    }

    static String seasonalContext(TryOnSessionEntity session) {
        String category = GarmentClassification.normalizeCategory(session.getGarmentCategory());
        String profile = GarmentClassification.normalizePromptProfile(
                session.getGarmentPromptProfile(),
                session.getGarmentCategory()
        );
        String title = session.getProductTitle() == null ? "" : session.getProductTitle();
        String haystack = (category + " " + profile + " " + title).toLowerCase(Locale.ROOT);

        if ("outerwear".equals(profile) || "jacket".equals(category)) {
            if (matchesAny(haystack,
                    "fur", "fur coat", "shearling", "down jacket", "puffer", "parka",
                    "шуб", "мех", "дублен", "пухов", "парка")) {
                return "Seasonal environment rule: if the scene is outdoors, use a coherent snowy winter setting with cold natural light; avoid summer greenery, beach, hot-weather or blooming-garden backgrounds.";
            }
            if (matchesAny(haystack,
                    "raincoat", "trench", "mac coat", "waterproof",
                    "плащ", "тренч", "дождев")) {
                return "Seasonal environment rule: if the scene is outdoors, use an overcast autumn or cool spring setting, slightly damp pavement if appropriate; avoid hot summer scenery and snow unless the product clearly looks winter-only.";
            }
            if (matchesAny(haystack,
                    "coat", "overcoat", "wool coat",
                    "пальто", "полупальто")) {
                return "Seasonal environment rule: if the scene is outdoors, use a cool autumn, early spring, or light winter city/park setting; avoid bright summer greenery and beach backgrounds.";
            }
            return "Seasonal environment rule: if the scene is outdoors, match weather to the outerwear warmth; warm jackets/coats need cool-season surroundings, never a hot summer landscape.";
        }
        if (matchesAny(haystack,
                "summer", "linen", "sundress", "beach", "swimwear",
                "летн", "лён", "лен ", "сарафан", "пляж", "купальн")) {
            return "Seasonal environment rule: if the scene is outdoors, use warm spring or summer surroundings appropriate for lightweight clothing.";
        }
        return "Seasonal environment rule: if the scene is outdoors, choose weather and season that naturally match the garment weight and use-case.";
    }

    private static boolean matchesAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
