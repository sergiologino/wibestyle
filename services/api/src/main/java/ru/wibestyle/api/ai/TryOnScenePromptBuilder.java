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

        String sceneKey = resolveSceneKey(session);
        Map<String, String> prompts = settingsService.getTryOnScenePrompts();
        String location = selectStableOption(
                prompts.getOrDefault(sceneKey, prompts.get("default")),
                session
        );
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
                Preserve the exact face, hair, age impression, body shape and anthropometry from image1.
                Preserve the exact garment color, cut, material, print and details from image2.
                Photorealistic premium fashion photography, coherent lighting and shadows, vertical 3:4 framing, PG-safe styling.
                """.formatted(location, pose).trim().replaceAll("\\s+", " ");
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

    private static boolean matchesAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
