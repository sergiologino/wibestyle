package ru.wibestyle.api.ai;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public record GarmentClassification(
        String category,
        String title,
        String source,
        String promptProfile,
        String coverageLevel,
        String moderationRisk,
        boolean hasHumanModel
) {

    private static final Set<String> ALLOWED = Set.of(
            "dress", "top", "pants", "jacket", "shoes", "accessory", "underwear", "sleepwear", "swimwear", "other"
    );

    private static final Set<String> PROMPT_PROFILES = Set.of(
            "standard", "dress", "outerwear", "bottom", "shoes", "accessory", "revealing_safe", "homewear_safe"
    );

    private static final Set<String> COVERAGE_LEVELS = Set.of("normal", "revealing", "intimate");

    private static final Set<String> MODERATION_RISKS = Set.of("low", "medium", "high");

    public GarmentClassification(String category, String title, String source) {
        this(
                category,
                title,
                source,
                promptProfileFor(normalizeCategory(category)),
                coverageLevelFor(normalizeCategory(category)),
                moderationRiskFor(normalizeCategory(category)),
                false
        );
    }

    public GarmentClassification {
        category = normalizeCategory(category);
        title = normalizeTitle(title);
        source = source == null || source.isBlank() ? "fallback" : source;
        promptProfile = normalizePromptProfile(promptProfile, category);
        coverageLevel = normalizeCoverageLevel(coverageLevel, category);
        moderationRisk = normalizeModerationRisk(moderationRisk, category);
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("category", category);
        map.put("title", title);
        map.put("source", source);
        map.put("promptProfile", promptProfile);
        map.put("coverageLevel", coverageLevel);
        map.put("moderationRisk", moderationRisk);
        map.put("hasHumanModel", hasHumanModel);
        return map;
    }

    public static String normalizeCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            return "other";
        }
        String normalized = raw.trim().toLowerCase();
        return ALLOWED.contains(normalized) ? normalized : "other";
    }

    public static String normalizeTitle(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Предмет одежды";
        }
        String trimmed = raw.trim().replaceAll("\\s+", " ");
        if (trimmed.length() > 80) {
            return trimmed.substring(0, 80).trim();
        }
        return trimmed;
    }

    public static String normalizePromptProfile(String raw, String category) {
        if (raw != null && PROMPT_PROFILES.contains(raw.trim().toLowerCase())) {
            return raw.trim().toLowerCase();
        }
        return promptProfileFor(category);
    }

    public static String normalizeCoverageLevel(String raw, String category) {
        if (raw != null && COVERAGE_LEVELS.contains(raw.trim().toLowerCase())) {
            return raw.trim().toLowerCase();
        }
        return coverageLevelFor(category);
    }

    public static String normalizeModerationRisk(String raw, String category) {
        if (raw != null && MODERATION_RISKS.contains(raw.trim().toLowerCase())) {
            return raw.trim().toLowerCase();
        }
        return moderationRiskFor(category);
    }

    public static String promptProfileFor(String category) {
        return switch (normalizeCategory(category)) {
            case "dress" -> "dress";
            case "jacket" -> "outerwear";
            case "pants" -> "bottom";
            case "shoes" -> "shoes";
            case "accessory" -> "accessory";
            case "underwear", "swimwear" -> "revealing_safe";
            case "sleepwear" -> "homewear_safe";
            default -> "standard";
        };
    }

    public static String coverageLevelFor(String category) {
        return switch (normalizeCategory(category)) {
            case "underwear", "swimwear" -> "intimate";
            case "sleepwear" -> "revealing";
            default -> "normal";
        };
    }

    public static String moderationRiskFor(String category) {
        return switch (normalizeCategory(category)) {
            case "underwear", "swimwear" -> "high";
            case "sleepwear" -> "medium";
            default -> "low";
        };
    }
}
